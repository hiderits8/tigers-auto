"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stamp = void 0;
const { BASE_URL } = process.env;
const STAMP_URL = `${BASE_URL}/stamp`;
if (!BASE_URL) {
    throw new Error("環境変数が不足しています。.env を確認してください。");
}
const stamp = async (page) => {
    // スタンプページにアクセス
    await page.goto(STAMP_URL, { waitUntil: "networkidle2" });
    const isDisabled = await page.$eval("button[name='stampBtn']", (el) => el.getAttribute("disabled") === "disabled");
    // スタンプが押せない場合は処理を終了
    if (isDisabled) {
        return { stamped: false };
    }
    // スタンプを押す
    await page.click("button[name='stampBtn']");
    return { stamped: true };
};
exports.stamp = stamp;
//# sourceMappingURL=stamp.js.map