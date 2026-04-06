# music-analytics

Spotify（Playwright で取得）と YouTube Data API を使ってアーティスト指標を日次で `data/*.json` に蓄積し、Vite + React でダッシュボード表示するリポジトリです。GitHub Actions で収集とニュースアノテーションが走ります。

## 構成

- `collector/` … 収集スクリプト（`python -m collector.main`）
- `scripts/config.json` … 対象アーティストと Spotify / YouTube ID
- `data/` … 1 アーティスト 1 JSON（日次 `records` と任意の `annotations`）
- `frontend/` … ダッシュボード UI

## ローカル開発（フロント）

`vite.config.ts` の dev 用ミドルウェアが、リポジトリ直下の `data/` と `scripts/config.json` をそのまま配信します（`public/` へのコピーは不要）。

```bash
cd frontend && pnpm install && pnpm dev
```

本番ビルド時は `dist/` に `data/` と `config.json` がコピーされます。

## テスト（Docker Compose）

リポジトリルートで次を実行します（Docker デーモンが起動していること）。

```bash
docker compose run --rm frontend-test
docker compose run --rm collector-test
```

Docker を使わない場合は、このリポジトリの [mise](https://mise.jdx.dev/) 設定（`.mise.toml`）に合わせて、例えば次でも同じ検証ができます。

```bash
mise exec -- python -m pip install -r collector/requirements.txt
mise exec -- python -m pytest collector/tests -q
mise exec -- bash -c 'cd frontend && pnpm install && pnpm test && pnpm run build'
```

## 収集の挙動（要点）

- Spotify 取得は最大 3 回までリトライします（`collector/main.py`）。
- 月間リスナーが前回比で 50% を超える変動の場合も **破棄せず保存**し、`validation_flags` に `large_monthly_listener_delta` を付けます。
- 値が 0 以下のときだけ保存をスキップします。

## ライセンス・注意

Spotify ページのスクレイピングは利用規約・サイト構造の変更により動かなくなる可能性があります。YouTube は API キー（`YOUTUBE_API_KEY`）が必要です。
