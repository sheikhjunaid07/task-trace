import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useResetPasswordMutation } from "../../../api/authApi";
import {
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

export const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) {
      setErrorMsg("Invalid or missing password reset token.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify both fields.");
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(
        err.data?.message ||
          "Failed to reset password. The link may have expired or is invalid.",
      );
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
      <div className="login-orb" style={{ top: "-140px", right: "-120px" }} />
      <div
        className="login-orb"
        style={{
          bottom: "-160px",
          left: "-140px",
          background: "var(--glow-2)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 0.8, 0.32, 1] }}
        className="relative w-full max-w-md modal-panel p-5 sm:p-8 rounded-2xl"
      >
        {!isSuccess ? (
          <>
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="brand-mark w-14 h-14 mb-4">
                <KeyRound className="w-7 h-7" />
              </div>
              <h1 className="text-section text-ink">Set New Password</h1>
              <p className="text-body text-mute mt-1.5">
                Choose a strong new password for your TaskTrace account
              </p>
            </div>

            {errorMsg && (
              <div className="notice notice-danger mb-6 flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {errorMsg.toLowerCase().includes("expired") && (
                  <Link
                    to="/forgot-password"
                    className="text-xs underline underline-offset-2 font-medium self-start ml-6"
                  >
                    Request a new reset link &rarr;
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input pr-11"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors p-1 rounded-md focus:outline-none cursor-pointer"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors p-1 rounded-md focus:outline-none cursor-pointer"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-3.5"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-[color-mix(in_srgb,var(--on-accent)_35%,transparent)] border-t-[color-mix(in_srgb,var(--on-accent)_90%,transparent)] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-2"
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-[color-mix(in_srgb,#10b981_16%,transparent)] border border-[color-mix(in_srgb,#10b981_30%,transparent)] text-[#10b981]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-section text-ink">Password Reset Complete!</h2>
            <p className="text-body text-mute mt-2">
              Your password has been successfully updated. You can now use your
              new password to sign in.
            </p>

            <div className="mt-8">
              <Link to="/login" className="btn btn-primary w-full py-3.5">
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {!isSuccess && (
          <p className="mt-8 text-center text-sm text-mute">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-semibold underline underline-offset-2"
              style={{ color: "var(--accent)" }}
            >
              Sign In
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
};
