"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
dotenv_1.default.config();
const required = ["PORT", "MONGODB_URI", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
    throw new Error(`[env] Missing required environment variable(s): ${missing.join(", ")}`);
}
exports.env = {
    port: Number(process.env.PORT),
    nodeEnv: process.env.NODE_ENV ?? "development",
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    clientUrl: process.env.CLIENT_URL ?? "*",
    cloudinaryCloudName: (process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME)?.trim(),
    cloudinaryApiKey: (process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY)?.trim(),
    cloudinaryApiSecret: (process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET)?.trim(),
    emailService: process.env.EMAIL_SERVICE?.trim(),
    emailUser: (process.env.EMAIL_USER || process.env.SMTP_USER)?.trim(),
    emailPass: (process.env.EMAIL_PASS || process.env.SMTP_PASS)?.trim(),
    emailFrom: process.env.EMAIL_FROM?.trim() ||
        '"TaskTrace Kanban" <support@tasktrace.com>',
    smtpHost: process.env.SMTP_HOST?.trim(),
    smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    smtpSecure: process.env.SMTP_SECURE === "true",
};
//# sourceMappingURL=env.js.map