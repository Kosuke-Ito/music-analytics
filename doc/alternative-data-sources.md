# 代替データソース調査と統合検討

## 結論（先に）

3つのオープンデータソースを調査した結果：

| サービス | 判定 | 理由 |
|---|---|---|
| **MusicBrainz** | 🟡 **保留 → 中期で採用検討** | メタデータの質は最高、日本アーティストカバレッジ◎、ただし施策インパクト計測の主軸とは別軸 |
| **ListenBrainz** | 🟡 **保留** | CC0 でクリーンだが、日本アーティストのデータ量が Last.fm より少ない |
| **AcousticBrainz** | ❌ **不採用** | プロジェクト終了済み（2022年に新規データ受け入れ停止） |

**推奨アクション**: 現状の Spotify / YouTube / YouTube Music / Last.fm パイプラインに集中。MusicBrainz は将来「メタデータ補強層」として組み込み余地あり。

## 現状のデータソース構成

```
collector/
  scraper.py        ← Spotify (Playwright, monthly_listeners + followers + top_cities)
  youtube.py        ← YouTube Data API v3 (subscribers, views, video_count)
  youtube_music.py  ← YouTube Music (ytmusicapi, monthly_listeners + subscribers)
  lastfm.py         ← Last.fm API (listeners, scrobbles)
```

代替データソースを評価する際の判断軸：
- 既存ソースとの差別化
- 日本アーティストのカバレッジ
- music-analytics のビジョン（業界向け、施策インパクト計測）への貢献
- 運用コスト（無料・低労力）
- ライセンス（商用利用可）

---

## 1. MusicBrainz 🟡 保留 → 中期で採用検討

### 概要

| 項目 | 内容 |
|---|---|
| **公式 API** | https://musicbrainz.org/ws/2/ |
| **ライセンス** | CC0（コアデータ）/ CC-BY-NC-SA（補足データ） |
| **商用利用** | 可（MetaBrainz との契約推奨） |
| **認証** | 不要（読み取り） |
| **レート制限** | 1 req/sec（無料）/ 50 req/sec（特定アプリ）/ 300 req/sec（商用契約） |
| **データ形式** | JSON / XML |
| **必須条件** | User-Agent ヘッダー |

### 取得可能データ（YOASOBI 例）

```json
{
  "id": "df6c619f-4334-43e2-8b6a-4a32af1e4f85",
  "name": "YOASOBI",
  "type": "Group",
  "country": "JP",
  "area": { "name": "Japan" },
  "life-span": { "begin": "2019-09-30", "ended": false },
  "isnis": ["0000000491367931"],
  "tags": [
    { "name": "j-pop", "count": 6 },
    { "name": "pop", "count": 1 }
  ]
}
```

`?inc=url-rels+genres+tags` で追加取得：
- **外部 ID マッピング**: Spotify, YouTube, Last.fm, Discogs, BandsInTown
- **ジャンル**: j-pop, pop, electropop
- **メンバー / 出身地 / 起動日**

### 日本アーティストのカバレッジ

| アーティスト | 登録 | メタデータ充実度 |
|---|---|---|
| YOASOBI | ✅ | ⭐⭐⭐⭐⭐（メンバー、楽器、ISNI） |
| 米津玄師 | ✅ | ⭐⭐⭐⭐⭐（生年月日、出身地） |
| King Gnu | ✅ | ⭐⭐⭐⭐ |
| Mrs. GREEN APPLE | ✅ | ⭐⭐⭐⭐ |
| 平井堅 | ✅ | ⭐⭐⭐⭐⭐ |

→ **J-POP 主流アーティストは完全網羅**

### 統合価値

**強み**:
- ✅ アーティストの正規化されたメタデータ（出身地、生年月日、ISNI）
- ✅ 完全なディスコグラフィ（Spotify より詳細な場合あり）
- ✅ クロスプラットフォーム ID の正引き・逆引き
- ✅ 完全無料、CC0 で安全

