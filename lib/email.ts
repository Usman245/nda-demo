import { Resend } from "resend";

type Mail = { to: string; subject: string; text: string };

/** Sends via Resend if RESEND_API_KEY is set; otherwise just logs (plan: "can be skipped in v1"). */
export async function sendMail(m: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email skipped - no RESEND_API_KEY] to=${m.to} subject="${m.subject}"\n${m.text}`);
    return;
  }
  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Deal Room <onboarding@resend.dev>",
      to: m.to,
      subject: m.subject,
      text: m.text,
    });
  } catch (e) {
    console.error("email failed", e);
  }
}
