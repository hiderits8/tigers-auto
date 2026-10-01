import { Browser, Page } from "puppeteer";
import { config } from "../config";
import { bodyText, clickExactText, gotoApp, sleep } from "../utils/dom";
import { loadCookie, saveCookie } from "../utils/browser";

const ID_SELECTOR = 'input[name="Tigers iDまたはFC会員番号"]';
const PASSWORD_SELECTOR = 'input[name="パスワード"]';

export const login = async (browser: Browser, page: Page): Promise<void> => {
    await loadCookie(browser);
    await gotoApp(page, `${config.baseUrl}/home`);

    if (!page.url().includes("/login/") && (await bodyText(page)).trim()) {
        console.log("保存済みログインを再利用しました");
        return;
    }

    await gotoApp(page, config.loginUrl, "Tigers iD");
    await page.waitForSelector(ID_SELECTOR);
    await page.locator(ID_SELECTOR).fill(config.tigersId);
    await page.locator(PASSWORD_SELECTOR).fill(config.tigersPassword);

    if (!(await clickExactText(page, "button", "ログイン"))) {
        throw new Error("ログインボタンが見つかりません。");
    }

    await page.waitForFunction(() => location.pathname !== "/login/tigers", { timeout: 60_000 });
    await sleep(1_000);
    if (page.url().includes("/login/")) throw new Error("ログイン後もログイン画面のままです。");

    await saveCookie(browser);
    console.log("ログインに成功しました");
};
