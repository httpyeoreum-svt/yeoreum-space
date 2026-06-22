import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Noto_Serif_JP, Petit_Formal_Script } from "next/font/google";
import "./globals.css";
import { IntroOverlay } from "@/components/intro-overlay";

const serif = Cormorant_Garamond({
  variable: "--font-serif-var",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

// Handwritten cursive used for the "yeoreum space" wordmark in the home hero.
const script = Petit_Formal_Script({
  variable: "--font-script-var",
  subsets: ["latin"],
  weight: "400",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-var",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const jpSerif = Noto_Serif_JP({
  variable: "--font-jp-serif-var",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "yeoreum space",
  description: "music · books · films · perfume · games — a personal collection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${serif.variable} ${mono.variable} ${jpSerif.variable} ${script.variable} h-full antialiased`}
    >
      <body className="min-h-full font-mono" suppressHydrationWarning>
        <div className="site-bg" aria-hidden />
        {children}
        <IntroOverlay />
      </body>
    </html>
  );
}
