import { Resend } from 'resend';

export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Low-level email sending function utilizing Resend.
 * Gracefully handles missing API keys and network errors without throwing exceptions.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailOptions): Promise<SendEmailResult> {
  const fromAddress = from || process.env.EMAIL_FROM || 'PawMart Nepal <onboarding@resend.dev>';
  const client = getResendClient();

  if (!client) {
    console.warn(
      `[Resend] Skipping email delivery to ${__toStr(to)} (RESEND_API_KEY not configured). Subject: "${subject}"`
    );
    return {
      success: false,
      error: 'RESEND_API_KEY is not configured in environment variables',
    };
  }

  try {
    const { data, error } = await client.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[Resend] Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via Resend',
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: any) {
    console.error('[Resend] Unexpected error sending email:', err);
    return {
      success: false,
      error: err?.message || 'Unexpected error occurred while sending email',
    };
  }
}

function __toStr(to: string | string[]) {
  return Array.isArray(to) ? to.join(', ') : to;
}