"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { useMe } from "@/components/me-provider";
import { nameOf, type MemberId } from "@/content/members";
import { mutate } from "@/lib/mutate";
import { relativeTime } from "@/lib/time";
import { moveToTrash } from "@/lib/trash";
import {
  membersIn,
  photoKey,
  reactionEmoji,
  reactionKinds,
  type PhotoComment,
  type PhotoReactions,
  type ReactionKind,
} from "@/lib/types";
import { useCollection } from "@/lib/use-collection";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

/** Reactions and comments for every photo, looked up by photo src */
export function usePhotoSocial() {
  const reactions = useCollection("reactions");
  const comments = useCollection("comments");

  return useMemo(() => {
    const reactionsBySrc = new Map<string, PhotoReactions>(reactions.rows.map((r) => [r.photo, r]));
    const commentsBySrc = new Map<string, PhotoComment[]>();
    for (const c of [...comments.rows].sort((a, b) => a.createdAt - b.createdAt)) {
      commentsBySrc.set(c.photo, [...(commentsBySrc.get(c.photo) ?? []), c]);
    }
    const reactorsOf = (src: string, kind: ReactionKind) => membersIn(reactionsBySrc.get(src)?.[kind]);

    return {
      reactorsOf,
      commentsOf: (src: string) => commentsBySrc.get(src) ?? [],
      reactionCount: (src: string) => reactionKinds.reduce((n, k) => n + reactorsOf(src, k).length, 0),
    };
  }, [reactions.rows, comments.rows]);
}

function toggleReaction(src: string, kind: ReactionKind, me: MemberId, on: boolean) {
  // Merge, so two people reacting at once don't overwrite each other
  return mutate((s) => s.merge("reactions", photoKey(src), { photo: src, [kind]: { [me]: on || null } }));
}

/** Small "😂 4 · 💬 2" chip shown on a thumbnail */
export function PhotoCounts({ src, social }: { src: string; social: ReturnType<typeof usePhotoSocial> }) {
  const reactions = social.reactionCount(src);
  const comments = social.commentsOf(src).length;
  if (!reactions && !comments) return null;

  const top = [...reactionKinds].sort((a, b) => social.reactorsOf(src, b).length - social.reactorsOf(src, a).length)[0];
  return (
    <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/65 px-2 py-0.5 text-xs font-semibold text-white">
      {reactions > 0 && (
        <span>
          {reactionEmoji[top]} {reactions}
        </span>
      )}
      {comments > 0 && (
        <span className="flex items-center gap-0.5">
          <MessageCircle className="size-3" /> {comments}
        </span>
      )}
    </span>
  );
}

/** Reactions bar + comment thread for the photo viewer */
export function PhotoSocialPanel({ src }: { src: string }) {
  const { me, requireMe } = useMe();
  const social = usePhotoSocial();
  const now = useNow();
  const comments = social.commentsOf(src);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const list = useRef<HTMLDivElement>(null);

  // Keep the newest comment in view (on open, and when one is added)
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [src, comments.length]);

  const send = async () => {
    const who = requireMe();
    const body = text.trim();
    if (!who || !body) return;
    setSending(true);
    const ok = await mutate((s) => s.add("comments", { photo: src, text: body, by: who }));
    setSending(false);
    if (ok) setText("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap gap-1.5 border-b p-4">
        {reactionKinds.map((kind) => {
          const who = social.reactorsOf(src, kind);
          const mine = me ? who.includes(me) : false;
          return (
            <button
              key={kind}
              type="button"
              title={who.length ? who.map(nameOf).join(", ") : undefined}
              aria-label={`${reactionEmoji[kind]} ${who.length}`}
              aria-pressed={mine}
              onClick={() => {
                const m = requireMe();
                if (m) toggleReaction(src, kind, m, !mine);
              }}
              className={cn(
                "flex h-9 items-center gap-1 rounded-full border px-2.5 text-base transition hover:border-primary active:scale-95",
                mine ? "border-primary bg-primary/20" : "bg-background/40",
              )}
            >
              <span>{reactionEmoji[kind]}</span>
              {who.length > 0 && <span className="text-sm font-semibold">{who.length}</span>}
            </button>
          );
        })}
      </div>

      <div ref={list} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {!comments.length && <p className="py-4 text-center text-sm text-muted-foreground">No comments yet. Say something!</p>}
        {comments.map((c) => (
          <div key={c.id} className="group flex gap-2.5">
            <MemberAvatar id={c.by} size="sm" ring={false} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 text-sm">
                <b>{nameOf(c.by)}</b>
                {now && (
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(new Date(c.createdAt).toISOString(), now)}
                  </span>
                )}
              </div>
              <p className="text-sm break-words whitespace-pre-wrap">{c.text}</p>
            </div>
            {me && c.by === me && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Delete comment"
                className="opacity-60 group-hover:opacity-100"
                onClick={() => moveToTrash("comments", c.id, me, "Comment")}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        ))}
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder={me ? "Add a comment…" : "Pick who you are to comment"}
          aria-label="Comment"
          className="h-10 min-w-0 flex-1 rounded-full border bg-background/60 px-4 text-sm outline-none focus:border-primary"
        />
        <Button type="submit" size="icon-lg" className="rounded-full" disabled={sending || !text.trim()} aria-label="Send comment">
          <Send />
        </Button>
      </form>
    </div>
  );
}
