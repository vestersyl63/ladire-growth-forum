// ============================================================
// Transactional email — ARCHITECTURE ONLY for now.
//
// No provider is wired during initial development, so the app
// never depends on email to function. To enable later:
//   1. set EMAIL_PROVIDER (e.g. "resend" | "smtp") + creds in .env
//   2. add a transporter below
//   3. call sendMail() from the event points already marked.
// Credentials are never exposed to the browser.
// ============================================================

export type EmailMessage = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export async function sendMail(_msg: EmailMessage): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER;
  if (!provider) {
    // No provider configured — silently succeed (app is email-optional).
    return;
  }
  // Provider switch goes here (resend/smtp etc).
  console.log(`[mail:${provider}] (not wired yet)`);
  return Promise.resolve();
}

/** Convenience: push a mail into the queue/attempt. No-op today. */
export async function queueMail(msg: EmailMessage): Promise<void> {
  return sendMail(msg);
}
