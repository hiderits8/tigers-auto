"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gotoApp = exports.dismissBlockingOverlays = exports.inspectBlockingOverlays = exports.dismissInstallPrompt = exports.clickExactText = exports.findByExactText = exports.bodyText = exports.sleep = void 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
const bodyText = (page) => page.evaluate(() => document.body?.innerText ?? "");
exports.bodyText = bodyText;
const normalizedText = (value) => value.replace(/\s+/g, " ").trim();
const findByExactText = async (page, selector, expected) => {
    const elements = await page.$$(selector);
    for (const element of elements) {
        const state = await element.evaluate((node) => {
            const html = node;
            const button = node;
            const style = getComputedStyle(html);
            return {
                text: html.innerText ?? html.textContent ?? "",
                visible: style.display !== "none" &&
                    style.visibility !== "hidden" &&
                    Boolean(html.offsetWidth || html.offsetHeight || html.getClientRects().length),
                disabled: "disabled" in button && button.disabled,
            };
        });
        if (state.visible && !state.disabled && normalizedText(state.text) === normalizedText(expected)) {
            return element;
        }
    }
    return null;
};
exports.findByExactText = findByExactText;
const clickExactText = async (page, selector, expected) => {
    const element = await (0, exports.findByExactText)(page, selector, expected);
    if (!element)
        return false;
    await element.click();
    return true;
};
exports.clickExactText = clickExactText;
const dismissInstallPrompt = async (page) => {
    const dismissed = await (0, exports.clickExactText)(page, "a, button", "今は追加しない");
    if (dismissed)
        await (0, exports.sleep)(400);
    return dismissed;
};
exports.dismissInstallPrompt = dismissInstallPrompt;
const inspectBlockingOverlays = async (page) => page.evaluate(() => {
    const visible = (element) => {
        const html = element;
        const style = getComputedStyle(html);
        return (style.display !== "none" &&
            style.visibility !== "hidden" &&
            Boolean(html.offsetWidth || html.offsetHeight || html.getClientRects().length));
    };
    const candidates = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal, .v-dialog')).filter(visible);
    const closeControls = Array.from(document.querySelectorAll("button, a")).filter((element) => {
        if (!visible(element))
            return false;
        const text = (element.innerText ?? "").replace(/\s+/g, " ").trim();
        return ["閉じる", "✕ 閉じる", "今は追加しない"].includes(text);
    });
    for (const control of closeControls) {
        let container = control.parentElement;
        while (container && container !== document.body) {
            const text = (container.innerText ?? "").replace(/\s+/g, " ").trim();
            if (text.length > 10 && text.length <= 1_000) {
                if (!candidates.includes(container))
                    candidates.push(container);
                break;
            }
            container = container.parentElement;
        }
    }
    return candidates.slice(0, 8).map((element) => ({
        text: (element.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 500),
        buttons: Array.from(element.querySelectorAll("button, a"))
            .filter(visible)
            .map((button) => (button.innerText ?? "").replace(/\s+/g, " ").trim())
            .filter(Boolean)
            .slice(0, 12),
    })).filter((overlay) => overlay.text || overlay.buttons.length > 0);
});
exports.inspectBlockingOverlays = inspectBlockingOverlays;
const dismissBlockingOverlays = async (page) => {
    await (0, exports.dismissInstallPrompt)(page);
    for (let attempt = 0; attempt < 6; attempt++) {
        const closed = (await (0, exports.clickExactText)(page, "button", "✕ 閉じる")) ||
            (await (0, exports.clickExactText)(page, "button", "閉じる"));
        if (!closed)
            return;
        await (0, exports.sleep)(400);
    }
};
exports.dismissBlockingOverlays = dismissBlockingOverlays;
const gotoApp = async (page, url, readyText) => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    for (let attempt = 0; attempt < 20; attempt++) {
        const text = await (0, exports.bodyText)(page);
        if (text.trim() && (!readyText || text.includes(readyText)))
            return text;
        await (0, exports.sleep)(500);
    }
    return (0, exports.bodyText)(page);
};
exports.gotoApp = gotoApp;
//# sourceMappingURL=dom.js.map