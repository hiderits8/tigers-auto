import { Browser, ElementHandle, Page } from "puppeteer";
import { config } from "../config";
import {
    bodyText,
    dismissBlockingOverlays,
    dismissInstallPrompt,
    findByExactText,
    gotoApp,
    sleep,
} from "../utils/dom";

const CARD_SELECTOR = "div.fluid.pt-12.mt-12.full-height.flex.direction-column.space-between";

const openSponsor = async (page: Page): Promise<void> => {
    await gotoApp(page, `${config.baseUrl}/home`, "ホーム");
    await dismissBlockingOverlays(page);
    const image = await page.$('img[src*="button_sponsor_v2"]');
    if (!image) throw new Error("虎ポイント（スポンサー）ボタンが見つかりません。");
    await image.evaluate((element) => (element as HTMLElement).click());
    try {
        await page.waitForFunction(
            (cardSelector) =>
                document.body?.innerText.includes("ポイントを貯める") &&
                document.querySelectorAll(cardSelector).length > 0,
            { timeout: 10_000 },
            CARD_SELECTOR
        );
    } catch {
        const text = (await bodyText(page)).replace(/\s+/g, " ").trim().slice(0, 500);
        throw new Error(`スポンサー一覧を開けません: ${page.url()} / ${text}`);
    }
    await dismissInstallPrompt(page);
};

const findUnclaimedCard = async (
    page: Page
): Promise<{ card: ElementHandle<Element> | null; total: number }> => {
    const cards = await page.$$(CARD_SELECTOR);
    for (const card of cards) {
        const text = await card.evaluate((element) => (element as HTMLElement).innerText ?? "");
        if (!text.includes("獲得済")) return { card, total: cards.length };
    }
    return { card: null, total: cards.length };
};

const clickSponsorDetail = async (page: Page, cardKey: string): Promise<boolean> => {
    const cards = await page.$$(CARD_SELECTOR);
    for (const card of cards) {
        const cardText = (await card.evaluate(
            (element) => (element as HTMLElement).innerText ?? ""
        )).replace(/\s+/g, " ").trim();
        if (!cardText.includes(cardKey)) continue;

        const buttons = await card.$$("button");
        for (const button of buttons) {
            const state = await button.evaluate((element) => ({
                text: ((element as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim(),
                disabled: (element as HTMLButtonElement).disabled,
            }));
            if (state.text === "詳細を見る" && !state.disabled) {
                await button.evaluate((element) => (element as HTMLElement).click());
                return true;
            }
        }
    }
    return false;
};

export const collectTigerPoints = async (browser: Browser, page: Page): Promise<void> => {
    let claimed = 0;
    for (let attempt = 0; attempt < 12; attempt++) {
        await openSponsor(page);
        const { card, total } = await findUnclaimedCard(page);
        if (total === 0) {
            throw new Error("スポンサー一覧が読み込まれていないため、取得済みとは判定しません。");
        }
        if (!card) {
            console.log(claimed ? `虎ポイントを ${claimed} 件取得しました` : "虎ポイントは取得済みです");
            return;
        }

        const title = (await card.evaluate((element) => (element as HTMLElement).innerText ?? ""))
            .replace(/\s+/g, " ")
            .trim();
        const cardKey = title.replace("詳細を見る", "").trim();
        if (config.dryRun) {
            console.log(`[dry-run] 虎ポイント取得対象: ${title}`);
            return;
        }

        if (!(await clickSponsorDetail(page, cardKey))) {
            throw new Error(`スポンサー詳細ボタンが見つかりません: ${title}`);
        }
        const pagesBefore = new Set(await browser.pages());
        let clicked = false;
        let verified = false;
        for (let attempt = 0; attempt < 100; attempt++) {
            const detailText = await bodyText(page);
            if (detailText.includes("ポイント獲得済み")) {
                verified = true;
                break;
            }

            if (await dismissInstallPrompt(page)) {
                await openSponsor(page);
                if (!(await clickSponsorDetail(page, cardKey))) {
                    throw new Error(`PWA誘導を閉じた後にスポンサー詳細を開けません: ${title}`);
                }
            }

            for (const label of ["虎ポイントを獲得する", "動画を見て虎ポイントを獲得する"]) {
                const rewardButton = await findByExactText(page, "button", label);
                if (rewardButton) {
                    await rewardButton.evaluate((element) => (element as HTMLElement).click());
                    clicked = true;
                    break;
                }
            }
            if (clicked) break;
            await sleep(300);
        }
        if (!clicked && !verified) {
            const detailText = await bodyText(page);
            throw new Error(
                `虎ポイント取得ボタンが見つかりません: ${title} / ` +
                detailText.replace(/\s+/g, " ").trim().slice(0, 500)
            );
        }

        for (let attempt = 0; clicked && attempt < 30; attempt++) {
            if ((await bodyText(page)).includes("ポイント獲得済み")) {
                verified = true;
                break;
            }
            if (await dismissInstallPrompt(page)) {
                for (const label of ["虎ポイントを獲得する", "動画を見て虎ポイントを獲得する"]) {
                    const rewardButton = await findByExactText(page, "button", label);
                    if (rewardButton) {
                        await rewardButton.evaluate((element) => (element as HTMLElement).click());
                        break;
                    }
                }
            }
            await sleep(1_000);
        }
        for (const openedPage of await browser.pages()) {
            if (!pagesBefore.has(openedPage)) await openedPage.close();
        }
        if (!verified) {
            await openSponsor(page);
            const cards = await page.$$(CARD_SELECTOR);
            for (const candidate of cards) {
                const candidateText = (await candidate.evaluate(
                    (element) => (element as HTMLElement).innerText ?? ""
                )).replace(/\s+/g, " ").trim();
                if (candidateText.includes(cardKey) && candidateText.includes("獲得済")) {
                    verified = true;
                    break;
                }
            }
        }
        if (!verified) throw new Error(`虎ポイントの取得完了を確認できませんでした: ${title}`);
        claimed++;
    }
    throw new Error("虎ポイント取得が上限回数内に完了しませんでした。");
};
