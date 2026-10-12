import "server-only";
import { BRAND, siteUrl } from "@/lib/brand";
import { brevoBody } from "@/lib/email-address";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Branded HTML alternative to the plain-text body. The logo image needs an absolute, public URL, so it is only used when
 * SITE_URL is https; otherwise (local development) the header falls back to the wordmark as text and nothing can break.
 */
function renderHtml(text: string): string {
  const base = siteUrl();
  const logo = base.startsWith("https://")
    ? `<img src="${esc(base)}/brand/algoryva-lockup-email.png" width="180" alt="${BRAND.name}" style="display:block;border:0;height:auto">`
    : `<span style="font:800 24px/1 Helvetica,Arial,sans-serif;color:#1C2433">${BRAND.name}</span>`;
  const body = esc(text).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" style="color:#3A59E0;word-break:break-all">${u}</a>`).replace(/\n/g, "<br>");
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#F4FAFA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #DAE3EA;border-radius:12px">
<tr><td style="padding:24px 28px 8px">${logo}</td></tr>
<tr><td style="padding:8px 28px 28px;font:15px/1.6 Helvetica,Arial,sans-serif;color:#1C2433">${body}</td></tr>
</table></body></html>`;
}

/**
 * Sends through Resend when RESEND_API_KEY is set, otherwise through Brevo when BREVO_API_KEY is set (Brevo's free plan
 * needs no domain: verify one sender address in Brevo and use it as EMAIL_FROM). With neither, or without EMAIL_FROM,
 * the message is printed to the server console (development).
 */
export async function sendEmail(to: string, subject: string, text: string) {
  const resendKey = process.env.RESEND_API_KEY, brevoKey = process.env.BREVO_API_KEY, from = process.env.EMAIL_FROM;
  if (!from || (!resendKey && !brevoKey)) { console.log(`[email not configured]\nTo: ${to}\nSubject: ${subject}\n${text}\n`); return; }
  const html = renderHtml(text);
  try {
    const res = resendKey
      ? await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to, subject, text, html }),
        })
      : await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST", headers: { "api-key": brevoKey!, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(brevoBody({ from, to, subject, text, html })),
        });
    if (!res.ok) console.error("Email provider rejected the message:", res.status);
  } catch (e) { console.error("Email send failed:", (e as Error).message); }
}
