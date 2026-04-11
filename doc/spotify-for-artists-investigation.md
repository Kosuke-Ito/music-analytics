# Spotify for Artists API 利用可能性調査

## 結論

**判定: ❌ 不採用**

Spotify for Artists API は **公式に存在しない**。OAuth 委任モデルもサポートされていない。
さらに 2026年2月 の Web API 規制で `followers` `popularity` 等の追加データが API から削除された。

**推奨アクション**: 既存の Playwright スクレイピング実装を継続。Extension Request も申請非推奨。

## 調査背景

#27（Spotify Extension Request）が現状申請不可（MAU 250k 要件）と判明したため、代替案として Spotify for Artists の API モデルを検討した。

期待していたシナリオ:
- アーティスト本人が OAuth で committee 委任 → 詳細データ（demographics, 国別 listener, 楽曲別統計等）にアクセス

実際の状況:
- このシナリオを実現する公式 API は **存在しない**
- 非公式手段（ブラウザ自動化）でも実現困難

## 調査結果

### 1. 公式 API は存在しない

Spotify for Artists（https://artists.spotify.com/）は内部ダッシュボードのみで、サードパーティ向けの API は提供されていない。

**Spotify Community の公式回答**:
> "There is no public API available for Spotify for Artists."

**OAuth 委任メカニズム**:
- アーティストが本人データへのアクセスを三者に委任する OAuth scope は存在しない
- 「ユーザーがアーティストかどうか」を判定する API も存在しない

### 2. 2026年2月の API 大規制

Spotify Web API が大幅に削減された（既存ユーザーも対象）：

#### 削除されたエンドポイント
- `GET /artists/{id}/top-tracks` — トップトラック取得廃止
- `GET /artists` — 複数アーティスト情報取得廃止
- アーティスト関連の follow/unfollow

#### 削除されたフィールド
- ❌ **`followers`** — フォロワー情報削除
- ❌ **`popularity`** — 0-100 の人気スコア削除
- ❌ **`genres`** — ジャンル情報削除

