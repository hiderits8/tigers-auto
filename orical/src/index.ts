import fs from "fs/promises";
import path from "path";
import { config } from "./config";
import { login } from "./services/auth";
import { enterEvent, match, practice } from "./services/game";
import { voteLikePrevious } from "./services/hero";
import { collectTigerPoints } from "./services/points";
import { closeBrowser, launchBrowser, newMobilePage, saveCookie } from "./utils/browser";
import { dismissBlockingOverlays, inspectBlockingOverlays } from "./utils/dom";

const ERROR_LOG = path.resolve(config.moduleRoot, "logs/error.log");

const main = async () => {
    const browser = await launchBrowser();
    const page = await newMobilePage(browser);
    const errors: string[] = [];
    console.log(`Tigers COLLECTION 自動処理を開始します${config.dryRun ? " (dry-run)" : ""}`);

    try {
        await login(browser, page);
        const overlays = await inspectBlockingOverlays(page);
        if (overlays.length > 0) {
            console.log(`ログイン直後のポップアップ: ${JSON.stringify(overlays)}`);
        }
        await dismissBlockingOverlays(page);
        const tasks: Array<[string, () => Promise<void>]> = [
            ["虎ポイント", () => collectTigerPoints(browser, page)],
            ["HERO予想", () => voteLikePrevious(page)],
            ["イベント参加", () => enterEvent(page)],
            ["練習", () => practice(page)],
            ["対戦", () => match(page)],
        ];
        for (const [name, task] of tasks) {
            try {
                await task();
            } catch (error: any) {
                const message = `${name}: ${error?.message ?? error}`;
                console.error(`${name}処理に失敗しました`, error?.message ?? error);
                errors.push(message);
            }
        }
        await saveCookie(browser);
    } catch (error: any) {
        const message = `ログイン: ${error?.message ?? error}`;
        console.error("ログイン処理に失敗しました", error?.message ?? error);
        errors.push(message);
    } finally {
        await closeBrowser(browser).catch((error) => errors.push(`ブラウザ終了: ${error}`));
    }

    if (errors.length > 0) {
        await fs.mkdir(path.dirname(ERROR_LOG), { recursive: true });
        await fs.appendFile(ERROR_LOG, `${new Date().toISOString()} ${JSON.stringify(errors)}\n`, "utf-8");
        process.exitCode = 1;
    }
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
