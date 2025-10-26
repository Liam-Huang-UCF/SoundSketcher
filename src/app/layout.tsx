import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import MusicBackground from "./_components/MusicBackground";
import Navbar from "./_components/Navbar";

export const metadata: Metadata = {
  title: "SoundSketcher",
  description: "Generate Music Sheets and Analyze Sounds with AI",
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
      <body>
        <MusicBackground />
        <TRPCReactProvider>
          <div className="app-content">
            <Navbar />
            {children}
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
