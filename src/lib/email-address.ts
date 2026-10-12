/** Splits "Algoryva <no-reply@example.com>" into the name and address parts that Brevo expects. A bare address has no name. */
export function parseFrom(from: string): { name?: string; email: string } {
  const m = /^\s*(.*?)\s*<([^<>]+)>\s*$/.exec(from);
  if (!m) return { email: from.trim() };
  const name = m[1].replace(/^"(.*)"$/, "$1").trim();
  return name ? { name, email: m[2].trim() } : { email: m[2].trim() };
}

/** The request body for Brevo's transactional email API (POST https://api.brevo.com/v3/smtp/email). */
export function brevoBody(o: { from: string; to: string; subject: string; text: string; html: string }) {
  return { sender: parseFrom(o.from), to: [{ email: o.to }], subject: o.subject, textContent: o.text, htmlContent: o.html };
}
