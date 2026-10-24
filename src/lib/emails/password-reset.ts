const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** The password reset email (subject, HTML and plain text). */
export function passwordResetEmail({ name, link }: { name: string | null; link: string }) {
  const greeting = name ? `Salom, ${name}!` : "Salom!";
  const subject = "Lexa: parolni tiklash";
  const text = [
    greeting,
    "",
    "Lexa hisobingiz parolini tiklash so'raldi. Yangi parol o'rnatish uchun havolani oching:",
    link,
    "",
    "Havola 1 soat ishlaydi va faqat bir marta ishlatiladi.",
    "Agar buni siz so'ramagan bo'lsangiz, xatga e'tibor bermang — parolingiz o'zgarmaydi.",
  ].join("\n");
  const safeLink = escapeHtml(link);
  const html = `<!doctype html>
<html lang="uz"><body style="margin:0;background:#f4f5fb;font-family:Arial,Helvetica,sans-serif;color:#1a1d3a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:20px;font-weight:bold;padding-bottom:16px">Lexa</td></tr>
<tr><td style="font-size:16px;padding-bottom:8px">${escapeHtml(greeting)}</td></tr>
<tr><td style="font-size:15px;line-height:1.5;padding-bottom:24px">Hisobingiz parolini tiklash so'raldi. Yangi parol o'rnatish uchun tugmani bosing.</td></tr>
<tr><td style="padding-bottom:24px"><a href="${safeLink}" style="display:inline-block;background:#4255ff;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:10px">Yangi parol o'rnatish</a></td></tr>
<tr><td style="font-size:13px;line-height:1.5;color:#586380">Havola 1 soat ishlaydi va faqat bir marta ishlatiladi. Agar buni siz so'ramagan bo'lsangiz, xatga e'tibor bermang — parolingiz o'zgarmaydi.</td></tr>
<tr><td style="font-size:12px;color:#586380;padding-top:16px;word-break:break-all">${safeLink}</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}
