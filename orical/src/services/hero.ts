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

    const missingKinds = await page.evaluate(() =>
        (["fielder", "pitcher"] as const).filter((kind) => {
            const section = document.querySelector(`.tab-content.relative.${kind}`);
            return section?.textContent?.includes("未選択") ?? false;
        })
    );

    if (missingKinds.length === 0) {
        console.log("HERO予想は野手・投手とも設定済みです");
        return;
    }

    if (config.dryRun) {
        console.log(`[dry-run] HERO予想の未設定枠を前回と同じ選手でセットします: ${missingKinds.join(", ")}`);
        return;
    }

    for (const kind of missingKinds) {
        const clicked = await page.evaluate((targetKind) => {
            const button = document.querySelector(`button.set-bets-button.${targetKind}`);
            if (!(button instanceof HTMLButtonElement) || button.disabled || !button.getClientRects().length) {
                return false;
            }
            button.click();
            return true;
        }, kind);
        if (!clicked) throw new Error(`${kind}の前回と同じ選手を選ぶボタンを押せません。`);

        await page.waitForFunction(
            (targetKind) => {
                const section = document.querySelector(`.tab-content.relative.${targetKind}`);
                return Boolean(section && !section.textContent?.includes("未選択"));
            },
            { timeout: 10_000 },
            kind
        );
        await sleep(500);
        await dismissBlockingOverlays(page);
    }

    const stillMissing = await page.evaluate(() =>
        (["fielder", "pitcher"] as const).filter((kind) =>
            document.querySelector(`.tab-content.relative.${kind}`)?.textContent?.includes("未選択")
        )
    );
    if (stillMissing.length > 0) {
        throw new Error(`HERO予想の未設定枠が残っています: ${stillMissing.join(", ")}`);
    }
    console.log(`HERO予想を前回と同じ選手で保存しました: ${missingKinds.join(", ")}`);
};
