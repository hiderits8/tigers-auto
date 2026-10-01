# Tigers COLLECTION Auto

スマホ専用Webアプリ「Tigers COLLECTION」をiPhone相当のPuppeteerで操作する、独立した自動実行モジュールです。親ディレクトリのタイガース公式サイト用コード・Cookie・ログ・cronとは分離しています。

## 処理内容

- `../.env` から `TIGERS_ID` と `TIGERS_PASSWORD` だけを読み込んでログイン
- ログイン後のお知らせ／報酬ポップアップを閉じる
- 未取得の虎ポイントを取得
- HERO予想を「前回と同じ選手」で保存
- イベントが未参加なら参加
- 実行可能なら練習
- `MATCH_STAMINA` で指定したスタミナを使い、利用可能なぶんだけ対戦（最大6回）

受付時間外・実行済みの操作はスキップします。

## セットアップと確認

```bash
cd orical
npm install
cp .env.example .env
npm run build
npm run dry-run
```

通常実行は `npm run start` です。Cookieは `orical/data/cookie.json`、エラーは `orical/logs/error.log` に保存します。

## 定期実行

スタミナは1時間に1回復し、6が上限なので、`cron/tigers-collection.crontab` は4時間間隔で実行します。各実行で利用可能なスタミナを使い切ります。木曜の定期メンテナンス（13:30〜15:00）後、15:05にはイベント開始・エントリー用の追加実行があります。
