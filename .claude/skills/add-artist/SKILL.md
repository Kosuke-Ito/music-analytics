---
name: add-artist
description: music-analytics プロジェクトに新しいアーティストを追加する。Spotify URL（必須）と YouTube チャンネル URL（任意）から config.json に新規エントリを作成し、コミット&プッシュ。バッチがリモートで自動起動して数分でデータが揃う。
---

# Add Artist

music-analytics プロジェクトに新しいアーティストを追加するための skill。

## トリガー

ユーザーが以下のような依頼をしたら起動する：

- 「YOASOBI を追加して」
- 「このアーティストをトラッキング対象に入れて」+ Spotify URL
- 「Spotify URL: ... / YouTube: ... を追加」

## 入力情報

最低限必要：
- **Spotify アーティスト URL**（例: `https://open.spotify.com/artist/0u2P5u6lvoDfwTYjAADbn4`）

任意：
- **YouTube チャンネル URL**（例: `https://www.youtube.com/channel/UCi3DaIeq8b6jHjkrdZ3rJrA`）または チャンネル名
- **region**: `jp`（日本アーティスト）または `global`（海外アーティスト）— 不明なら ユーザー名/URL から推測
- **label**: 既存ラベル（`Ariola Japan` / `Echoes`）に該当する場合のみ。所属不明なら省略
- **live_attendance**: 年別動員数。情報があれば

## 実行ステップ

### 1. URL を解析

#### Spotify
- URL から ID 抽出: `/artist\/([a-zA-Z0-9]+)/` の matched group
- 例: `https://open.spotify.com/artist/0u2P5u6lvoDfwTYjAADbn4` → `0u2P5u6lvoDfwTYjAADbn4`

#### YouTube
- パターン1: `youtube.com/channel/UCxxxxxx` → 直接 channel_id 取得
- パターン2: `youtube.com/@username` または `youtube.com/c/customname` → YouTube Data API で channel_id 解決必要
- パターン2 の場合は WebFetch でチャンネルページを取得し、HTML 内の `channelId` メタタグから抽出

### 2. アーティスト情報取得

Spotify アーティストページを WebFetch で取得し、以下を確認：
- 正式なアーティスト名（日本語/英語表記の優劣を判断）
- Followers 数（参考情報）
- 既存のアーティストか確認（重複チェック）

```
WebFetch: https://open.spotify.com/artist/{spotify_id}
prompt: アーティストの正式名称、フォロワー数、ジャンルを抽出してください
```

### 3. config.json を更新

`scripts/config.json` を読み込み、`artists` 配列に新規エントリを追加：

```json
{
  "id": "<slug>",
  "name": "<正式名称>",
  "spotify_artist_id": "<spotify_id>",
  "youtube_channel_id": "<channel_id>",
  "region": "jp" or "global",
  "label": "Ariola Japan" or "Echoes" (該当時のみ)
}
```

#### id (slug) のルール

アーティスト名から導出：
- 小文字化
- スペース → `-`
- 記号削除（`'` `"` `,` `.` 等）
- 例:
  - `YOASOBI` → `yoasobi`
  - `King Gnu` → `king-gnu`
  - `Mrs. GREEN APPLE` → `mrs-green-apple`
  - `Official髭男dism` → `official-hige-dandism` (ローマ字化が望ましい)
  - `平井堅` → `ken-hirai` (ローマ字化)
  - `米津玄師` → `kenshi-yonezu` (ローマ字化)

日本語名のアーティストは **id をローマ字** にする。`name` フィールドは日本語のまま保持。

#### 重複チェック

既存の `artists[]` で以下のいずれかが一致したら **重複エラー**:
- `id` が同じ
- `spotify_artist_id` が同じ

#### 挿入位置

- region: `jp` の場合 → 既存 jp アーティストの**末尾**（global 開始の直前）に挿入
- region: `global` の場合 → 配列の**末尾**

#### フィールドの順序（重要）

既存エントリのフィールド順序を守る：
1. `id`
2. `name`
3. `spotify_artist_id`
4. `youtube_channel_id` (任意)
5. `region`
6. `label` (任意)
7. `live_attendance` (任意)

### 4. コミット & プッシュ

Conventional Commits 形式で：

```bash
git add scripts/config.json
git commit -m "feat: add <artist name> via skill

- Spotify ID: <spotify_id>
- YouTube: <channel_id or N/A>
- Region: <jp/global>
- Label: <label or N/A>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git pull --rebase
git push
```

### 5. データ取得トリガー（自動）

push 後、以下のいずれかが自動でデータ取得を開始する：
- **option A**: GitHub Actions の collect.yml が次回 cron (UTC 00:00) に該当アーティストを処理
- **option B**: ユーザーが web フォームから追加した場合は workflow_dispatch で即時起動（既存機能、Issue #28）

skill 経由で追加する場合は option A になるため、ユーザーには「次回バッチ（UTC 00:00 = JST 09:00）から収集が始まります」と伝える。

即時取得したい場合は手動で起動：
```bash
gh workflow run collect.yml -f artist_id=<new_artist_id>
```

### 6. 結果報告

以下の情報をユーザーに伝える：
- 追加したアーティスト名と id
- config.json への変更概要
- コミット URL（`gh` コマンドで取得可能）
- 次のステップ（バッチ実行予定 or 手動トリガー方法）

## 注意事項

### 文字エンコード
- config.json は UTF-8。日本語が文字化けしないよう `git add` 前に `jq` で check 推奨：
  ```bash
  jq '.' scripts/config.json | head -30
  ```

### YouTube channel_id が見つからない場合
- `null` や省略でOK（kano, nichimezo の例あり）
- ただし YouTube データは取得できなくなる旨をユーザーに伝える

### live_attendance
- 年別動員数（数値）。情報があれば追加：
  ```json
  "live_attendance": { "2023": 230000, "2024": 380000 }
  ```

### label
- 現状サポート: `Ariola Japan`, `Echoes`
- 新規ラベルを追加する場合は、サイドバーフィルタに自動反映される（特別な対応不要）

### Region 判定
- アーティストが日本人 / 日本のグループ → `jp`
- 海外アーティスト → `global`
- 微妙なケース（日本拠点の国際グループ等）はユーザーに確認

## 関連

- 既存 Web フォーム: `frontend/src/components/AddArtistForm.tsx`
- 既存 API: `frontend/functions/api/add-artist.js`
- 設定ファイル: `scripts/config.json`
- 収集 workflow: `.github/workflows/collect.yml`
- データ収集ロジック: `collector/main.py`
