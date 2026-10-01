"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCookie = exports.loadCookie = exports.newMobilePage = exports.closeBrowser = exports.launchBrowser = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const COOKIE_PATH = path_1.default.resolve(config_1.config.moduleRoot, "data/cookie.json");
const MOBILE_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const launchBrowser = async () => puppeteer_1.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"],
});
exports.launchBrowser = launchBrowser;
const closeBrowser = async (browser) => browser.close();
exports.closeBrowser = closeBrowser;
const newMobilePage = async (browser) => {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "standalone", {
            configurable: true,
            get: () => true,
        });
        const nativeMatchMedia = window.matchMedia.bind(window);
        window.matchMedia = ((query) => {
            const result = nativeMatchMedia(query);
            if (!query.includes("display-mode") || !query.includes("standalone"))
                return result;
            return new Proxy(result, {
                get(target, property) {
                    if (property === "matches")
                        return true;
                    const value = Reflect.get(target, property, target);
                    return typeof value === "function" ? value.bind(target) : value;
                },
            });
        });
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
exports.newMobilePage = newMobilePage;
const loadCookie = async (browser) => {
    try {
        const cookies = JSON.parse(await promises_1.default.readFile(COOKIE_PATH, "utf-8"));
        if (cookies.length > 0)
            await browser.setCookie(...cookies);
    }
    catch (error) {
        if (error?.code !== "ENOENT") {
            console.warn(`Cookie の読み込みをスキップしました: ${error?.message ?? error}`);
        }
    }
};
exports.loadCookie = loadCookie;
const saveCookie = async (browser) => {
    const cookies = await browser.cookies();
    await promises_1.default.mkdir(path_1.default.dirname(COOKIE_PATH), { recursive: true });
    await promises_1.default.writeFile(COOKIE_PATH, JSON.stringify(cookies, null, 2), "utf-8");
};
exports.saveCookie = saveCookie;
//# sourceMappingURL=browser.js.map