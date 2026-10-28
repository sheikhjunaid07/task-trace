"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.getMe = exports.login = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const email_service_1 = require("../services/email.service");
const signToken = (userId) => jsonwebtoken_1.default.sign({ id: userId }, env_1.env.jwtSecret, {
    expiresIn: env_1.env.jwtExpiresIn,
});
const sanitizeUser = (user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
});
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User_1.User.findOne({ email });
    if (existing) {
        throw new ApiError_1.ApiError(409, "A user with this email already exists");
    }
    const user = await User_1.User.create({ name, email, password });
    const token = signToken(String(user._id));
    res.status(201).json(new ApiResponse_1.ApiResponse(201, "Registration successful", {
        token,
        user: sanitizeUser(user),
    }));
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError_1.ApiError(401, "Invalid email or password");
    }
    const token = signToken(String(user._id));
    res.json(new ApiResponse_1.ApiResponse(200, "Login successful", {
        token,
        user: sanitizeUser(user),
    }));
});
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json(new ApiResponse_1.ApiResponse(200, "Profile fetched", sanitizeUser(req.user)));
});
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const user = await User_1.User.findOne({ email });
    if (user) {
        // Generate secure random reset token
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        // Hash token to store in database (never store plain tokens)
        user.passwordResetToken = crypto_1.default
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        // Token valid for 15 minutes
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save({ validateBeforeSave: false });
        // Client reset URL
        const clientBase = env_1.env.clientUrl && env_1.env.clientUrl !== "*"
            ? env_1.env.clientUrl.split(",")[0].trim()
            : "http://localhost:5173";
        const resetUrl = `${clientBase.replace(/\/$/, "")}/reset-password/${resetToken}`;
        // Send email (asynchronously with robust fallback)
        await email_service_1.EmailService.sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetUrl,
        });
    }
    // Consistent message to prevent email enumeration
    res.json(new ApiResponse_1.ApiResponse(200, "If an account with that email exists, a password reset link has been sent to your email.", null));
});
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    if (!token) {
        throw new ApiError_1.ApiError(400, "Reset token is required");
    }
    // Hash incoming token to match the database hash
    const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
    const user = await User_1.User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");
    if (!user) {
        throw new ApiError_1.ApiError(400, "Password reset link is invalid or has expired. Please request a new one.");
    }
    // Set new password (the pre-save hook will bcrypt-hash it automatically)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(new ApiResponse_1.ApiResponse(200, "Password has been successfully reset! You can now log in with your new password.", null));
});
//# sourceMappingURL=auth.controller.js.map