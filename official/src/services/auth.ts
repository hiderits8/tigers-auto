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

    console.log("TigersIDログインボタンをクリックしました");
    // TigersIDログインボタンをクリック
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click(
            "#contents > section:nth-child(5) > div:nth-child(3) > ul > li > button"
        ),
    ]);

    // メンバー番号を入力
    await page.waitForSelector(
        "#frm > fieldset > dl > dd:nth-child(2) > input[type=text]"
    );
    await page.type(
        "#frm > fieldset > dl > dd:nth-child(2) > input[type=text]",
        TIGERS_ID
    );

    // パスワードを入力
    await page.waitForSelector(
        "#frm > fieldset > dl > dd:nth-child(4) > input[type=password]"
    );
    await page.type(
        "#frm > fieldset > dl > dd:nth-child(4) > input[type=password]",
        TIGERS_PASSWORD
    );

    // 生年月日を入力
    await page.waitForSelector(
        "#frm > fieldset > dl > dd:nth-child(6) > input"
    );
    await page.type(
        "#frm > fieldset > dl > dd:nth-child(6) > input",
        TIGERS_BIRTHDATE
    );

    // ログインボタンをクリック
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("input[name='commit_btn']"),
    ]);

    await saveCookie(browser, page);
};
