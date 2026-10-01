import dotenv from "dotenv";
import path from "path";

const moduleRoot = path.resolve(__dirname, "..");
const sharedEnv = dotenv.config({ path: path.resolve(moduleRoot, "../.env") }).parsed ?? {};
const localEnv = dotenv.config({ path: path.resolve(moduleRoot, ".env") }).parsed ?? {};

const requiredShared = (name: "TIGERS_ID" | "TIGERS_PASSWORD"): string => {
    const value = sharedEnv[name]?.trim();
    if (!value) throw new Error(`共有環境変数 ${name} が ../.env にありません。`);
    return value;
};

const local = (name: string, fallback: string): string =>
    (localEnv[name] ?? process.env[name] ?? fallback).trim();

const matchStamina = Number(local("MATCH_STAMINA", "1"));
if (![1, 2, 3].includes(matchStamina)) {
    throw new Error("MATCH_STAMINA は 1、2、3 のいずれかにしてください。");
}

export const config = {
    moduleRoot,
    baseUrl: local("ORICAL_BASE_URL", "https://tigerscollection.orical.jp").replace(/\/$/, ""),
    loginUrl: local(
        "ORICAL_LOGIN_URL",
        "https://tigerscollection.orical.jp/login/tigers?redirect=%2Fgame"
    ),
    tigersId: requiredShared("TIGERS_ID"),
    tigersPassword: requiredShared("TIGERS_PASSWORD"),
    matchStamina,
    dryRun: local("DRY_RUN", "false") === "true",
};
