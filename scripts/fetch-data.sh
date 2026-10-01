#!/usr/bin/env bash
# Cloudflare Pages のビルド前に Private リポジトリ music-analytics-data を data/ に取得する。
# Pages のビルドコマンド（ルートディレクトリ = リポジトリ直下）:
#   bash scripts/fetch-data.sh && cd frontend && pnpm install && pnpm run build && cp -r functions/ ../functions
# data/*.json と scripts/config.json の dist へのコピーは vite.config.ts の copyDataPlugin が行う
# 必要な環境変数: DATA_REPO_TOKEN（data リポジトリの Contents: Read 権限を持つ fine-grained PAT）
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$REPO_ROOT/data"
DATA_REPO="${DATA_REPO:-Kosuke-Ito/music-analytics-data}"

if [ -d "$DATA_DIR/.git" ]; then
  echo "data/ already present; pulling latest"
  git -C "$DATA_DIR" pull --ff-only
  exit 0
fi

if [ -z "${DATA_REPO_TOKEN:-}" ]; then
  echo "DATA_REPO_TOKEN is not set" >&2
  exit 1
fi

# トークンはログに出さない
git clone --quiet --depth 1 "https://x-access-token:${DATA_REPO_TOKEN}@github.com/${DATA_REPO}.git" "$DATA_DIR"
# 取得後はリモート URL からトークンを除く
git -C "$DATA_DIR" remote set-url origin "https://github.com/${DATA_REPO}.git"
echo "fetched $(ls "$DATA_DIR"/*.json | wc -l | tr -d ' ') data files"
