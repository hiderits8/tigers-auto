"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const moduleRoot = path_1.default.resolve(__dirname, "..");
const sharedEnv = dotenv_1.default.config({ path: path_1.default.resolve(moduleRoot, "../.env") }).parsed ?? {};
const localEnv = dotenv_1.default.config({ path: path_1.default.resolve(moduleRoot, ".env") }).parsed ?? {};
const requiredShared = (name) => {
    const value = sharedEnv[name]?.trim();
    if (!value)
        throw new Error(`共有環境変数 ${name} が ../.env にありません。`);
    return value;
};
const local = (name, fallback) => (localEnv[name] ?? process.env[name] ?? fallback).trim();
const matchStamina = Number(local("MATCH_STAMINA", "1"));
if (![1, 2, 3].includes(matchStamina)) {
    throw new Error("MATCH_STAMINA は 1、2、3 のいずれかにしてください。");
}
exports.config = {
    moduleRoot,
    baseUrl: local("ORICAL_BASE_URL", "https://tigerscollection.orical.jp").replace(/\/$/, ""),
    loginUrl: local("ORICAL_LOGIN_URL", "https://tigerscollection.orical.jp/login/tigers?redirect=%2Fgame"),
    tigersId: requiredShared("TIGERS_ID"),
    tigersPassword: requiredShared("TIGERS_PASSWORD"),
    matchStamina,
    dryRun: local("DRY_RUN", "false") === "true",
};
//# sourceMappingURL=config.js.map