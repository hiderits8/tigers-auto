# Tigers Auto

Hanshin Tigers Mobile（スマホ公式サイト）の会員ページに自動ログインし、デイリースタンプ取得とヒーロー予想投票をまとめてこなす TypeScript + Puppeteer スクリプトです。定期実行（cron など）に組み込むことで、毎日の作業を自動化できます。

## 主な処理
- TigersID でログイン（cookie を `data/cookie.json` に保存／再利用）
- デイリースタンプの取得状況を確認し、未取得なら押下
- 指定した選手名でヒーロー予想に投票
- 失敗時のスタックトレースを `logs/error.log`、ブラウザ関連のログを `logs/browser.log` に追記

## 必要条件
- Node.js 18 以上（Puppeteer v24 の要件に合わせるのが安全です）
- npm

## セットアップ
1. 依存関係のインストール
   ```bash
   npm install
   ```
2. `.env` の作成  
   `.env.example` をコピーして値を埋めます。
   ```bash
   cp .env.example .env
   ```
3. 開発時に TypeScript を直接実行する場合
   ```bash
   npm run dev
   ```
4. 本番実行（ビルド → 実行）
   ```bash
   npm run build
   npm run start
   ```

## 環境変数
| 変数名 | 必須 | 説明 |
| --- | --- | --- |
| `TIGERS_ID` | ✅ | TigersID 会員番号 |
| `TIGERS_PASSWORD` | ✅ | TigersID パスワード |
| `TIGERS_BIRTHDATE` | ✅ | 生年月日。`MMDD`（例: 0123）形式 |
| `HERO_PLAYER_NAME` | ✅ | ヒーロー予想で投票したい選手のフルネーム |
| `BASE_URL` | ✅ | モバイルサイトの基底 URL（例: `https://m.hanshintigers.jp/`） |
| `LOGIN_URL` | ✅ | TigersID ログインページ URL |

不足していると起動時に例外を投げます。`.env.example` を参照して入力してください。

## ディレクトリ構成（抜粋）
```
├── src
│   ├── index.ts            # メインフロー：ログイン→スタンプ→投票
│   ├── services
│   │   ├── auth.ts         # ログイン処理
│   │   ├── hero.ts         # ヒーロー予想投票
│   │   └── stamp.ts        # スタンプ取得
│   └── utils
│       └── browser.ts      # Puppeteer のラッパー・cookie 保存
├── data/cookie.json        # 保存済み cookie（初回実行時に生成）
└── logs
    ├── browser.log
    ├── cron.log            # cron などから標準出力を流す想定
    └── error.log
```

## ログ・永続ファイル
- `data/cookie.json` : ログイン状態を維持するための cookie。削除すると次回はログインから再実行します。
- `logs/error.log` : 各処理ブロックで発生したエラーを JSON 形式で追記。
- `logs/browser.log` : cookie 読み込み失敗時など Puppeteer 周りのメモ。
- `logs/cron.log` : サーバー上の cron から標準出力をリダイレクトする用途を想定した空ファイル。

## 自動実行（例：cron）
`npm run start` は `dist/index.js` を起動します。以下は毎日 8:00 に実行する例です。
```
0 8 * * * cd /path/to/tigers-auto && /usr/bin/node dist/index.js >> logs/cron.log 2>&1
```
ビルド済みの JS を使う場合でも、依存パッケージと `.env` は同じディレクトリに配置してください。

## トラブルシューティング
- Puppeteer 起動に失敗する: サーバーがヘッドレス Chrome を実行できるか確認し、必要に応じて `--no-sandbox` を維持するか、サーバーのセキュリティポリシーに合わせて調整してください。
- ヒーロー予想で「該当選手が見つかりません」と出る: `HERO_PLAYER_NAME` が公式表記と一致しているか確認してください（全角スペースの有無など）。
- それでも解決しない場合は `logs/error.log` の詳細を確認し、DOM セレクタの変更などを疑ってください。

## ライセンス
MIT
