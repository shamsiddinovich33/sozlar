"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MAX_GROUP_MEMBERS } from "@/lib/groups";

export function InviteBox({
  inviteToken,
  memberCount,
}: {
  inviteToken: string;
  memberCount: number;
}) {
  const full = memberCount >= MAX_GROUP_MEMBERS;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/groups/join/${inviteToken}`);
      toast.success("Taklif havolasi nusxalandi");
    } catch {
      toast.error("Havolani nusxalab bo'lmadi");
    }
  }

  return (
    <div className="grid gap-3 rounded-xl bg-card p-5 shadow-sm">
      <div className="grid gap-1">
        <h2 className="font-bold">
          Havolani ulashib a&apos;zolarni taklif qiling ({MAX_GROUP_MEMBERS} tagacha)
        </h2>
        <p className="text-sm text-muted-foreground">
          Taklifni qabul qilganlar sizning ismingiz, foydalanuvchi nomingiz va natijalaringizni
          ko&apos;radi.
        </p>
      </div>
      <div>
        <Button onClick={() => void copy()} disabled={full}>
          <Link2 aria-hidden />
          {full ? "Guruh to'lgan" : "Havolani nusxalash"}
        </Button>
      </div>
    </div>
  );
}
