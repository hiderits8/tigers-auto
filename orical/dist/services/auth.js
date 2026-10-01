"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const config_1 = require("../config");
const dom_1 = require("../utils/dom");
const browser_1 = require("../utils/browser");
const ID_SELECTOR = 'input[name="Tigers iDまたはFC会員番号"]';
const PASSWORD_SELECTOR = 'input[name="パスワード"]';
const login = async (browser, page) => {
    await (0, browser_1.loadCookie)(browser);
    await (0, dom_1.gotoApp)(page, `${config_1.config.baseUrl}/home`);
    if (!page.url().includes("/login/") && (await (0, dom_1.bodyText)(page)).trim()) {
        console.log("保存済みログインを再利用しました");
        return;
    }
    await (0, dom_1.gotoApp)(page, config_1.config.loginUrl, "Tigers iD");
    await page.waitForSelector(ID_SELECTOR);
    await page.locator(ID_SELECTOR).fill(config_1.config.tigersId);
    await page.locator(PASSWORD_SELECTOR).fill(config_1.config.tigersPassword);
    if (!(await (0, dom_1.clickExactText)(page, "button", "ログイン"))) {
        throw new Error("ログインボタンが見つかりません。");
    }
    await page.waitForFunction(() => location.pathname !== "/login/tigers", { timeout: 60_000 });
    await (0, dom_1.sleep)(1_000);
    if (page.url().includes("/login/"))
        throw new Error("ログイン後もログイン画面のままです。");
    await (0, browser_1.saveCookie)(browser);
    console.log("ログインに成功しました");
};
exports.login = login;
//# sourceMappingURL=auth.js.map