import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useForgotPasswordMutation } from "../../../api/authApi";
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Send,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

export const ForgotPasswordPage: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      await forgotPassword({ email }).unwrap();
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMsg(
        err.data?.message ||
          "Failed to send password reset email. Please try again.",
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
        {!isSubmitted ? (
          <>
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="brand-mark w-14 h-14 mb-4">
                <Mail className="w-7 h-7" />
              </div>
              <h1 className="text-section text-ink">Forgot Password?</h1>
              <p className="text-body text-mute mt-1.5">
                No worries! Enter your account email and we'll send you
                instructions to reset your password.
              </p>
            </div>

            {errorMsg && (
              <div className="notice notice-danger mb-6 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Account Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="input pl-10"
                    autoFocus
                  />
                  <Mail className="w-4 h-4 text-mute absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    <span>Send Reset Link</span>
                    <Send className="w-4 h-4" />
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

            <h2 className="text-section text-ink">Check Your Email</h2>
            <p className="text-body text-mute mt-2">
              If an account exists with{" "}
              <strong className="text-ink font-semibold">{email}</strong>, you
              will receive a password reset link shortly.
            </p>

            <div className="mt-6 p-3.5 rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-xs text-mute flex items-start gap-2.5 text-left">
              <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>
                Please check your inbox as well as your spam/junk folder. The
                reset link expires in 15 minutes.
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="btn btn-secondary w-full py-2.5 text-xs"
              >
                Try another email or resend
              </button>
            </div>
          </motion.div>
        )}

        <div className="mt-7 pt-5 border-t border-[color-mix(in_srgb,var(--line)_60%,transparent)] flex justify-center">
          <Link
            to={`/login${location.search}`}
            className="inline-flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
