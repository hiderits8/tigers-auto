"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vote = void 0;
const { BASE_URL, HERO_PLAYER_NAME } = process.env;
const HERO_URL = `${BASE_URL}/hero.html`;
if (!BASE_URL || !HERO_PLAYER_NAME) {
    throw new Error("環境変数が不足しています。.env を確認してください。");
}
const cannotVote = async (page) => {
    const title = await page.title();
    if (title.includes("ページが見つかりません")) {
        return true;
    }
    const cannotVoteMessage = await page.evaluate(() => {
        const element = document.querySelector("#contents > section.article01 > p");
        if (!element) {
            return null;
        }
        return element.textContent;
    });
    if (cannotVoteMessage &&
        cannotVoteMessage.includes("この企画の応募期間は終了いたしました。")) {
        return true;
    }
    const alreadyVotedMessage = await page.evaluate(() => {
        const element = document.querySelector("#contents > section.article01 > p");
        if (!element) {
            return null;
        }
        return element.textContent;
    });
    if (alreadyVotedMessage &&
        alreadyVotedMessage.includes("この企画への応募は完了いたしております。")) {
        return true;
    }
    return false;
};
const vote = async (page) => {
    await page.goto(HERO_URL, { waitUntil: "networkidle2" });
    // 投票ページへ
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("#contents > section:nth-child(9) > a"),
    ]);
    if (await cannotVote(page)) {
        console.log("投票できませんでした。");
        return;
    }
    // 投票ページへ
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("#contents > section:nth-child(6) > div > a"),
    ]);
    // プレイヤーを選択
    const heroName = HERO_PLAYER_NAME.trim();
    const valueToSelect = await page.$$eval("#MemberPresentPresentOptionId option", (options, hero) => {
        const hit = options.find((o) => (o.textContent || "").includes(hero));
        return hit ? hit.value : null;
    }, heroName);
    if (!valueToSelect) {
        throw new Error(`該当選手が見つかりません: ${heroName}`);
    }
    await page.select("#MemberPresentPresentOptionId", valueToSelect);
    // 投票ボタンを押す
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("#MemberEnqueteInputForm > section:nth-child(5) > div.form01 > div.btnset02.set > ul > li > input[type=submit]"),
    ]);
    // 確認ボタンを押す
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("#MemberEnqueteConfirmForm > section > div > div.btnset02.set > ul > li:nth-child(1) > input[type=submit]"),
    ]);
    console.log("投票が完了しました");
};
exports.vote = vote;
//# sourceMappingURL=hero.js.map