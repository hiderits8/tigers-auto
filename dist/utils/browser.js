"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCookie = exports.loadCookie = exports.newMobilePage = exports.closeBrowser = exports.launchBrowser = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const COOKIE_PATH = path_1.default.resolve("data/cookie.json");
const LOG_PATH = path_1.default.resolve("logs/browser.log");
const launchBrowser = async () => {
    const browser = await puppeteer_1.default.launch({
        headless: true,
        args: ["--no-sandbox"],
    });
    return browser;
};
exports.launchBrowser = launchBrowser;
const closeBrowser = async (browser) => {
    await browser.close();
};
exports.closeBrowser = closeBrowser;
const newMobilePage = async (browser) => {
    const page = await browser.newPage();
    return page;
};
exports.newMobilePage = newMobilePage;
const loadCookie = async (browser, page, baseUrl) => {
    try {
        const buffer = await promises_1.default.readFile(COOKIE_PATH, "utf-8");
        const cookies = JSON.parse(buffer);
        if (cookies.length > 0)
            await browser.setCookie(...cookies);
        await page.goto(baseUrl);
    }
    catch (error) {
        const errorMessage = `Failed to load cookie: ${error}`;
        promises_1.default.writeFile(LOG_PATH, errorMessage, "utf-8");
    }
};
exports.loadCookie = loadCookie;
const saveCookie = async (browser, page) => {
    const cookies = await browser.cookies();
    await promises_1.default.mkdir(path_1.default.dirname(COOKIE_PATH), { recursive: true });
    await promises_1.default.writeFile(COOKIE_PATH, JSON.stringify(cookies, null, 2), "utf-8");
};
exports.saveCookie = saveCookie;
//# sourceMappingURL=browser.js.map