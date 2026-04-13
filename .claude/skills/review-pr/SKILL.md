---
name: review-pr
description: オープンなプルリクエストを複数の専門エージェントで包括的にレビューし、オプションでGitHubにレビューを投稿
argument-hint: "<PR番号> [aspects] [parallel]"
---

## 引数

- `$ARGUMENTS`: PR番号またはURL。オプションでレビュー観点と実行モードを指定可能。

### レビュー観点（aspects）
- **code** — コード品質・プロジェクト標準への準拠
- **errors** — サイレント障害・エラーハンドリングの妥当性
- **tests** — テストカバレッジの品質と網羅性
- **types** — 型設計・不変条件の分析
- **comments** — コメントの正確性・長期保守性
- **simplify** — コードの簡素化提案
- **all** — 全観点を実行（デフォルト）

### 実行モード
- **parallel** — 全エージェントを並列実行（デフォルト）
- **sequential** — エージェントを順次実行

## タスク

### ステップ1: PRをチェックアウトしコンテキストを収集

```
gh pr checkout <PR番号>
gh pr view <PR番号>
gh pr diff <PR番号>
```

変更されたファイル一覧を `git diff --name-only` で取得する。

### ステップ2: 適用するレビュー観点を決定

引数で観点が指定されていればそれに従う。指定がなければ（= `all`）変更内容から自動判定:

- **code**: 常に適用
- **errors**: try-catch、Result型のエラーブランチ、fallback ロジックが含まれる場合
- **tests**: テストファイルが変更されている、またはテスト対象のコードが変更されている場合
- **types**: 型定義やスキーマが追加・変更されている場合
- **comments**: コメントやドキュメントが追加・変更されている場合
- **simplify**: code レビュー通過後の仕上げとして適用

### ステップ3: レビューエージェントを起動

Agentツールで各専門エージェントを起動する。PRの diff と変更ファイル情報をプロンプトに含める。

各エージェントは `general-purpose` タイプで起動し、以下の専門的なプロンプトを渡す:

| 観点 | エージェント名 | 専門領域 |
|------|---------------|---------|
| code | code-reviewer | コード品質・プロジェクト標準準拠・命名規則・構造 |
| errors | silent-failure-hunter | サイレント障害・エラーハンドリング漏れ・例外の握りつぶし |
| tests | pr-test-analyzer | テストカバレッジ・エッジケース・テストの信頼性 |
| types | type-design-analyzer | 型安全性・不変条件・スキーマ設計 |
| comments | comment-analyzer | コメントの正確性・過不足・長期保守性 |
| simplify | code-simplifier | 重複排除・抽象化・コード量削減の提案 |

**parallel モード（デフォルト）**: 全エージェントを1つのメッセージで同時に起動。
**sequential モード**: 1つずつ順番に起動し、結果を確認してから次へ。

各エージェントには以下を伝える:
- PR番号
- `gh pr diff <PR番号>` で取得した diff
- 変更されたファイル一覧
- 対象の観点に応じた専門的な指示
- プロジェクトの CLAUDE.md の内容（コーディング規約の参照用）

### ステップ4: 結果を統合して提示

全エージェントの結果を以下の形式に統合する:

```markdown
## PR レビュー: #<PR番号>

**推奨**: APPROVE | REQUEST_CHANGES | COMMENT

### 概要
[PRの目的と変更内容の1-2文要約]

### クリティカルな問題（N件）
- [エージェント名] `file:line` — 問題の説明

### 重要な問題（N件）
- [エージェント名] `file:line` — 問題の説明

### 提案（N件）
- [エージェント名] `file:line` — 提案の説明

### 良い点
- [うまくできていた点]

### 実行したレビュー
- [x] code-reviewer
- [x] silent-failure-hunter
- [ ] pr-test-analyzer（スキップ: テスト変更なし）
- ...
```

**推奨の判定基準:**
- クリティカルな問題が1件でもあれば → `REQUEST_CHANGES`
- 重要な問題のみ → `COMMENT`（+ 問題を挙げる）
- 提案のみ or 問題なし → `APPROVE`

### ステップ5: GitHub投稿の確認

AskUserQuestionツールで確認:
- このレビューをGitHubに投稿するか
- アクション: APPROVE / REQUEST_CHANGES / COMMENT

### ステップ6: レビューの投稿（承認された場合）

```
gh pr review <PR番号> --body "REVIEW_BODY" --approve|--request-changes|--comment
```

GitHub投稿時は詳細を `<details>` タグで折りたたむ:

```markdown
## PR レビュー

**推奨**: APPROVE | REQUEST_CHANGES | COMMENT

### 概要
[概要]

<details>
<summary>レビュー詳細（N件の指摘）</summary>

[統合されたレビュー内容]

</details>
```

**重要:** `gh pr review` は成功時に出力がない。1回だけ実行し、出力がなければ成功。
