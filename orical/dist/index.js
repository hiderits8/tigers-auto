"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const auth_1 = require("./services/auth");
const game_1 = require("./services/game");
const hero_1 = require("./services/hero");
const points_1 = require("./services/points");
const browser_1 = require("./utils/browser");
const dom_1 = require("./utils/dom");
const ERROR_LOG = path_1.default.resolve(config_1.config.moduleRoot, "logs/error.log");
const main = async () => {
    const browser = await (0, browser_1.launchBrowser)();
    const page = await (0, browser_1.newMobilePage)(browser);
    const errors = [];
    console.log(`Tigers COLLECTION 自動処理を開始します${config_1.config.dryRun ? " (dry-run)" : ""}`);
    try {
        await (0, auth_1.login)(browser, page);
        const overlays = await (0, dom_1.inspectBlockingOverlays)(page);
        if (overlays.length > 0) {
            console.log(`ログイン直後のポップアップ: ${JSON.stringify(overlays)}`);
        }
        await (0, dom_1.dismissBlockingOverlays)(page);
        const tasks = [
            ["虎ポイント", () => (0, points_1.collectTigerPoints)(browser, page)],
            ["HERO予想", () => (0, hero_1.voteLikePrevious)(page)],
            ["イベント参加", () => (0, game_1.enterEvent)(page)],
            ["練習", () => (0, game_1.practice)(page)],
            ["対戦", () => (0, game_1.match)(page)],
        ];
        for (const [name, task] of tasks) {
            try {
                await task();
            }
            catch (error) {
                const message = `${name}: ${error?.message ?? error}`;
                console.error(`${name}処理に失敗しました`, error?.message ?? error);
                errors.push(message);
            }
        }
        await (0, browser_1.saveCookie)(browser);
    }
    catch (error) {
        const message = `ログイン: ${error?.message ?? error}`;
        console.error("ログイン処理に失敗しました", error?.message ?? error);
        errors.push(message);
    }
    finally {
        await (0, browser_1.closeBrowser)(browser).catch((error) => errors.push(`ブラウザ終了: ${error}`));
    }
    if (errors.length > 0) {
        await promises_1.default.mkdir(path_1.default.dirname(ERROR_LOG), { recursive: true });
        await promises_1.default.appendFile(ERROR_LOG, `${new Date().toISOString()} ${JSON.stringify(errors)}\n`, "utf-8");
        process.exitCode = 1;
    }
};
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map