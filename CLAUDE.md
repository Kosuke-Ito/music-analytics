# music-analytics

**音楽関係者向け**のデータドリブンな戦略立案ツール。アーティストの今後のリリースやプロモーション戦略を、データと相談（AI活用）に基づいて策定するためのプロダクト。

実行した施策（リリース・タイアップ・ツアー等）のインパクトをデータで確認し、次の作戦に活かすPDCAサイクルを支援する。

Spotify / YouTube / Last.fm の指標を日次収集し、ニュースアノテーション付きで可視化する。

## アーキテクチャ

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│ collector/   │ →  │ data/*.json     │ →  │ frontend/    │
│ (Python)     │    │ (Git管理)       │    │ (React)      │
└──────────────┘    └─────────────────┘    └──────────────┘
   GitHub Actions      日次コミット          Cloudflare Pages
   UTC 00:00 daily                          (自動デプロイ)
```

- **collector** (Python 3.12): Playwright で Spotify をスクレイピング、YouTube/Last.fm は公式 API を利用
- **data/{artist_id}.json**: 日次レコードとアノテーションを蓄積（Git管理）
- **frontend** (Vite 8 + React 19 + TypeScript): JSONを直接 fetch して可視化
- **scripts/config.json**: アーティスト一覧。`frontend/public/config.json` はシンボリックリンク

## ディレクトリ構造

```
collector/         Python データ収集
  main.py          メイン収集ロジック
  scraper.py       Spotify Playwright スクレイピング
  youtube.py       YouTube Data API
  lastfm.py        Last.fm API
  storage.py       JSONストレージ・バリデーション
  tests/           pytest テスト
frontend/
  src/
    components/    Reactコンポーネント
    hooks/         カスタムフック (useArtistData, useDateRange等)
    utils/         汎用ユーティリティ (format, geography, aggregate, metrics)
    constants/     定数 (chart, annotation)
    styles/        CSS (機能別分割)
    types/         TypeScript型定義
    __tests__/     Vitest テスト
data/              収集データ (JSON, Git管理)
scripts/config.json アーティスト設定
.github/workflows/ GitHub Actions
  collect.yml      データ収集 (UTC 00:00 daily)
  annotate.yml     ニュース収集 (UTC 01:00 daily, Claude Code Action)
doc/               競合調査などのドキュメント
```

## よく使うコマンド

### Frontend (`cd frontend`)
```bash
pnpm dev          # 開発サーバー
pnpm test         # Vitest 全テスト
pnpm test:watch   # ウォッチモード
pnpm build        # tsc + vite build
pnpm lint         # ESLint
```

### Collector (Python)
```bash
cd collector
python -m collector.main          # 収集実行
pytest                            # テスト
```

### 環境
- mise で Python 3.12 + Node 20 を管理
- frontend は pnpm
- ルートに package.json はないので `pnpm dev` 等は frontend ディレクトリで

### GitHub Actions 手動実行
```bash
gh workflow run collect.yml       # データ収集を手動トリガー
gh run list --workflow=collect.yml --limit 5
```

## 開発スタイル

### TDD
- 新機能はテストファーストで実装する
- フロントエンドは Vitest、Python は pytest
- 外部APIの振る舞いが必要な場合は **モックではなくスタブ** を優先

### Conventional Commits
```
feat:     新機能
fix:      バグ修正
refactor: リファクタリング
improve:  既存機能の改善
chore:    ビルド・補助
docs:     ドキュメント
```

### コードスタイル
- TypeScript: 型推論を活用、必要なところだけ明示的型注釈
- ハードコード色は使わず CSS変数 (`--accent`, `--positive` 等) を参照
- 共通ロジックは `utils/`、定数は `constants/` に集約

## データソースの特性と注意点

### Spotify (Playwright スクレイピング)
- 公式APIに月間リスナー数が無いため `api-partner.spotify.com` をインターセプト
- **TopCities は上位5都市のみ**（ページネーション不可）
- Spotify がページ構造を変えると壊れる可能性あり
- リトライ機構あり（最大3回、5秒間隔）

### YouTube Data API v3
- 登録者数は YouTube 側で丸められた値（100万以上は万単位）→ 細かい変動は見えない
- 過去履歴は取得不可、毎日蓄積する必要あり

### Last.fm
- ヘビーリスナーのみが対象（カジュアルリスナー含まれない）→ サンプルバイアスあり
- 累計再生回数はSpotifyでは取れない貴重な指標

## ホスティング

- **Cloudflare Pages** (`artist-analytics.pages.dev`)
- GitHub連携で main ブランチへの push で自動デプロイ
- Basic認証は環境変数 `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` で制御
  - 環境変数が未設定なら認証スキップ（`frontend/functions/_middleware.js`）
- Web Analytics 有効化済み

## プロダクトビジョン

### ターゲット
音楽関係者（レーベル、マネジメント、プロモーター、A&R、アーティスト本人）。
特にA&Rやマネージャーは現場仕事で忙しい層なので、**直感的に確認できるUI**を最優先する。

### 提供価値
1. **戦略立案**: アーティストの次のリリースやプロモーション施策を、データと相談で組み立てる
2. **施策インパクトの可視化**: 実行した施策（リリース・タイアップ・ツアー・コラボ等）が指標にどう影響したかを定量で把握
3. **PDCAサイクル**: 計測 → 学習 → 次の戦略 のループを回す

### 差別化の柱
- **日本アーティストファースト**: 日本メディア（音楽ナタリー、Billboard Japan、Oricon等）からのニュース収集
- **施策×指標の紐付け**: アノテーション機能で「いつ何を仕掛けて、どう動いたか」を時系列で記録（GROOVE-FORCEにない独自価値）
- **海外インパクト分析**: 日本のアーティストが海外（特にアジア）でどう受け入れられているか
- **オープン性**: ソニーのGROOVE-FORCE（社内クローズド + 業務提携先のみ）と違い、独立アーティスト・小規模レーベル・マネジメント事務所も利用可能
- **AI戦略相談**: データを基に次の作戦を相談できる体験。MCP/API/CLI経由での外部AIツール連携を主軸に（将来の柱）
- **デモグラ分析では勝負しない**: ソニーは独自データ資産（自社購買履歴・公式サイトログ）で強い。代わりに「公開可能なシグナル × ニュース × AI解釈」で攻める

### AI相談機能の方向性（将来）
- 過去データから「強み・弱み」を自動抽出
- 次の施策の提案（リリースタイミング、コラボ候補、ターゲット地域等）
- アーティストの戦略立案サポート
- **2つの提供形態を想定**:
  1. **MCP / API / CLI 経由**: 外部のAIツール（Claude Code等）から直接データを吸い上げて活用してもらう
  2. **アプリ内提供**: そういう運用ができないユーザー向けに、ある程度の戦略提案はこちらで作って提供

### 機能検討の判断基準
- 「音楽関係者が次の作戦を考える時に役立つか」
- 「施策のインパクトを測るのに必要か」
- 「日本のアーティスト・市場の文脈に合うか」
- 「忙しい現場担当者が直感的に使えるか」

### Non-goals（やらないこと）

判断ブレを防ぐため、明示的に **やらないこと** を定義する：

- **マスマーケット向け汎用ツールにはしない** — 業界特化サービスに振り切る
- **超高機能・多機能化はしない** — A&Rやマネージャーは現場で忙しい。直感的に確認できることを優先
- **複雑な運用は避ける** — できるだけシンプルに、運用コスト（金額・労力）を抑える
- **重厚なインフラは持たない** — JSONベースで十分動く間はDB化しない。限界が来たらSupabase等の軽量SaaSで補う
- **アクセシビリティへの過剰投資はしない** — モバイルレスポンシブも基本対応のみ。ただしUI/UXの磨き込みには投資する

詳細: `doc/competitors.md`（Soundcharts / Chartmetric / GROOVE-FORCE）

## 既知の制約

- **Spotify Development mode**: followers/genres/popularity 等の追加データは未取得（Extension Request 未提出）
- **データ量**: 41アーティスト × 日次レコードは現状JSON管理で十分。限界が来たら Supabase / Cloudflare D1 等の軽量SaaSへ
- **2アーティスト**（kano, nichimezo）は YouTube Channel ID が `null`

## 運用方針

- **コスト最小化**: 金銭・労力ともにできるだけ低く運用したい
  - Cloudflare Pages は無料枠
  - GitHub Actions の無料枠で日次収集
  - データはJSON + Gitで管理（DB不要）
- **限界が来たら**: Supabase（認証・DB）等の軽量SaaSで段階的に拡張する
- **複雑な仕組みは避ける**: シンプルさを優先する
