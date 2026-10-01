import puppeteer, { Browser, CookieData, Page } from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { config } from "../config";

const COOKIE_PATH = path.resolve(config.moduleRoot, "data/cookie.json");
const MOBILE_USER_AGENT =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

export const launchBrowser = async (): Promise<Browser> =>
    puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"],
    });

export const closeBrowser = async (browser: Browser): Promise<void> => browser.close();

export const newMobilePage = async (browser: Browser): Promise<Page> => {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "standalone", {
            configurable: true,
            get: () => true,
        });

        const nativeMatchMedia = window.matchMedia.bind(window);
        window.matchMedia = ((query: string) => {
            const result = nativeMatchMedia(query);
            if (!query.includes("display-mode") || !query.includes("standalone")) return result;
            return new Proxy(result, {
                get(target, property) {
                    if (property === "matches") return true;
                    const value = Reflect.get(target, property, target);
                    return typeof value === "function" ? value.bind(target) : value;
                },
            });
        }) as typeof window.matchMedia;
    });
    await page.setUserAgent(MOBILE_USER_AGENT);
    await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
    });
    await page.emulateTimezone("Asia/Tokyo");
    page.setDefaultTimeout(30_000);
    page.setDefaultNavigationTimeout(60_000);
    return page;
};

export const loadCookie = async (browser: Browser): Promise<void> => {
    try {
        const cookies: CookieData[] = JSON.parse(await fs.readFile(COOKIE_PATH, "utf-8"));
        if (cookies.length > 0) await browser.setCookie(...cookies);
    } catch (error: any) {
        if (error?.code !== "ENOENT") {
            console.warn(`Cookie の読み込みをスキップしました: ${error?.message ?? error}`);
        }
    }
};

export const saveCookie = async (browser: Browser): Promise<void> => {
    const cookies = await browser.cookies();
    await fs.mkdir(path.dirname(COOKIE_PATH), { recursive: true });
    await fs.writeFile(COOKIE_PATH, JSON.stringify(cookies, null, 2), "utf-8");
};
