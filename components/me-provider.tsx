"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MemberAvatar } from "@/components/member-avatar";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";
import { isMemberId, members, nameOf, type MemberId } from "@/content/members";

// No logins: each visitor picks which member they are, remembered in localStorage.

const KEY = "gang:me";
const listeners = new Set<() => void>();

function readMe(): MemberId | null {
  const v = localStorage.getItem(KEY);
  return isMemberId(v) ? v : null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

type MeContext = {
  me: MemberId | null;
  openPicker: () => void;
  /** Returns the current member, or opens the picker and returns null */
  requireMe: () => MemberId | null;
};

const Ctx = createContext<MeContext | null>(null);

export function useMe(): MeContext {
  const ctx = use(Ctx);
  if (!ctx) throw new Error("useMe must be used inside <MeProvider>");
  // The provider can learn `me` before a Suspense boundary below it hydrates;
  // hide it until this component has hydrated so the HTML matches the server.
  const hydrated = useHydrated();
  return hydrated ? ctx : { ...ctx, me: null };
}

export function MeProvider({ children }: { children: React.ReactNode }) {
  const me = useSyncExternalStore(subscribe, readMe, () => null);
  const [open, setOpen] = useState(false);

  // First visit: ask who they are
  useEffect(() => {
    const t = setTimeout(() => !readMe() && setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  const choose = (id: MemberId) => {
    localStorage.setItem(KEY, id);
    listeners.forEach((l) => l());
    setOpen(false);
    toast(`Hi ${nameOf(id)}! 👋`);
  };

  const openPicker = useCallback(() => setOpen(true), []);
  const requireMe = useCallback(() => {
    if (me) return me;
    toast("Pick who you are first 👋");
    setOpen(true);
    return null;
  }, [me]);

  const value = useMemo(() => ({ me, openPicker, requireMe }), [me, openPicker, requireMe]);

  return (
    <Ctx value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-pixel text-xl">Who are you?</DialogTitle>
            <DialogDescription>Pick yourself so your plans, RSVPs and wishes show your name.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => choose(m.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border bg-background/50 px-2 py-3 font-semibold transition-colors hover:border-primary hover:bg-accent",
                  m.id === me && "border-primary bg-accent",
                )}
              >
                <MemberAvatar id={m.id} size="lg" className="ring-offset-popover" />
                {m.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Ctx>
  );
}
