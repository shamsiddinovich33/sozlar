import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function getInitials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

export function UserAvatar({
  name,
  image,
  className,
  fallbackClassName,
}: {
  name: string | null | undefined;
  image: string | null | undefined;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={className}>
      {image && <AvatarImage src={image} alt="" />}
      <AvatarFallback aria-hidden className={fallbackClassName}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
