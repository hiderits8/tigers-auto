# Tigers automation

阪神タイガース関連の2サイトを、兄弟モジュールとして別々に管理します。

```text
.
├── .env       # ログイン情報（TIGERS_ID / TIGERS_PASSWORD）を共有
├── official/  # タイガース公式モバイルサイト
└── orical/    # Tigers COLLECTION
```

- `official/` と `orical/` はそれぞれ独立した `package.json`、`src/`、`dist/`、`data/`、`logs/`、cron設定を持ちます。
- Tigers COLLECTION側はルート `.env` のログイン情報2項目だけを読み、公式サイト固有の設定は参照しません。
- 詳細は各モジュールの `README.md` を参照してください。
