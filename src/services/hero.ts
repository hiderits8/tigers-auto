import { Page } from "puppeteer";

const { BASE_URL, HERO_PLAYER_NAME } = process.env;

const HERO_URL = `${BASE_URL}/hero.html`;

if (!BASE_URL || !HERO_PLAYER_NAME) {
    throw new Error("環境変数が不足しています。.env を確認してください。");
}

const cannotVote = async (page: Page): Promise<boolean> => {
    const textNode = await page.waitForSelector(
        "#contents > section.article01"
    );
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

const goToVotePage = async (page: Page): Promise<boolean> => {
    // プレゼントページへ
    await page.waitForSelector("section.btnset01.article01.timer_set");

    await page.click("section.btnset01.article01.timer_set > a");

    if (await cannotVote(page)) {
        console.log("本日は投票できません。");
        return false;
    }

    // 投票ページへ
    Promise.all([
        await page.waitForSelector("//*[@id='contents']/section[3]/div/a"),
        await page.click("//*[@id='contents']/section[3]/div/a"),
    ]);
    return true;
};

export const vote = async (page: Page): Promise<void> => {
    await page.goto(HERO_URL, { waitUntil: "networkidle2" });

    // 投票ページへ
    if (!(await goToVotePage(page))) {
        return;
    }

    // プレイヤーを選択
    await page.waitForSelector("#MemberPresentPresentOptionId");
    const playerTxt = await page.$$eval(
        "#MemberPresentPresentOptionId",
        (options) => {
            return options.find((option) =>
                option.textContent?.includes(HERO_PLAYER_NAME)
            ) as HTMLOptionElement;
        }
    );
    await page.select("#MemberPresentPresentOptionId", playerTxt.value);

    // 投票ボタンを押す
    Promise.all([
        await page.waitForSelector(
            "#MemberEnqueteInputForm > section:nth-child(5) > div.form01 > div.btnset02.set > ul > li > input[type=submit]"
        ),
        await page.click(
            "#MemberEnqueteInputForm > section:nth-child(5) > div.form01 > div.btnset02.set > ul > li > input[type=submit]"
        ),
    ]);

    // 確認ボタンを押す
    Promise.all([
        await page.waitForSelector(
            "#MemberEnqueteConfirmForm > section > div > div.btnset02.set > ul > li:nth-child(1) > input[type=submit]"
        ),
        await page.click(
            "#MemberEnqueteConfirmForm > section > div > div.btnset02.set > ul > li:nth-child(1) > input[type=submit]"
        ),
    ]);

    console.log("投票が完了しました。");
};
