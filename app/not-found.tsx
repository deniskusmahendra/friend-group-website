import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="font-pixel text-7xl font-bold text-white glow-red">404</p>
      <p className="text-muted-foreground">This page went to get snacks and never came back.</p>
      <Link href="/" className={buttonVariants()}>
        Back home
      </Link>
    </div>
  );
}