参考: [Spotify Developers - February 2026 Web API Changes](https://developer.spotify.com/documentation/web-api/references/changes/february-2026)

#### 残された道
2段階のアクセス階層：

| 段階 | 名称 | 条件 |
|---|---|---|
| **基本** | Development Mode | Premium アカウント + 5ユーザー上限、表面的メタデータのみ |
| **高度** | Extended Quota Mode | 法人 + 250k MAU + 審査合格 |

### 3. Extension Request 申請の現実

| 要件 | music-analytics の状況 |
|---|---|
| 法人登録 | ❌ 個人開発 |
| 250k MAU | ❌ 現状ローンチ前〜数千ユーザー |
| ローンチ済みサービス | ⚠️ 稼働中だが小規模 |
| 商業的妥当性 | ❌ 未マネタイズ |

**過去データ**: 2025年5月以降の申請は **95% 以上が却下** されている。

→ **申請しても時間の浪費になる**

### 4. 取得したいデータの実現可能性

| データ | 取得可否 | 手段 |
|---|---|---|
| Monthly Listeners | ✅ 取得中 | Playwright（既存実装） |
| Followers 数 | ✅ 取得中 | Playwright（既存実装、内部 API） |
| Top Cities（5都市） | ✅ 取得中 | Playwright（既存実装） |
| **Demographics（年齢/性別）** | ❌ **不可** | 公式 API なし、ダッシュボードのみ表示 |
| **国別 Listener 詳細** | ❌ **不可** | 同上 |
| 楽曲別ストリーミング統計 | ❌ **不可** | 同上 |
| プレイリスト掲載状況 | ❌ **不可** | 同上 |
| Genres / Popularity | ❌ **不可** | 2026年2月削除 |

### 5. 競合の実態

Soundcharts / Chartmetric は **Spotify との直接パートナーシップ** で高度なアクセス権を持っている可能性が高い：
- これは Extended Quota Mode の前から続く「レガシーパートナーシップ」と推定
- 新規参入者には事実上閉ざされている

GROOVE-FORCE は **自社購買履歴・公式サイトログ・Amazon Marketing Cloud** で独自のデモグラ分析を実現しており、Spotify API には依存していない。

### 6. 非公式手段の評価

#### 現在の実装: Playwright + api-partner.spotify.com

```python
# collector/scraper.py
# Spotify Web Player の内部 API レスポンスをインターセプト
# 取得: monthly_listeners, followers, top_cities
```

**評価**: ⭐⭐⭐ 実用的

| 観点 | 評価 |
|---|---|
| 実装コスト | ✅ 0（既に完成） |
| 運用コスト | ✅ 0（GitHub Actions 無料枠） |
| 取得データ範囲 | ⭐⭐⭐ Spotify の主要指標 |
| Spotify 仕様変更耐性 | ⭐⭐ 中（変更時に修正必要） |
| 法的リスク | ⚠️ グレーゾーン |

#### 別案: artists.spotify.com にログインして取得

- **実装難易度**: 中〜高（Cookie 管理、2FA 対応）
- **安定性**: 低
- **法的リスク**: 高（明確に規約違反の可能性）
- **判定**: ❌ 採用しない

#### 別案: Soundcharts / Chartmetric 等の有料 SaaS

- **コスト**: $10〜150/月
- **メリット**: 公式パートナーシップで安定、デモグラ込み
- **デメリット**: 運用方針（無料・低コスト）と相反
- **判定**: マネタイズ後に再検討

## ビジョン適合性

CLAUDE.md の方針:
> "デモグラ分析では勝負しない": ソニーは独自データ資産で強い。代わりに「公開可能なシグナル × ニュース × AI解釈」で攻める。

| 観点 | music-analytics ビジョン | Spotify for Artists API | 適合 |
|---|---|---|---|
| オープン性 | 業界全体向け、誰でも使える | アーティスト本人のみ | ❌ |
| 全アーティストカバレッジ | 独立アーティスト含む | Enterprise 契約必須 | ❌ |
| 施策インパクト計測 | アノテーション×指標変動 | API 非提供 | ❌ |
| 公開シグナル重視 | 公式 API + スクレイピング | 非公開データ依存 | ❌ |
| 運用コスト最小化 | 無料・低労力 | 高額契約 | ❌ |

→ **ビジョンと根本的に不適合**

## 推奨ネクストアクション

### 1. 現在の実装を継続 ✅

- Playwright スクレイピング（既存実装）を維持
- CI/CD で定期的な健全性チェック
- Spotify 仕様変更時の素早い対応体制

### 2. Extension Request は申請しない ❌

- 申請却下率 95%、時間の浪費
- 250k MAU 達成後に再検討

### 3. 別軸でデータ拡張

doc/competitor-data-sources.md と統合して以下を進める:
- ✅ **YouTube Music（#43）** — 実装済み（monthly_listeners 相当データ取得）
- ⏸️ **Apple Music（#44）** — 将来検討（$99/年コスト）
- ⏸️ **Tencent Music（#46）** — 将来検討
- ❌ **Deezer（#42 closed）** — 規模小で見送り

### 4. デモグラ分析の代替戦略

Spotify からデモグラが取れない以上、別アプローチで:
- top_cities + lastfm_countries で**国別比率の推定**（既存）
- ニュース・アノテーションからの**定性的推定**
- ファン層の**コラボ候補発見**（#30 アーティスト×サービス親和性分析）

## 関連

- #27 (closed) Spotify Extension Request — 申請不可
- #38 本Issue（spike）
- #43 YouTube Music 統合（代替実装済み）
- doc/competitors.md
- doc/competitor-data-sources.md
- doc/alternative-data-sources.md
- collector/scraper.py — 既存 Playwright 実装

## Sources

- [Spotify for Developers - Web API](https://developer.spotify.com/documentation/web-api)
- [Spotify Web API Changelog - February 2026](https://developer.spotify.com/documentation/web-api/references/changes/february-2026)
- [Spotify Quota Modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
- [Updating the Criteria for Web API Extended Access (2025-04)](https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access)
- [Spotify Community - "Spotify for artists API"](https://community.spotify.com/t5/Spotify-for-Developers/Spotify-for-artists-API/td-p/5067109)
- [TechCrunch - Spotify changes developer mode API (2026-02)](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)
- [Spotify's API Lock-Down (Medium analysis)](https://medium.com/@apollinereymond/spotifys-api-lock-down-the-end-of-open-data-for-the-music-business-0a9bf07dba27)

---

*最終更新: 2026-04-12*
