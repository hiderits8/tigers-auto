import { ElementHandle, Page } from "puppeteer";

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const bodyText = (page: Page): Promise<string> =>
    page.evaluate(() => document.body?.innerText ?? "");

const normalizedText = (value: string) => value.replace(/\s+/g, " ").trim();

export const findByExactText = async (
    page: Page,
    selector: string,
    expected: string
): Promise<ElementHandle<Element> | null> => {
    const elements = await page.$$(selector);
    for (const element of elements) {
        const state = await element.evaluate((node) => {
            const html = node as HTMLElement;
            const button = node as HTMLButtonElement;
            const style = getComputedStyle(html);
            return {
                text: html.innerText ?? html.textContent ?? "",
                visible:
                    style.display !== "none" &&
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

export const clickExactText = async (
    page: Page,
    selector: string,
    expected: string
): Promise<boolean> => {
    const element = await findByExactText(page, selector, expected);
    if (!element) return false;
    await element.click();
    return true;
};

export const dismissInstallPrompt = async (page: Page): Promise<boolean> => {
    const dismissed = await clickExactText(page, "a, button", "今は追加しない");
    if (dismissed) await sleep(400);
    return dismissed;
};

export type BlockingOverlay = {
    text: string;
    buttons: string[];
};

export const inspectBlockingOverlays = async (page: Page): Promise<BlockingOverlay[]> =>
    page.evaluate(() => {
        const visible = (element: Element) => {
            const html = element as HTMLElement;
            const style = getComputedStyle(html);
            return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                Boolean(html.offsetWidth || html.offsetHeight || html.getClientRects().length)
            );
        };

        const candidates: Element[] = Array.from(
            document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal, .v-dialog')
        ).filter(visible);

        const closeControls = Array.from(document.querySelectorAll("button, a")).filter((element) => {
            if (!visible(element)) return false;
            const text = ((element as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim();
            return ["閉じる", "✕ 閉じる", "今は追加しない"].includes(text);
        });
        for (const control of closeControls) {
            let container: Element | null = control.parentElement;
            while (container && container !== document.body) {
                const text = ((container as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim();
                if (text.length > 10 && text.length <= 1_000) {
                    if (!candidates.includes(container)) candidates.push(container);
                    break;
                }
                container = container.parentElement;
            }
        }

        return candidates.slice(0, 8).map((element) => ({
            text: ((element as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 500),
            buttons: Array.from(element.querySelectorAll("button, a"))
                .filter(visible)
                .map((button) => ((button as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim())
                .filter(Boolean)
                .slice(0, 12),
        })).filter((overlay) => overlay.text || overlay.buttons.length > 0);
    });

export const dismissBlockingOverlays = async (page: Page): Promise<void> => {
    await dismissInstallPrompt(page);
    for (let attempt = 0; attempt < 6; attempt++) {
        const closed =
            (await clickExactText(page, "button", "✕ 閉じる")) ||
            (await clickExactText(page, "button", "閉じる"));
        if (!closed) return;
        await sleep(400);
    }
};

export const gotoApp = async (page: Page, url: string, readyText?: string): Promise<string> => {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    for (let attempt = 0; attempt < 20; attempt++) {
        const text = await bodyText(page);
        if (text.trim() && (!readyText || text.includes(readyText))) return text;
        await sleep(500);
    }
    return bodyText(page);
};
