import nodemailer from "nodemailer";
import { env } from "../config/env";

export interface SendPasswordResetParams {
  to: string;
  name: string;
  resetUrl: string;
}

export class EmailService {
  private static async getTransporter() {
    // 1. If explicit SMTP host is configured (e.g., Brevo, Resend, custom SMTP)
    if (env.smtpHost && env.emailUser && env.emailPass) {
      return nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort || (env.smtpSecure ? 465 : 587),
        secure: env.smtpSecure || false,
        auth: {
          user: env.emailUser,
          pass: env.emailPass,
        },
      });
    }

    // 2. If standard service (e.g. Gmail with App Password) is configured
    const cleanPass = env.emailPass ? env.emailPass.replace(/\s+/g, "") : "";
    const isRealPass =
      Boolean(cleanPass) &&
      !cleanPass.includes("your_16_character_app_password");

    if (env.emailUser && isRealPass) {
      return nodemailer.createTransport({
        service: env.emailService || "gmail",
        auth: {
          user: env.emailUser,
          pass: cleanPass,
        },
      });
    }

    // 3. Fallback for Local Development / Free testing without API keys:
    // Create an automatic Ethereal test account so developers can test immediately!
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log(
        "[EmailService] ℹ️ Using Ethereal test email account for local development.",
      );
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch {
      // In case network blocks Ethereal creation, return null to log directly
      return null;
    }
  }

  /**
   * Sends a styled password reset email to the user
   */
  static async sendPasswordResetEmail({
    to,
    name,
    resetUrl,
  }: SendPasswordResetParams): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const senderEmail =
        env.emailFrom || '"TaskTrace Kanban" <support@tasktrace.com>';

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0c0f17;
      color: #e2e8f0;
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #151b28;
      border: 1px solid #283347;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }
    .brand {
      font-size: 22px;
      font-weight: 700;
      color: #6366f1;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }
    h2 {
      color: #f8fafc;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 12px;
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      margin: 12px 0;
    }
    .btn-container {
      margin: 28px 0;
      text-align: center;
    }
    .btn {
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      display: inline-block;
      letter-spacing: 0.2px;
    }
    .fallback {
      background: #0d121c;
      border: 1px solid #232c3d;
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      word-break: break-all;
      color: #818cf8;
      margin-top: 20px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #232c3d;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">
      <span>TaskTrace Kanban</span>
    </div>
    <h2>Password Reset Request</h2>
    <p>Hi ${escapeHtml(name || "there")},</p>
    <p>We received a request to reset the password for your TaskTrace account. Click the button below to choose a new password:</p>
    
    <div class="btn-container">
      <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset My Password</a>
    </div>

    <p style="font-size: 13px; color: #64748b;">
      ⏱️ This link will expire in <strong>15 minutes</strong> for security reasons.<br>
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>

    <div class="fallback">
      <span style="color: #64748b; font-size: 11px; display: block; margin-bottom: 4px;">Having trouble with the button? Copy and paste this link in your browser:</span>
      <a href="${resetUrl}" style="color: #818cf8; text-decoration: none;">${resetUrl}</a>
    </div>

    <div class="footer">
      TaskTrace Kanban &bull; Real-time Project &amp; Task Collaboration
    </div>
  </div>
</body>
</html>
      `;

      if (transporter) {
        const info = await transporter.sendMail({
          from: senderEmail,
          to,
          subject: "Reset your TaskTrace password",
          html: htmlContent,
        });

        // If using Ethereal, log preview URL
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(
            `\n============================================================`,
          );
          console.log(`📧 [EMAIL SERVICE - PREVIEW URL]`);
          console.log(`🌐 Preview Email: ${previewUrl}`);
          console.log(`🔗 Direct Reset Link: ${resetUrl}`);
          console.log(
            `============================================================\n`,
          );
        } else {
          console.log(`[EmailService] ✉️ Password reset email sent to ${to}`);
        }
      } else {
        // Direct console output if no transporter could be created
        console.log(
          `\n============================================================`,
        );
        console.log(`📧 [EMAIL SERVICE - DEV FALLBACK]`);
        console.log(`👤 Recipient: ${to}`);
        console.log(`🔗 Reset Link: ${resetUrl}`);
        console.log(
          `============================================================\n`,
        );
      }

      return true;
    } catch (error) {
      console.error(
        "[EmailService] Failed to send password reset email:",
        error,
      );
      // Still log reset URL in dev so user/developer isn't locked out!
      console.log(`[EmailService] 🔗 Fallback Direct Link: ${resetUrl}`);
      return false;
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
