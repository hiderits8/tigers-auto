"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectTigerPoints = void 0;
const config_1 = require("../config");
const dom_1 = require("../utils/dom");
const CARD_SELECTOR = "div.fluid.pt-12.mt-12.full-height.flex.direction-column.space-between";
const openSponsor = async (page) => {
    await (0, dom_1.gotoApp)(page, `${config_1.config.baseUrl}/home`, "ホーム");
    await (0, dom_1.dismissBlockingOverlays)(page);
    const image = await page.$('img[src*="button_sponsor_v2"]');
    if (!image)
        throw new Error("虎ポイント（スポンサー）ボタンが見つかりません。");
    await image.evaluate((element) => element.click());
    try {
        await page.waitForFunction((cardSelector) => document.body?.innerText.includes("ポイントを貯める") &&
            document.querySelectorAll(cardSelector).length > 0, { timeout: 10_000 }, CARD_SELECTOR);
    }
    catch {
        const text = (await (0, dom_1.bodyText)(page)).replace(/\s+/g, " ").trim().slice(0, 500);
        throw new Error(`スポンサー一覧を開けません: ${page.url()} / ${text}`);
    }
    await (0, dom_1.dismissInstallPrompt)(page);
};
const findUnclaimedCard = async (page) => {
    const cards = await page.$$(CARD_SELECTOR);
    for (const card of cards) {
        const text = await card.evaluate((element) => element.innerText ?? "");
        if (!text.includes("獲得済"))
            return { card, total: cards.length };
    }
    return { card: null, total: cards.length };
};
const clickSponsorDetail = async (page, cardKey) => {
    const cards = await page.$$(CARD_SELECTOR);
    for (const card of cards) {
        const cardText = (await card.evaluate((element) => element.innerText ?? "")).replace(/\s+/g, " ").trim();
        if (!cardText.includes(cardKey))
            continue;
        const buttons = await card.$$("button");
        for (const button of buttons) {
            const state = await button.evaluate((element) => ({
                text: (element.innerText ?? "").replace(/\s+/g, " ").trim(),
                disabled: element.disabled,
            }));
            if (state.text === "詳細を見る" && !state.disabled) {
                await button.evaluate((element) => element.click());
                return true;
            }
        }
    }
    return false;
};
const collectTigerPoints = async (browser, page) => {
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
        const title = (await card.evaluate((element) => element.innerText ?? ""))
            .replace(/\s+/g, " ")
            .trim();
        const cardKey = title.replace("詳細を見る", "").trim();
        if (config_1.config.dryRun) {
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
            const detailText = await (0, dom_1.bodyText)(page);
            if (detailText.includes("ポイント獲得済み")) {
                verified = true;
                break;
            }
            if (await (0, dom_1.dismissInstallPrompt)(page)) {
                await openSponsor(page);
                if (!(await clickSponsorDetail(page, cardKey))) {
                    throw new Error(`PWA誘導を閉じた後にスポンサー詳細を開けません: ${title}`);
                }
            }
            for (const label of ["虎ポイントを獲得する", "動画を見て虎ポイントを獲得する"]) {
                const rewardButton = await (0, dom_1.findByExactText)(page, "button", label);
                if (rewardButton) {
                    await rewardButton.evaluate((element) => element.click());
                    clicked = true;
                    break;
                }
            }
            if (clicked)
                break;
            await (0, dom_1.sleep)(300);
        }
        if (!clicked && !verified) {
            const detailText = await (0, dom_1.bodyText)(page);
            throw new Error(`虎ポイント取得ボタンが見つかりません: ${title} / ` +
                detailText.replace(/\s+/g, " ").trim().slice(0, 500));
        }
        for (let attempt = 0; clicked && attempt < 30; attempt++) {
            if ((await (0, dom_1.bodyText)(page)).includes("ポイント獲得済み")) {
                verified = true;
                break;
            }
            if (await (0, dom_1.dismissInstallPrompt)(page)) {
                for (const label of ["虎ポイントを獲得する", "動画を見て虎ポイントを獲得する"]) {
                    const rewardButton = await (0, dom_1.findByExactText)(page, "button", label);
                    if (rewardButton) {
                        await rewardButton.evaluate((element) => element.click());
                        break;
                    }
                }
            }
            await (0, dom_1.sleep)(1_000);
        }
        for (const openedPage of await browser.pages()) {
            if (!pagesBefore.has(openedPage))
                await openedPage.close();
        }
        if (!verified) {
            await openSponsor(page);
            const cards = await page.$$(CARD_SELECTOR);
            for (const candidate of cards) {
                const candidateText = (await candidate.evaluate((element) => element.innerText ?? "")).replace(/\s+/g, " ").trim();
                if (candidateText.includes(cardKey) && candidateText.includes("獲得済")) {
                    verified = true;
                    break;
                }
            }
        }
        if (!verified)
            throw new Error(`虎ポイントの取得完了を確認できませんでした: ${title}`);
        claimed++;
    }
    throw new Error("虎ポイント取得が上限回数内に完了しませんでした。");
};
exports.collectTigerPoints = collectTigerPoints;
//# sourceMappingURL=points.js.map