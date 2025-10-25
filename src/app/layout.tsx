import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "SoundSketch",
  description: "Turn audio into sheet music and analyze music clips",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-[#0f1724] via-[#08101b] to-[#04040a] text-slate-100 antialiased">
        <TRPCReactProvider>
          <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-black/30 border-b border-white/5">
            <div className="container mx-auto flex items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-3">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <rect
                    x="2"
                    y="3"
                    width="6"
                    height="14"
                    rx="1"
                    fill="url(#g)"
                  />
                  <rect
                    x="10"
                    y="7"
                    width="6"
                    height="10"
                    rx="1"
                    fill="url(#g)"
                  />
                  <rect
                    x="18"
                    y="5"
                    width="4"
                    height="12"
                    rx="1"
                    fill="url(#g)"
                  />
                  <defs>
                    <linearGradient id="g" x1="0" x2="1">
                      <stop offset="0" stopColor="#7c3aed" />
                      <stop offset="1" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-xl font-semibold tracking-tight">
                  SoundSketch
                </span>
              </Link>

              <nav className="flex items-center gap-4">
                <Link
                  href="/SheetSketcher"
                  className="rounded-full px-4 py-2 text-sm font-medium hover:bg-white/5"
                >
                  SheetSketcher
                </Link>
                <Link
                  href="/SoundAnalyzer"
                  className="rounded-full px-4 py-2 text-sm font-medium hover:bg-white/5"
                >
                  SoundAnalyzer
                </Link>
                <a
                  href="https://github.com/Liam-Huang-UCF/SoundSketch"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 rounded-full bg-white/6 px-3 py-2 text-sm hover:bg-white/8"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </header>

          <main>{children}</main>

          <footer className="mt-12 border-t border-white/5 bg-black/20">
            <div className="container mx-auto px-6 py-6 text-sm text-white/70">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  © {new Date().getFullYear()} SoundSketch — Convert audio to
                  sheet music and analyze music clips.
                </div>
                <div className="flex items-center gap-4">
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>
                  <Link href="/SheetSketcher" className="hover:underline">
                    SheetSketcher
                  </Link>
                  <Link href="/SoundAnalyzer" className="hover:underline">
                    SoundAnalyzer
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
