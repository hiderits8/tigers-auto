"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const browser_1 = require("./utils/browser");
const auth_1 = require("./services/auth");
const hero_1 = require("./services/hero");
const stamp_1 = require("./services/stamp");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const main = async () => {
    const baseUrl = process.env.BASE_URL;
    const logPath = path_1.default.resolve("logs/error.log");
    const browser = await (0, browser_1.launchBrowser)();
    const page = await (0, browser_1.newMobilePage)(browser);
    let errorMessage = [];
    // ログイン
    try {
        await (0, browser_1.loadCookie)(browser, page, baseUrl);
        await (0, auth_1.login)(browser, page);
        await (0, browser_1.saveCookie)(browser, page);
        console.log("ログインに成功しました");
    }
    catch (error) {
        console.log("ログインに失敗しました", error?.message);
        errorMessage.push(error?.message);
    }
    // スタンプ
    try {
        const stampedLog = await (0, stamp_1.stamp)(page);
        if (stampedLog.stamped) {
            console.log("スタンプを押しました");
        }
        else {
            console.log("スタンプは獲得済みです");
        }
    }
    catch (error) {
        console.log("スタンプ処理に失敗しました", error?.message);
        errorMessage.push(error?.message);
    }
    // ヒーロー予想
    try {
        await (0, hero_1.vote)(page);
    }
    catch (error) {
        console.log("ヒーロー予想処理に失敗しました", error?.message);
        errorMessage.push(error?.message);
    }
    try {
        await (0, browser_1.closeBrowser)(browser);
    }
    catch (error) {
        console.log("ブラウザを閉じるのに失敗しました", error?.message);
        errorMessage.push(error?.message);
    }
    if (errorMessage.length > 0) {
        promises_1.default.appendFile(logPath, JSON.stringify(errorMessage, null, 2) + "\n", "utf-8");
    }
};
main();
//# sourceMappingURL=index.js.map