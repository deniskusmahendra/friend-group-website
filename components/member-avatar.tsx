import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMember, type MemberId } from "@/content/members";

const sizes = {
  xs: "size-5",
  sm: "size-7",
  md: "size-10",
  lg: "size-16",
  xl: "size-20",
};

// "!" beats the fallback's built-in text-sm
const initialSizes = {
  xs: "text-[9px]!",
  sm: "text-xs!",
  md: "text-base!",
  lg: "text-2xl!",
  xl: "text-3xl! max-sm:text-2xl!",
};

export function MemberAvatar({
  id,
  size = "md",
  ring = true,
  className,
}: {
  id: string | null | undefined;
  size?: keyof typeof sizes;
  ring?: boolean;
  className?: string;
}) {
  const m = getMember(id);
  return (
    <Avatar
      className={cn(sizes[size], ring && "ring-2 ring-(--c) ring-offset-2 ring-offset-background", className)}
      style={{ "--c": m?.color ?? "#555" } as React.CSSProperties}
      title={m?.name}
    >
      {m?.photo && <AvatarImage src={m.photo} alt={m.name} />}
      <AvatarFallback className={cn("bg-(--c) font-pixel font-bold text-background", initialSizes[size])}>
        {m?.name[0] ?? "?"}
      </AvatarFallback>
    </Avatar>
  );
}

/** Overlapping row of avatars, e.g. who's going */
export function AvatarStack({ ids, empty = "nobody yet" }: { ids: MemberId[]; empty?: string }) {
  if (!ids.length) return <span className="text-sm text-muted-foreground">{empty}</span>;
  return (
    <span className="flex -space-x-2">
      {ids.map((id) => (
        <MemberAvatar key={id} id={id} size="sm" className="ring-offset-card" />
      ))}
    </span>
  );
}
