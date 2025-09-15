import "dotenv/config";
import {
    launchBrowser,
    saveCookie,
    loadCookie,
    closeBrowser,
    newMobilePage,
} from "./utils/browser";
import { login } from "./services/auth";
import { vote } from "./services/hero";
import { stamp } from "./services/stamp";
import fs from "fs/promises";
import path from "path";

const main = async () => {
    const baseUrl = process.env.BASE_URL!;
    const logPath = path.resolve("logs/error.log");
    const browser = await launchBrowser();
    const page = await newMobilePage(browser);

    let errorMessage: any[] = [];

    // ログイン
    try {
        await loadCookie(browser, page, baseUrl);
        await login(browser, page);
        await saveCookie(browser, page);
        console.log("ログインに成功しました");
    } catch (error: any) {
        console.log("ログインに失敗しました", error?.message);
        errorMessage.push(error?.message);
    }

    // スタンプ
    try {
        const stampedLog = await stamp(page);
        if (stampedLog.stamped) {
            console.log("スタンプを押しました");
        } else {
            console.log("スタンプは獲得済みです");
        }
    } catch (error: any) {
        console.log("スタンプ処理に失敗しました", error?.message);
        errorMessage.push(error?.message);
    }

    // ヒーロー予想
    try {
        await vote(page);
    } catch (error: any) {
        console.log("ヒーロー予想処理に失敗しました", error?.message);
        errorMessage.push(error?.message);
    }

    try {
        await closeBrowser(browser);
    } catch (error: any) {
        console.log("ブラウザを閉じるのに失敗しました", error?.message);
        errorMessage.push(error?.message);
    }

    if (errorMessage.length > 0) {
        fs.appendFile(
            logPath,
            JSON.stringify(errorMessage, null, 2) + "\n",
            "utf-8"
        );
    }
};

main();
