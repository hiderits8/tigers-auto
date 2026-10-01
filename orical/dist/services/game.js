"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.match = exports.practice = exports.enterEvent = void 0;
const config_1 = require("../config");
const dom_1 = require("../utils/dom");
const enterEvent = async (page) => {
    await (0, dom_1.gotoApp)(page, `${config_1.config.baseUrl}/game`);
    await (0, dom_1.dismissBlockingOverlays)(page);
    const labels = ["イベントに参加", "イベントに参加する", "エントリー", "参加"];
    let entryLabel = null;
    for (const label of labels) {
        if (await (0, dom_1.findByExactText)(page, "button", label)) {
            entryLabel = label;
            break;
        }
    }
    if (!entryLabel) {
        console.log("イベントは参加済み、または現在受付時間外です");
        return;
    }
    if (config_1.config.dryRun) {
        console.log(`[dry-run] イベント参加ボタンを押します: ${entryLabel}`);
        return;
    }
    await (0, dom_1.clickExactText)(page, "button", entryLabel);
    await (0, dom_1.sleep)(700);
    for (const confirmLabel of ["イベントに参加する", "参加する", "OK"]) {
        if (await (0, dom_1.clickExactText)(page, "button", confirmLabel))
            break;
    }
    await (0, dom_1.sleep)(1_500);
    console.log("イベント参加操作を実行しました");
};
exports.enterEvent = enterEvent;
const openGameTab = async (page, pathname, readyText) => {
    await (0, dom_1.gotoApp)(page, `${config_1.config.baseUrl}/game`, "マイオーダー");
    await (0, dom_1.dismissBlockingOverlays)(page);
    const link = await page.$(`a[href="${pathname}"]`);
    if (!link)
        throw new Error(`${pathname} へのリンクが見つかりません。`);
    await link.click();
    await page.waitForFunction((expected) => location.pathname === expected, { timeout: 30_000 }, pathname);
    for (let attempt = 0; attempt < 20; attempt++) {
        const text = await (0, dom_1.bodyText)(page);
        if (text.includes(readyText))
            return text;
        await (0, dom_1.sleep)(500);
    }
    return (0, dom_1.bodyText)(page);
};
const practice = async (page) => {
    const text = await openGameTab(page, "/game/practice", "練習する");
    const buttons = await page.$$("button");
    let practiceButton = null;
    for (const candidate of buttons) {
        const state = await candidate.evaluate((element) => ({
            text: element.innerText.trim(),
            disabled: element.disabled,
        }));
        if (state.text === "練習する") {
            practiceButton = { candidate, ...state };
            break;
        }
    }
    if (!practiceButton)
        throw new Error(`練習ボタンが見つかりません: ${text.slice(0, 120)}`);
    if (practiceButton.disabled) {
        console.log("この時間帯の練習は実行済みです");
        return;
    }
    if (config_1.config.dryRun) {
        console.log("[dry-run] 練習を実行します");
        return;
    }
    await practiceButton.candidate.click();
    await (0, dom_1.sleep)(2_000);
    console.log("練習を実行しました");
};
exports.practice = practice;
const match = async (page) => {
    let completed = 0;
    for (let attempt = 0; attempt < 6; attempt++) {
        const text = await openGameTab(page, "/game/match", "対戦する");
        const staminaLabel = `消費スタミナ：${config_1.config.matchStamina}`;
        const staminaSelected = text.includes(`選択中：消費スタミナ${config_1.config.matchStamina}`);
        if (!staminaSelected && !(await (0, dom_1.clickExactText)(page, "button", staminaLabel)))
            break;
        if (config_1.config.dryRun) {
            const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
            const staminaLine = lines.findIndex((line) => /スタミナ/.test(line));
            const staminaState = staminaLine >= 0
                ? lines.slice(Math.max(0, staminaLine - 2), staminaLine + 6).join(" / ")
                : "";
            console.log(`[dry-run] 利用可能なスタミナを使い切るまで、スタミナ${config_1.config.matchStamina}で対戦します` +
                (staminaState ? `（${staminaState}）` : ""));
            return;
        }
        if (!(await (0, dom_1.clickExactText)(page, "button", "対戦する")))
            break;
        await (0, dom_1.sleep)(3_000);
        await (0, dom_1.clickExactText)(page, "button", "スキップ");
        await (0, dom_1.sleep)(3_000);
        completed++;
    }
    if (completed === 0) {
        console.log(`スタミナ${config_1.config.matchStamina}を使える対戦はありません`);
    }
    else {
        console.log(`対戦を ${completed} 回実行し、利用可能なスタミナを消費しました`);
    }
};
exports.match = match;
//# sourceMappingURL=game.js.map