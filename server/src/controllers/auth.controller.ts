import { Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { EmailService } from "../services/email.service";

const signToken = (userId: string): string =>
  jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });

const sanitizeUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  avatar?: string;
}) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  avatar: user.avatar,
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const user = await User.create({ name, email, password });
  const token = signToken(String(user._id));

  res.status(201).json(
    new ApiResponse(201, "Registration successful", {
      token,
      user: sanitizeUser(user),
    }),
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email: string;
    password: string;
  };

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken(String(user._id));

  res.json(
    new ApiResponse(200, "Login successful", {
      token,
      user: sanitizeUser(user),
    }),
  );
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.json(new ApiResponse(200, "Profile fetched", sanitizeUser(req.user!)));
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    const user = await User.findOne({ email });

    if (user) {
      // Generate secure random reset token
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Hash token to store in database (never store plain tokens)
      user.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      // Token valid for 15 minutes
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

      await user.save({ validateBeforeSave: false });

      // Client reset URL
      const clientBase =
        env.clientUrl && env.clientUrl !== "*"
          ? env.clientUrl.split(",")[0].trim()
          : "http://localhost:5173";
      const resetUrl = `${clientBase.replace(/\/$/, "")}/reset-password/${resetToken}`;

      // Send email (asynchronously with robust fallback)
      await EmailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    }

    // Consistent message to prevent email enumeration
    res.json(
      new ApiResponse(
        200,
        "If an account with that email exists, a password reset link has been sent to your email.",
        null,
      ),
    );
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body as { password: string };

    if (!token) {
      throw new ApiError(400, "Reset token is required");
    }

    // Hash incoming token to match the database hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      throw new ApiError(
        400,
        "Password reset link is invalid or has expired. Please request a new one.",
      );
    }

    // Set new password (the pre-save hook will bcrypt-hash it automatically)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json(
      new ApiResponse(
        200,
        "Password has been successfully reset! You can now log in with your new password.",
        null,
      ),
    );
  },
);
