"use client";

import { TriangleAlert, FlaskConical } from "lucide-react";
import { useStoreStatus } from "@/lib/use-collection";

/** Tells people when their changes aren't being shared with the group */
export function ModeBanner() {
  const status = useStoreStatus();
  if (status !== "local" && status !== "failed") return null;

  const Icon = status === "failed" ? TriangleAlert : FlaskConical;
  return (
    <div className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-6xl">
      <p className="flex items-start gap-2 rounded-xl border border-dashed border-amber-400/50 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-200">
        <Icon className="mt-0.5 size-4 shrink-0" />
        {status === "failed"
          ? "Couldn't connect to the shared database. Changes are only saved on this device for now."
          : "Local mode: changes are saved only in this browser. Add your Firebase keys to share with the gang (see README)."}
      </p>
    </div>
  );
}