**弱み**:
- ❌ 静的メタデータのみ（リスナー数、再生数なし）
- ❌ 施策インパクト計測（ビジョンの中核）には貢献しない
- ⚠️ 商用利用には MetaBrainz との契約推奨（曖昧）

### 推奨タイミング

**現状は保留**。以下のいずれかが発生したら統合検討：
- フロントエンドにアーティスト詳細ページを充実させたい時
- 「アーティスト×サービス親和性分析」（#30）でジャンル分類が必要になった時
- リリース履歴を時系列で見たい時（楽曲単位パフォーマンス追跡 #23）

### 実装イメージ（将来）

```python
# collector/musicbrainz.py
def search_artist_mbid(artist_name: str) -> str | None:
    """アーティスト名から MBID を検索"""

def fetch_artist_metadata(mbid: str) -> dict:
    """MBID から詳細メタデータ + 外部 ID を取得"""
```

実装コスト: 100-150 行 + テスト50行 = **2-3 人日**

---

## 2. ListenBrainz 🟡 保留

### 概要

| 項目 | 内容 |
|---|---|
| **公式 API** | https://api.listenbrainz.org/1/ |
| **ライセンス** | CC0（パブリックドメイン） |
| **商用利用** | 完全に許可 |
| **認証** | オプション（なしで取得可能） |
| **レート制限** | 1 req/sec 推奨 |
| **運営** | MetaBrainz Foundation（活発） |
| **位置付け** | Last.fm のオープンソース代替 |

### 取得可能データ（YOASOBI 例、月次）

```json
{
  "artist_mbid": "df6c619f-...",
  "artist_name": "YOASOBI",
  "total_listen_count": 24983,
  "total_user_count": 1477,
  "range": "month"
}
```

エンドポイント:
- `GET /1/stats/artist/{mbid}/listeners` — リスナー統計
- `GET /1/stats/artist/{mbid}/listening-activity` — 時系列
- `GET /1/popularity/top-recordings-for-artist/{mbid}` — トップ楽曲

### Last.fm との比較

| 観点 | Last.fm | ListenBrainz |
|---|---|---|
| ユーザーベース | ~6,000万 | ~500万 |
| 日本ユーザー | やや多い | より少ない |
| API 認証 | API Key 必須 | 不要 |
| ライセンス | 商用利用要確認 | **CC0（完全自由）** |
| データ鮮度 | リアルタイム | 1時間遅延 |
| 国別データ | 限定的 | 不提供 |

### 日本アーティストのカバレッジ

| アーティスト | ListenBrainz 月間ユーザー | Last.fm |
|---|---|---|
| YOASOBI | 1,477 | より多い |
| 米津玄師 | ~400 | より多い |
| King Gnu | ~300 | より多い |

**結論**: ListenBrainz の日本データは Last.fm より少ない。

### 統合価値

**強み**:
- ✅ CC0 で完全に商用利用可能（Last.fm より明確）
- ✅ MBID ベースでクロス参照容易（MusicBrainz と統合可能）
- ✅ 認証不要、レート制限が緩い
- ✅ MetaBrainz の活発な運営

**弱み**:
- ❌ 日本アーティストのデータが Last.fm より少ない
- ❌ 既存 Last.fm と機能重複が大きい
- ❌ ユーザー数が少ない（サンプルバイアスが Last.fm 以上）

### 推奨タイミング

**現状は保留**。Last.fm の方が日本ユーザー含めてカバレッジ広い。
ただし、ListenBrainz は **「グローバル指標」** として補完的に使う余地あり。

将来検討すべきタイミング:
- Last.fm の API 規約変更や有料化が起きた時
- 「Spotify よりグローバル」な指標が欲しい時（YouTube Music の monthly listeners と組み合わせ）

---

## 3. AcousticBrainz ❌ 不採用

### 結論

**プロジェクトが2022年に新規データ受け入れを停止**しているため、不採用。

### 状況

