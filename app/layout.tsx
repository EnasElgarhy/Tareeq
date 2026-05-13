import type { Metadata, Viewport } from "next";
import {
  DM_Serif_Display,
  Fraunces,
  IBM_Plex_Sans_Arabic,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const question = DM_Serif_Display({
  variable: "--font-question",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  display: "swap",
});

/**
 * Editorial serif — used as the pull-quote accent inside otherwise sans
 * headlines. Fraunces is a soft variable serif with personality, distinct
 * from DM Serif Display (assessment question voice) so the two serif
 * moments stay semantically separate.
 */
const displayItalic = Fraunces({
  variable: "--font-display-italic",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tareeq — Discover what you're built for",
  description:
    "12 minutes. 60 questions. One clear path. A career discovery compass for youth in MENA, built on the CORE model.",
};

export const viewport: Viewport = {
  themeColor: "#1B0E3F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${jakarta.variable} ${arabic.variable} ${question.variable} ${displayItalic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
