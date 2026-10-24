"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getAvatarUploadParams, removeAvatar, setAvatar } from "@/app/(app)/profile/actions";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Button } from "@/components/ui/button";
import { cloudinaryErrorMessage } from "@/lib/cloudinary-errors";

const MAX_BYTES = 2 * 1024 * 1024;
const UPLOAD_FAILED = "Rasm yuklanmadi. Internet aloqasini tekshirib, qayta urinib ko'ring";

/** An error whose message is already user-facing (Uzbek). */
class UploadError extends Error {}
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUploader({
  name,
  image,
  uploadEnabled,
}: {
  name: string | null;
  image: string | null;
  uploadEnabled: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!TYPES.includes(file.type)) {
      toast.error("Faqat JPG, PNG yoki WEBP rasm yuklash mumkin");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Rasm hajmi 2 MB dan oshmasligi kerak");
      return;
    }
    setBusy(true);
    try {
      const params = await getAvatarUploadParams();
      if (!params.ok) throw new UploadError(params.error);
      const body = new FormData();
      body.append("file", file);
      for (const [key, value] of Object.entries(params.data.fields)) body.append(key, value);
      const response = await fetch(params.data.uploadUrl, { method: "POST", body });
      const json: unknown = await response.json().catch(() => null);
      const url =
        typeof json === "object" && json !== null && "secure_url" in json
          ? String(json.secure_url)
          : null;
      if (!response.ok || !url) {
        const raw =
          typeof json === "object" &&
          json !== null &&
          "error" in json &&
          typeof json.error === "object" &&
          json.error !== null &&
          "message" in json.error
            ? String(json.error.message)
            : `HTTP ${response.status}`;
        console.error("Cloudinary upload failed:", raw);
        throw new UploadError(cloudinaryErrorMessage(raw));
      }
      const saved = await setAvatar({ url });
      if (!saved.ok) throw new UploadError(saved.error);
      toast.success("Rasm yangilandi");
      router.refresh();
    } catch (error) {
      // Network and parsing errors come in English from the browser; show our own message.
      toast.error(error instanceof UploadError ? error.message : UPLOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    const result = await removeAvatar();
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Rasm olib tashlandi");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar name={name} image={image} className="size-20" fallbackClassName="text-2xl" />
      {uploadEnabled && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
            Rasm yuklash
          </Button>
          {image && (
            <Button variant="ghost" size="sm" onClick={() => void remove()} disabled={busy}>
              <Trash2 aria-hidden />
              Olib tashlash
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={TYPES.join(",")}
            className="hidden"
            aria-hidden
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}
