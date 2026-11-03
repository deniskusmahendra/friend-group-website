export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-pixel text-3xl font-bold text-white glow-red sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex w-full gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">{action}</div>}
    </div>
  );
}

export function EmptyState({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center text-muted-foreground">
      <span className="text-4xl">{emoji}</span>
      {children}
    </div>
  );
}

export function LoadingCards({ count = 2 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-52 animate-pulse rounded-2xl border bg-card/60" />
      ))}
    </>
  );
}
