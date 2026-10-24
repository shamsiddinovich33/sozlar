/** User-facing (Uzbek) text for an error message returned by the Cloudinary upload API. */
export function cloudinaryErrorMessage(raw: string | null | undefined): string {
  const message = (raw ?? "").split(" - String to sign")[0]!.trim();
  const settings = "Rasm yuklash sozlamasida xato (Vercel → Environment Variables):";
  if (/cloud[_ ]name/i.test(message)) return `${settings} CLOUDINARY_CLOUD_NAME noto'g'ri`;
  if (/api[_ ]key/i.test(message)) return `${settings} CLOUDINARY_API_KEY noto'g'ri`;
  if (/signature/i.test(message)) return `${settings} CLOUDINARY_API_SECRET noto'g'ri`;
  if (/file size|too large/i.test(message)) return "Rasm hajmi juda katta";
  if (/format|invalid image/i.test(message)) return "Bu rasm formati qo'llab-quvvatlanmaydi";
  return message ? `Rasm yuklanmadi: ${message.slice(0, 160)}` : "Rasm yuklanmadi";
}
