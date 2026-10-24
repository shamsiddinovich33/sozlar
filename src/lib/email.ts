import "server-only";

export type EmailMessage = { to: string; subject: string; html: string; text: string };

const DEFAULT_FROM = "Lexa <onboarding@resend.dev>";

/** Email is sent through Resend when RESEND_API_KEY is set. */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** Password reset is offered when email works, and always in development (links go to the log). */
export function isPasswordResetAvailable(): boolean {
  return isEmailConfigured() || process.env.NODE_ENV !== "production";
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email] ${message.subject} → ${message.to}\n${message.text}`);
      return;
    }
    throw new Error("RESEND_API_KEY is not set");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || DEFAULT_FROM, ...message }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Resend error ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
}
