import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ViewTransition } from "react";
import "./globals.css";

const dmSans = localFont({
  src: [
    { path: "./fonts/DMSans.woff2", style: "normal", weight: "100 1000" },
    { path: "./fonts/DMSans-Italic.woff2", style: "italic", weight: "100 1000" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

// Provisoire, en attendant la typo de Stéphanie.
const anton = localFont({
  src: "./fonts/Anton.woff2",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Présente !",
  description: "Le parcours de Liberté, Chérie !",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#e6361d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${anton.variable}`}>
      <body>
        {/* Changement de page : un fondu très court (150 ms) quand le navigateur sait le faire (brief V0.8). */}
        <ViewTransition>{children}</ViewTransition>
      </body>
    </html>
  );
}
