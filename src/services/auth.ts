import { Browser, Page } from "puppeteer";
import { saveCookie } from "../utils/browser";

const { TIGERS_ID, TIGERS_PASSWORD, TIGERS_BIRTHDATE, BASE_URL, LOGIN_URL } =
    process.env;

if (
    !TIGERS_ID ||
    !TIGERS_PASSWORD ||
    !TIGERS_BIRTHDATE ||
    !BASE_URL ||
    !LOGIN_URL
) {
    throw new Error("環境変数が不足しています。.env を確認してください。");
}

export const login = async (browser: Browser, page: Page): Promise<void> => {
    // ログインページにアクセス
    await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });
    // TigerIDログインボタンをクリック
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("//div[@class='login_cont'][1]//button"),
    ]);

    // メンバー番号を入力
    await page.waitForSelector("//input[@name='menber_no']");
    await page.type("//input[@name='menber_no']", TIGERS_ID);

    // パスワードを入力
    await page.waitForSelector("//input[@name='password']");
    await page.type("//input[@name='password']", TIGERS_PASSWORD);

    // 生年月日を入力
    await page.waitForSelector("//input[@name='birthday']");
    await page.type("//input[@name='birthday']", TIGERS_BIRTHDATE);

    // ログインボタンをクリック
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("//input[@name='commit_btn']"),
    ]);

    await saveCookie(browser, page);
};
