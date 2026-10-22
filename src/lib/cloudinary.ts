import { createHash } from "node:crypto";

const AVATAR_FOLDER = "sozlik/avatars";
const AVATAR_FORMATS = ["jpg", "jpeg", "png", "webp"] as const;
/** Applied by Cloudinary on upload, so only a small square image is stored. */
const AVATAR_TRANSFORMATION = "c_fill,g_face,w_256,h_256";

export type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

export function getCloudinaryConfig(
  env: Record<string, string | undefined> = process.env,
): CloudinaryConfig | null {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

/** Cloudinary request signature: SHA-1 of the alphabetically sorted params plus the API secret. */
export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

/** Signed parameters for a direct browser upload of one user's avatar. */
export function avatarUploadParams(userId: string, timestamp: number) {
  return {
    allowed_formats: AVATAR_FORMATS.join(","),
    folder: AVATAR_FOLDER,
    invalidate: "true",
    overwrite: "true",
    public_id: userId,
    timestamp,
    transformation: AVATAR_TRANSFORMATION,
  };
}

/** Accepts only HTTPS delivery URLs of this user's avatar in our Cloudinary account. */
export function isOwnAvatarUrl(url: string, cloudName: string, userId: string): boolean {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `^https://res\\.cloudinary\\.com/${escape(cloudName)}/image/upload/(?:v\\d+/)?${escape(AVATAR_FOLDER)}/${escape(userId)}\\.(?:${AVATAR_FORMATS.join("|")})$`,
  );
  return pattern.test(url);
}