| 項目 | 状態 |
|---|---|
| **データ収集** | ❌ 2022年2月に停止 |
| **API 稼働** | ✅ 引き続き利用可能 |
| **メンテナンス** | ❌ フリーズ（緊急バグ対応のみ） |
| **最終更新** | 2022年7月 |

### 不採用理由

1. **新曲対応が一切ない** — music-analytics は日次更新で新規データを取得する設計、AcousticBrainz の停止状態と相反
2. **#23 楽曲単位パフォーマンス追跡** との相性が悪い（新曲リリース直後の音響特徴を取得できない）
3. **代替手段も限られる**:
   - **Spotify Audio Features API**: 2024年11月に新規アプリ向けアクセス廃止 ❌
   - **ReccoBeats**: 要追加調査
   - **Essentia (ローカル)**: 楽曲ファイルの取得が前提で運用負荷大

### 将来再評価の条件

- AcousticBrainz が再開した場合
- ReccoBeats が成熟した場合
- 楽曲単位での音響特徴取得が music-analytics の中核機能になった場合

---

## 4. 比較サマリー

| 観点 | MusicBrainz | ListenBrainz | AcousticBrainz |
|---|---|---|---|
| **プロジェクト状態** | 🟢 アクティブ | 🟢 アクティブ | 🔴 凍結 |
| **ライセンス** | 🟡 CC0 + CC-BY-NC-SA | 🟢 CC0 | 🟢 CC0 |
| **日本カバレッジ** | 🟢 高 | 🟡 中 | 🔴 不明 |
| **既存ソースとの差別化** | 🟢 メタデータ層 | 🔴 Last.fm と重複 | 🟡 楽曲特徴は独自 |
| **ビジョン適合度** | 🟡 中（メタデータ） | 🔴 低 | 🔴 低 |
| **実装コスト** | 🟢 低（150行） | 🟢 低 | - |
| **判定** | 🟡 中期検討 | 🟡 保留 | ❌ 不採用 |

---

## 5. 推奨ロードマップ

### 短期（〜3ヶ月）
- **すべて保留** — 現状の Spotify / YouTube / YouTube Music / Last.fm パイプラインに集中
- 既存データソースの活用と分析機能の充実が優先

### 中期（3〜6ヶ月）
- **MusicBrainz の部分統合検討**
  - 想定ユースケース: アーティスト詳細ページの充実、ジャンル分類、外部ID マッピング
  - 統合範囲: メタデータ取得のみ（リアルタイム性なし）
  - 必要時に新規 Issue を起票

### 長期（6ヶ月以降）
- **ListenBrainz の補助統合**
  - Last.fm と並行運用、グローバル指標の補強
- **AcousticBrainz の状況変化を観察**
  - プロジェクトが再開した場合、または ReccoBeats 等の代替が成熟した場合に再検討

---

## 6. 推奨ネクストアクション

1. ✅ **本ドキュメントを doc/ にコミット**（成果物）
2. **#39 をクローズ**（spike 完了）
3. **#38 spike: Spotify for Artists API 調査** に進む
4. MusicBrainz / ListenBrainz は将来の Issue 化候補としてバックログに残す（今は新規 Issue を作らない）

## 関連

- doc/competitor-data-sources.md
- doc/storage-options.md
- collector/lastfm.py (既存類似実装)
- collector/youtube_music.py (#43 で実装済み)
- #23 楽曲単位パフォーマンス追跡（AcousticBrainz と関連）

## Sources

- [MusicBrainz API Documentation](https://musicbrainz.org/doc/MusicBrainz_API)
- [MusicBrainz Data License](https://musicbrainz.org/doc/About/Data_License)
- [ListenBrainz API Documentation](https://listenbrainz.readthedocs.io/)
- [AcousticBrainz - Discontinuation announcement](https://community.metabrainz.org/t/acousticbrainz-making-a-hard-decision-to-end-the-project/572828)
- [MetaBrainz Foundation](https://metabrainz.org/)

---

*最終更新: 2026-04-12*
