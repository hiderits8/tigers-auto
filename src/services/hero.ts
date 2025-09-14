import { Page } from "puppeteer";

const { BASE_URL, HERO_PLAYER_NAME } = process.env;

const HERO_URL = `${BASE_URL}/hero.html`;

if (!BASE_URL || !HERO_PLAYER_NAME) {
    throw new Error("環境変数が不足しています。.env を確認してください。");
}

const cannotVote = async (page: Page): Promise<boolean> => {
    const textNode = await page.waitForSelector("//section");
    const text: string | null | undefined = await textNode?.evaluate(
        (el) => el.textContent
    );
    if (
        !text ||
        text.includes("この企画の応募期間は終了いたしました。") ||
        text.includes("ページが見つかりません")
    ) {
        return true;
    }
    return false;
};

export const vote = async (page: Page): Promise<void> => {
    const voteButton = await page.waitForSelector("//button[@name='vote']");
    await voteButton.click();
};
