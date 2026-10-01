import { Page } from "puppeteer";
import { config } from "../config";
import { bodyText, dismissBlockingOverlays, dismissInstallPrompt, gotoApp, sleep } from "../utils/dom";

const openHeroPrediction = async (page: Page): Promise<string> => {
    await gotoApp(page, `${config.baseUrl}/home`, "ホーム");
    await dismissBlockingOverlays(page);
    const link = await page.$('a[href="/mvp/v2"]');
    if (!link) throw new Error("HERO予想へのリンクが見つかりません。");
    await link.click();
    try {
        await page.waitForFunction(() => location.pathname === "/mvp/v2", { timeout: 5_000 });
    } catch {
        await gotoApp(page, `${config.baseUrl}/mvp/v2`, "HERO予想");
    }
    await sleep(1_000);
    await dismissInstallPrompt(page);
    return bodyText(page);
};

export const voteLikePrevious = async (page: Page): Promise<void> => {
    const text = await openHeroPrediction(page);
    if (
        text.includes("今は予想をセットできません") ||
        text.includes("本日の予想は終了しました") ||
        text.includes("本日は予想対象外です")
    ) {
        console.log("HERO予想は現在受付時間外です");
        return;
    }

    const previousButtons = await page.$$("button.set-bets-button");
    if (previousButtons.length === 0) {
        if (text.includes("予想が未設定です")) {
            throw new Error("前回と同じ選手を選ぶボタンが見つかりません。");
        }
        console.log("HERO予想は変更不要です");
        return;
    }

    for (const button of previousButtons) {
        const state = await button.evaluate((element) => ({
            disabled: (element as HTMLButtonElement).disabled,
            visible: getComputedStyle(element).display !== "none",
        }));
        if (!state.disabled && state.visible) {
            await button.click();
            await sleep(500);
        }
    }

    const submit = await page.$("button.mvp-button");
    if (!submit) throw new Error("HERO予想の確定ボタンが見つかりません。");
    const submitState = await submit.evaluate((element) => ({
        disabled: (element as HTMLButtonElement).disabled,
        text: (element as HTMLElement).innerText,
    }));
    if (submitState.disabled) throw new Error(`HERO予想を確定できません: ${submitState.text}`);

    if (config.dryRun) {
        console.log(`[dry-run] HERO予想を前回と同じ選手で確定します: ${submitState.text.trim()}`);
        return;
    }
    await submit.click();
    await sleep(2_000);
    console.log("HERO予想を前回と同じ選手で保存しました");
};
