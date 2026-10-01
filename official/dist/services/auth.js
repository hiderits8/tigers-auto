"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const browser_1 = require("../utils/browser");
const { TIGERS_ID, TIGERS_PASSWORD, TIGERS_BIRTHDATE, BASE_URL, LOGIN_URL } = process.env;
if (!TIGERS_ID ||
    !TIGERS_PASSWORD ||
    !TIGERS_BIRTHDATE ||
    !BASE_URL ||
    !LOGIN_URL) {
    throw new Error("環境変数が不足しています。.env を確認してください。");
}
const login = async (browser, page) => {
    // ログインページにアクセス
    await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });
    console.log("TigersIDログインボタンをクリックしました");
    // TigersIDログインボタンをクリック
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("#contents > section:nth-child(5) > div:nth-child(3) > ul > li > button"),
    ]);
    // メンバー番号を入力
    await page.waitForSelector("#frm > fieldset > dl > dd:nth-child(2) > input[type=text]");
    await page.type("#frm > fieldset > dl > dd:nth-child(2) > input[type=text]", TIGERS_ID);
    // パスワードを入力
    await page.waitForSelector("#frm > fieldset > dl > dd:nth-child(4) > input[type=password]");
    await page.type("#frm > fieldset > dl > dd:nth-child(4) > input[type=password]", TIGERS_PASSWORD);
    // 生年月日を入力
    await page.waitForSelector("#frm > fieldset > dl > dd:nth-child(6) > input");
    await page.type("#frm > fieldset > dl > dd:nth-child(6) > input", TIGERS_BIRTHDATE);
    // ログインボタンをクリック
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("input[name='commit_btn']"),
    ]);
    await (0, browser_1.saveCookie)(browser, page);
};
exports.login = login;
//# sourceMappingURL=auth.js.map