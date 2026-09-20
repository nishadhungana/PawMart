import { sendEmail, type SendEmailResult } from '@/lib/resend';

export interface SendPasswordResetEmailParams {
  email: string;
  name: string;
  resetUrl: string;
}

/**
 * Sends a branded password reset email with secure token link.
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: SendPasswordResetEmailParams): Promise<SendEmailResult> {
  const recipientName = name || 'PawMart User';
  const currentYear = new Date().getFullYear();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your PawMart Nepal Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%); padding: 36px 30px; text-align: center;">
              <div style="font-size: 36px; line-height: 1; margin-bottom: 8px;">🐾</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Paw<span style="color: #fdba74;">Mart</span> <span style="font-size: 13px; font-weight: 600; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 6px; vertical-align: middle;">Nepal</span>
              </h1>
              <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 13px; font-weight: 500;">
                Password Reset Request
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; color: #1f2937;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #111827;">
                Hello, ${recipientName} 👋
              </h2>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                We received a request to reset the password for your <strong>PawMart Nepal</strong> account. Click the button below to set up a new password:
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);">
                      🔐 Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry & Security Notice -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #166534;">
                  ⏰ Security Notice:
                </p>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: #15803d;">
                  <li>This link will expire in <strong>1 hour</strong> for your security.</li>
                  <li>If you did not request this password reset, please ignore this email—your account remains safe.</li>
                </ul>
              </div>

              <!-- Fallback plain URL -->
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                If the button above does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin: 0; font-size: 11px; word-break: break-all; color: #059669; font-family: monospace; background: #f9fafb; padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${resetUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 32px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #6b7280;">
                PawMart Nepal • Multi-Vendor Pet Marketplace &amp; Vet Healthcare
              </p>
              <p style="margin: 0; font-size: 11px;">
                Kathmandu, Lalitpur, Pokhara • Nepal<br>
                &copy; ${currentYear} PawMart Nepal. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
🐾 PawMart Nepal - Password Reset Request

Hello ${recipientName},

We received a request to reset your password. Use the link below to set a new password (valid for 1 hour):

${resetUrl}

If you did not request this, please ignore this email.

— PawMart Nepal Team
`;

  return sendEmail({
    to: email,
    subject: '🔐 Reset Your PawMart Nepal Password',
    html,
    text,
  });
}
