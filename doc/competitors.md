# 競合サービス調査

## Soundcharts（soundcharts.com）

- **カバレッジ**: 1,568万アーティスト、8,400万楽曲
- **プラットフォーム**: Spotify, Apple Music, YouTube, TikTok, Instagram, Deezer, SoundCloud, Shazam, 中国系(NetEase/QQ/KuGou)、Melon等
- **強み**:
  - 87カ国2,500局のラジオエアプレイ追跡
  - 各プラットフォームのサービス開始時点まで遡る過去データ
  - マイルストーンアラート（チャート入り、プレイリスト追加等をリアルタイム通知）
  - 非管理者でも任意アーティストを追跡可能
- **料金**: $10/月(1アーティスト) / $49/月(10アーティスト) / $129/月(PRO無制限)
- **利用企業**: Sony Music, Warner Music Group, Universal Music Group
- **参考URL**:
  - [Soundcharts 公式サイト](https://soundcharts.com/)
  - [Soundcharts Pricing](https://soundcharts.com/pricing)

## Chartmetric（chartmetric.com）

- **カバレッジ**: 1,200万アーティスト、25+プラットフォーム
- **プラットフォーム**: Spotify, Apple Music, YouTube, TikTok, Instagram, Line Music, Melon, Shazam等
- **強み**:
  - 隣接アーティスト発見（ファン層が類似するアーティストを自動検出）
  - クロスプラットフォーム・デモグラフィック比較
  - Sync Placement追跡（TV/映画での楽曲使用のストリーミング影響測定）
  - 3Dグローブによる地理的分布可視化
- **料金**: $9.99/月(1アーティスト) / $60/月(10アーティスト) / $150/月(Premium無制限)
- **参考URL**:
  - [Chartmetric 公式サイト](https://chartmetric.com/)
  - [Chartmetric Pricing](https://chartmetric.com/pricing)

## GROOVE-FORCE（ソニーミュージックグループ）

ソニーミュージック内製のデータ分析プラットフォーム。**4つのモジュール**から構成される大規模システム。日本市場において music-analytics と最も近いビジョンを持つ最重要競合。

### プラットフォームの全体構成

| モジュール | 対象ユーザー | 目的 | 機能 |
|---|---|---|---|
| **GROOVEFORCE 360** | グループ会社の経営層 | 経営指標把握 | 売上等の経営数値の可視化 |
| **GROOVEFORCE ANALYTICS** | 現場担当者（A&R、宣伝） | 販売・配信分析 | CD・ストリーミング売上の分析 |
| **GROOVEFORCE ENGAGEMENT** | マーケティング担当 | ファン属性把握 | アーティスト公式サイト訪問者の属性・興味関心の可視化 |
| **GROOVEFORCE FORECAST** | マーケ・経営 | 売上予測 | AIを使った販売予測 |

### 利用規模と歴史
- **利用規模**: 約1,000人（ソニーミュージックグループのマーケ・宣伝部門 + 親会社のソニーグループ社員）
- **タイムライン**:
  - 2020年10月: 開発開始
  - 2021年6月: 利用開始
  - 2022年7月: リニューアル
  - 2023年12月時点で1,000人規模に拡大

### 思想・背景
- 「**100万人に1枚売る**」（CD時代）から「**1万人に1万回聞いてもらう**」（ストリーミング時代）への戦略転換
- 「担当者の勘」のDX化、データを「地図」のように使う組織変革
- 発売日起点の固定計画 → 販売後の動的対応へ
- 「**ツールがなければ気づけなかった現象**」を発見する仕組み

### 主な機能・データ活用
- ファン層のデモグラフィック分析（年齢・性別・地域）
- SNS利用状況・テレビ視聴傾向の詳細分析
- ペルソナ設定支援
- マルチプラットフォーム統合（SNS / ストリーミング / 物理メディア）
- **「小さなバズ」の検知** — 例: nobodyknows+「ココロオドル」が毎年夏に伸びるパターンを発見し、施策化してリバイバルヒット
- 楽曲再生ユーザーの属性可視化
- タイアップ効果の可視化

### データソース
- アーティスト公式サイトのアクセスデータ
- 調査会社からのアンケートデータ
- 自社購買履歴データ
- **Amazon Marketing Cloud** との連携（匿名化された購買履歴）
- KDDI等パートナー企業からの行動データ（共創プロジェクトで拡張）

### 技術スタック
- **AWS基盤**
- データ統合基盤として複数モジュールを横断分析

### 外部連携の事例
- **KDDI / Flywheel との共創** (2024年〜): 「アーティスト×サービス親和性分析」
  - ソニー所属アーティスト（例: 緑黄色社会）と povo2.0 ユーザーのファン層を分析
  - povo2.0「#ギガ活」キャンペーンに反映
  - 既存のアーティスト→ファン直接接点だけでなく、サービス・商品とのコラボ提案を可能に

### 料金
- 非公開（社内利用 + 業務提携先のみ）

### 参考URL
- [ソニーミュージックGがAWS上にデータ分析基盤（日経クロステック）](https://xtech.nikkei.com/atcl/nxt/column/18/00001/08768/)
- [小さなバズをヒットに変える、データ活用術（日経クロストレンド）](https://xtrend.nikkei.com/atcl/contents/18/00483/00023/)
- [ヒット曲はデータから導けるのか（Impress Watch）](https://www.watch.impress.co.jp/docs/topic/1620911.html)
- [ヒットを生み出し続けるソニーミュージックGの秘策（PigData）](https://pig-data.jp/pigup/music/sonymusic/)
- [KDDI×ソニーミュージック×Flywheel共創（プレスリリース）](https://www.sme.co.jp/pressrelease/news/detail/NEWS001739.html)

### music-analytics との関係性

**ビジョンが最も近い競合**だが、提供形態が根本的に異なる：

| 観点 | GROOVE-FORCE | music-analytics |
|------|------|-----------------|
| 提供形態 | ソニー社内クローズド + 業務提携先 | OSS / オープン |
| 対象 | ソニー所属アーティスト + パートナー | 独立アーティスト・小規模レーベル含む業界全体 |
| 強み | 自社購買履歴・公式サイトアクセスログ等の独自データ資産 | 公開API + スクレイピングで誰でも使える |
| デモグラ分析 | 厚い（年齢/性別/SNS/TV視聴/購買履歴） | 薄い（top_cities程度） |
| ファン理解 | パーソナ・属性ベース | 地理・指標推移ベース |
| 施策×インパクト | 「小さなバズ検知」が中心、明示的な紐付けは弱い | アノテーション機能で時系列に明示的に紐付け |
| 予測機能 | GROOVEFORCE FORECAST（AI予測あり） | なし（将来検討） |
| 海外インパクト分析 | 不明 | 日本→海外フォーカス（差別化点） |
| 技術スタック | AWS + 内製 | Cloudflare Pages + GitHub Actions（軽量） |
| 運用コスト | 大規模・社内開発チーム | 個人運用レベル |
| AI戦略相談 | 不明 | MCP/API連携 + 将来のアプリ内機能（差別化点） |

**差別化の方向性**:
- **オープン性で攻める** — ソニー所属でない独立アーティスト・小規模レーベル・事務所をターゲットに
- **施策とインパクトの明示的な紐付け** — アノテーション機能はGROOVE-FORCEに無い独自価値
- **海外インパクト分析** — 日本アーティストの海外展開フォーカス
- **AI戦略相談 + MCP/CLI連携** — 軽量・モダンなAI活用フローで差別化
- **デモグラ分析では勝負しない** — ソニーは独自データ資産があり真っ向勝負は不利。代わりに「公開可能なシグナル × ニュース × AI解釈」で攻める

## 競合 vs music-analytics サマリ

| 観点 | Soundcharts/Chartmetric | GROOVE-FORCE | music-analytics |
|------|------|------|-----------------|
| 提供形態 | グローバルSaaS | ソニー社内 + 業務提携先 | OSS / 業界向け |
| 対象 | マスマーケット（全アーティスト） | ソニー所属 + パートナー | 業界全体（独立アーティスト含む） |
| 料金 | $10-150/月 | 非公開 | 無料・低コスト運用 |
| 提供範囲 | 汎用指標 + プレイリスト等 | ファン属性 + 売上 + 予測 | 主要指標 + アノテーション |
| データソース強み | 87カ国ラジオ + 多プラットフォーム | 自社購買履歴 + 公式サイトログ + パートナー | 公開API + スクレイピング |
| デモグラ分析 | 中（プラットフォーム別） | 厚（年齢/性別/SNS/TV/購買） | 薄（top_cities） |
| ニュース連動 | なし | なし | Claude自動生成アノテーション |
| 施策インパクト計測 | 限定的 | 「小さなバズ検知」中心 | アノテーション×指標変動の明示的紐付け |
| 海外インパクト分析 | 一般的な地域分布 | 不明 | 日本→海外フォーカス |
| 予測機能 | なし | GROOVEFORCE FORECAST（AI予測） | なし（将来） |
| AI戦略相談 | なし | 不明 | 将来の柱（MCP/API連携） |
| カスタマイズ性 | SaaS固定UI | クローズド | OSS拡張可能 |
| UI/UXのターゲット | アナリスト・マーケター | 社内マーケ | 現場のA&R/マネージャー（直感重視） |

## 参考にできる機能アイデア

### Soundcharts / Chartmetric から
- 地理マップ可視化（TopCities を地図で表示）
- プラットフォーム横断デモグラフィック
- アーティスト類似度・隣接発見（隣接アーティスト発見）
- マイルストーンアラート（Slack/メール通知）
- 楽曲単位のパフォーマンス追跡（Spotify API Extension Request後）
- Sync Placement（TV/映画での使用追跡）

### GROOVE-FORCE から
- **「小さなバズ」検知** — 微細な再生数増加パターンを自動検出して通知
- **アーティスト×サービス親和性** — ファン層の重なりからコラボ候補・タイアップ候補を提案
- **AI売上予測** — 過去データから今後の指標を予測（GROOVEFORCE FORECAST相当）
- ペルソナ設定支援
- 「担当者の勘のDX化」 — 「気づきにくい現象」を自動レポートで通知する仕組み

### music-analytics 独自で攻める領域
- アノテーション × 指標変動の明示的な可視化（既に実装）
- 海外インパクト分析（既に実装）
- AI戦略相談 + MCP/CLI連携（将来）
- ニュースアノテーションの自動生成（既に実装）
- 日本メディアソース連携（#20）

## References（全ソース一覧）

### Soundcharts
- [Soundcharts 公式サイト](https://soundcharts.com/)
- [Soundcharts Pricing](https://soundcharts.com/pricing)

### Chartmetric
- [Chartmetric 公式サイト](https://chartmetric.com/)
- [Chartmetric Pricing](https://chartmetric.com/pricing)

### GROOVE-FORCE / ソニーミュージック
- [ソニーミュージックGがAWS上にデータ分析基盤、個別最適のストリーミング配信強化（日経クロステック, 2023年）](https://xtech.nikkei.com/atcl/nxt/column/18/00001/08768/) — 4モジュール構成・歴史・利用規模・AWS基盤
- [ソニーミュージック 小さなバズをヒットに変える、データ活用術（日経クロストレンド）](https://xtrend.nikkei.com/atcl/contents/18/00483/00023/) — nobodyknows+「ココロオドル」リバイバルヒット事例
- [ヒット曲はデータから導けるのか? 「担当者の勘」をDXするソニーミュージック（Impress Watch）](https://www.watch.impress.co.jp/docs/topic/1620911.html) — ストリーミング時代戦略・「担当者の勘のDX化」・タイアップ効果可視化
- [ヒットを生み出し続けるソニーミュージックグループの秘策（PigData）](https://pig-data.jp/pigup/music/sonymusic/) — 4モジュール（360 / ANALYTICS / ENGAGEMENT / FORECAST）詳細
- [多様化するファンの分析でアーティストとサービスをつなぐマーケティング手法を共創（ソニーミュージック プレスリリース）](https://www.sme.co.jp/pressrelease/news/detail/NEWS001739.html) — KDDI/Flywheel共創、povo2.0×緑黄色社会事例
- [KDDI×ソニーミュージック×Flywheel共創（MUGENLABO Magazine）](https://mugenlabo-magazine.kddi.com/list/sme-flywheel-kddi/)
- [ソニーミュージックグループのDX推進に学ぶ顧客データ活用の課題とその解決策（DataCurrent）](https://www.datacurrent.co.jp/examples/dx_insight_2022_review/)
- [ソニーミュージックとKDDI双方のデータを活用したpovo2.0「#ギガ活」キャンペーン（Musicman）](https://www.musicman.co.jp/business/508155)
- [ソニー・ミュージックエンタテインメント様 AWS導入事例（CEC）](https://cloud.cec-ltd.co.jp/aws/case/06.html)

---

*最終更新: 2026-04-10*
