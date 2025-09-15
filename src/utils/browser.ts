import puppeteer, { Browser, Page, CookieData } from "puppeteer";
import fs from "fs/promises";
import path from "path";

const COOKIE_PATH = path.resolve("data/cookie.json");
const LOG_PATH = path.resolve("logs/browser.log");

export const launchBrowser = async (): Promise<Browser> => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox"],
    });
    return browser;
};

export const closeBrowser = async (browser: Browser): Promise<void> => {
    await browser.close();
};

export const newMobilePage = async (browser: Browser): Promise<Page> => {
    const page = await browser.newPage();
    return page;
};

export const loadCookie = async (
    browser: Browser,
    page: Page,
    baseUrl: string
): Promise<void> => {
    try {
        const buffer = await fs.readFile(COOKIE_PATH, "utf-8");
        const cookies: CookieData[] = JSON.parse(buffer);
        if (cookies.length > 0) await browser.setCookie(...cookies);
        await page.goto(baseUrl);
    } catch (error) {
        const errorMessage = `Failed to load cookie: ${error}`;
        fs.writeFile(LOG_PATH, errorMessage, "utf-8");
    }
};

export const saveCookie = async (
    browser: Browser,
    page: Page
): Promise<void> => {
    const cookies = await browser.cookies();
    await fs.mkdir(path.dirname(COOKIE_PATH), { recursive: true });
    await fs.writeFile(COOKIE_PATH, JSON.stringify(cookies, null, 2), "utf-8");
};
