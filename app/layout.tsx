import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Silkscreen, Space_Grotesk } from "next/font/google";
import { MeProvider } from "@/components/me-provider";
import { ModeBanner } from "@/components/mode-banner";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { site } from "@/content/site";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin"],
});

// Absolute URL for link previews (WhatsApp, Discord). Vercel sets VERCEL_PROJECT_PRODUCTION_URL.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name} · our friend group`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { title: site.name, description: site.tagline, type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#08080f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${silkscreen.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Neon frame lines, like the group photo */}
        <div aria-hidden className="pointer-events-none fixed inset-y-0 left-2.5 z-0 hidden w-0.5 bg-neon-red opacity-50 shadow-[0_0_14px_var(--neon-red)] md:block" />
        <div aria-hidden className="pointer-events-none fixed inset-y-0 right-2.5 z-0 hidden w-0.5 bg-neon-blue opacity-50 shadow-[0_0_14px_var(--neon-blue)] md:block" />

        <MeProvider>
          {/* usePathname can suspend under Cache Components */}
          <Suspense fallback={<div className="h-16 border-b" />}>
            <SiteHeader />
          </Suspense>
          <ModeBanner />
          <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-7 md:px-6">{children}</main>
          <footer className="relative z-10 pt-6 pb-28 text-center text-sm text-muted-foreground md:pb-8">
            made with 💖 by the gang ·{" "}
            <Link href="/trash" className="underline-offset-4 hover:text-foreground hover:underline">
              trash &amp; backup
            </Link>
          </footer>
        </MeProvider>
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  );
}
