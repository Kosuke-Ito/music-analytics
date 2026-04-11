# 競合データソース対応の調査

## 結論（先に）

**第一優先**: **Deezer API** から始める。公式 API + 認証不要 + 無料 + ファン数取得可能。実装コストが最も低い。

**第二優先**: **YouTube Music**（unofficial `ytmusicapi` 経由）。日本市場で重要だが unofficial のため運用リスクあり。

**保留**: Apple Music（年$99）、SoundCloud（規約上の制約）、LINE Music（API なし）。

詳細は以下の通り。

## 調査背景

competitors.md の調査で、Soundcharts / Chartmetric は10以上のプラットフォームに対応していることが判明。music-analytics は現状 Spotify / YouTube / Last.fm の3つ。データソース拡張を検討する。

## 各サービスの調査結果

### 🟢 Deezer（推奨・第一優先）

| 項目 | 内容 |
|---|---|
| 公式 API | ✅ あり |
| 認証 | ❌ 不要（基本データ） |
| 料金 | ✅ 完全無料 |
| 取得可能 | アーティスト名 / ジャンル / バイオ / **ファン数** / アルバム数 / トップトラック |
| 制約 | デモグラ（性別等）は取得不可 |
| 日本カバレッジ | △ ヨーロッパ強い、日本は中程度 |
| 実装難易度 | ✅ 低 |
| ライセンス | 商用利用に partnership form 経由で確認推奨 |

**実装案**:
- `collector/deezer.py` を新設
- `fetch_deezer_stats(artist_name)` で fans と album count を取得
- ListenerRecord に `deezer_fans` を追加
- 既存と同じパターンで実装可能

**ROI**: ⭐⭐⭐⭐ 高（コスト0、実装速い、グローバル指標補強）

参考: https://developers.deezer.com/

---

### 🟡 YouTube Music（第二優先）

| 項目 | 内容 |
|---|---|
| 公式 API | ❌ なし（YouTube本体は別） |
| 非公式 API | `ytmusicapi` (Python) |
| 認証 | ⚠️ Cookie認証必要（ヘッドレスブラウザ的挙動） |
| 料金 | 無料 |
| 取得可能 | アーティスト情報 / リリース / 関連アーティスト |
| 日本カバレッジ | ✅ 高（日本でもサブスク多い） |
| 実装難易度 | △ 中（unofficial、認証手間） |
| 運用リスク | YouTube の仕様変更で壊れる可能性 |

**実装案**:
- `collector/youtube_music.py` を新設
- `ytmusicapi` を依存追加
- Cookie 認証は GitHub Secrets に格納
- 取得失敗を許容して既存 YouTube データに統合

**ROI**: ⭐⭐⭐ 中（日本で価値高いが運用リスクあり）

参考:
- https://github.com/sigma67/ytmusicapi
- https://pypi.org/project/ytmusicapi/

---

### 🔴 Apple Music

| 項目 | 内容 |
|---|---|
| 公式 API | ✅ MusicKit / Apple Music API |
| 認証 | JWT トークン |
| 料金 | ❌ **Apple Developer Account $99/年** |
| 取得可能 | 楽曲 / アルバム / アーティスト / プレイリスト / チャート / 統計 |
| 日本カバレッジ | ✅ 高 |
| 実装難易度 | ⚪ 中 |

**実装可否**: コスト発生のため、現状の運用方針（無料・低コスト）と整合しない。

**保留理由**:
- 年$99 のコスト
- 無料でアクセスする方法は規約違反リスク
- ROI が見合うのはマネタイズ後

**将来検討タイミング**: マネタイズ後、または年$99 を上回る価値が見えた時

参考: https://developer.apple.com/musickit/

---

### 🔴 SoundCloud

| 項目 | 内容 |
|---|---|
| 公式 API | ✅ あり（要申請） |
| 認証 | OAuth |
| 料金 | 申請承認制 |
| 制約 | **商用利用不可**（一部 non-commercial 用途も不可） |
| 取得可能 | トラック / プレイリスト / ユーザー情報 |

**保留理由**:
- 商用利用が API 規約で禁止
- music-analytics が将来マネタイズした場合に違反となる
- 申請承認プロセスが不透明

参考: https://developers.soundcloud.com/

---

### 🔴 LINE Music

| 項目 | 内容 |
|---|---|
| 公式 API | ❌ **なし** |
| 代替 | LINE Developers は Messaging API のみ |

**結論**: API 提供なし。実装不可能。

将来的に LINE Music が API を公開すれば再検討。日本市場特化のサービスとしては魅力的だが現状手段なし。

---

## 競合と music-analytics のカバレッジ比較（更新）

| データソース | Soundcharts | Chartmetric | music-analytics（現状） | music-analytics（後） |
|---|---|---|---|---|
| Spotify | ✅ | ✅ | ✅ | ✅ |
| YouTube (本体) | ✅ | ✅ | ✅ | ✅ |
| Last.fm | - | - | ✅ | ✅ |
| **Deezer** | ✅ | ✅ | ❌ | ✅ (推奨) |
| **YouTube Music** | ✅ | ✅ | ❌ | △ (第二) |
| Apple Music | ✅ | ✅ | ❌ | ❌ ($99/年) |
| SoundCloud | ✅ | ✅ | ❌ | ❌ (商用不可) |
| LINE Music | ❌ | ✅ | ❌ | ❌ (API なし) |
| TikTok | ✅ | ✅ | (#7) | (#7) |
| Instagram | ✅ | ✅ | (#6) | (#6) |
| Shazam | ✅ | ✅ | ❌ | 未調査 |
| Melon (KR) | ✅ | ✅ | ❌ | 未調査 |

## 実装ロードマップ

### Phase 1: 即実装可能（推奨）
- ✅ **Deezer API 統合** — 単独 Issue 化
  - `collector/deezer.py` 新設
  - `fetch_deezer_stats(artist_name)` 実装
  - ListenerRecord 拡張: `deezer_fans`, `deezer_album_count`
  - フロント表示追加

### Phase 2: 検討あり（運用リスク承知の上）
- ⚪ **YouTube Music (ytmusicapi)** — 単独 Issue 化
  - 日本市場で価値あり
  - Cookie 認証の運用設計が課題
  - 失敗時の graceful fallback 必須

### Phase 3: 保留（将来）
- ❌ Apple Music — マネタイズ後に再検討
- ❌ SoundCloud — 規約変更を待つ
- ❌ LINE Music — API 公開を待つ

### 別Issueで追跡中
- #6 Instagram, #7 TikTok — API 制約大、保留
- #41 SNS（X / BlueSky / Threads）— 別アプローチ

## 推奨ネクストアクション

1. **Deezer 統合 Issue を新規作成** — 実装コストが低く、グローバル指標を補強
2. YouTube Music は別 Issue として残し、Deezer の経験を経てから着手
3. Apple Music / SoundCloud / LINE Music は将来検討タグで保留

## 関連

- doc/competitors.md — 競合サービスの全体像
- collector/scraper.py, youtube.py, lastfm.py — 既存収集モジュール
- #6 Instagram, #7 TikTok — 既存 Issue
- #41 SNS 統合（X 等）

---

*最終更新: 2026-04-12*
