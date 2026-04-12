# Amazon Music API 利用可能性調査

## 結論

**判定: ❌ 不採用**

- 公式 API が**クローズドベータ**で個人開発者はアクセス不可
- 非公式ライブラリは 2017年以降メンテナンス放棄
- 日本市場でシェア低下中（2020年1位 → 現在3-4位）
- 月間リスナー数などの関心指標は API でも取得不可能
- 既存パイプライン（Spotify / YouTube / YouTube Music / Last.fm）で十分

## 調査結果

### 公式 API

| 項目 | 状態 |
|---|---|
| 公開状態 | ❌ クローズドベータ |
| アクセス | 事前承認開発者のみ（企業向け） |
| 個人開発者 | ❌ 不可 |
| 認証 | OAuth 2.0 (Login with Amazon) |
| 取得可能 | フォロワー数、アルバム、トップトラック |
| 取得不可 | 月間リスナー数、ストリーミング統計、地理分布 |

### 代替手段

| 手段 | 評価 |
|---|---|
| 非公式 Python SDK (amazon-music) | ❌ 2017年以降放棄、実用不可 |
| Playwright スクレイピング | ❌ ログイン必須で困難 |
| RapidAPI | ❌ Amazon Music 専用エンドポイントなし |

### 日本市場

- グローバル: 82M ユーザー、シェア 8.2%（4位）
- 日本: 約550万人（2022年）、シェア低下中
- Amazon Prime Music → Music Unlimited への課金誘導でユーザー離反

## 再検討条件

- Amazon が API を GA 化した場合
- 日本市場でシェアが回復した場合
- ユーザーから明示的な要望があった場合

## Sources

- [Amazon Music Web API Overview](https://developer.amazon.com/docs/music/API_web_overview.html)
- [amazon-music (GitHub)](https://github.com/Jaffa/amazon-music)
- [Amazon Music Statistics 2026](https://www.yaguara.co/amazon-music-statistics/)

---

*最終更新: 2026-04-12*
