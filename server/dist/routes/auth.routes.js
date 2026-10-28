"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authController = __importStar(require("../controllers/auth.controller"));
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, "Name must be at least 2 characters").max(50),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(100),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
});
const resetPasswordSchema = zod_1.z.object({
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(100),
});
router.post("/register", (0, validate_middleware_1.validate)(registerSchema), authController.register);
router.post("/login", (0, validate_middleware_1.validate)(loginSchema), authController.login);
router.get("/me", auth_middleware_1.authenticate, authController.getMe);
router.post("/forgot-password", (0, validate_middleware_1.validate)(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password/:token", (0, validate_middleware_1.validate)(resetPasswordSchema), authController.resetPassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map