import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Caveat,
  DM_Serif_Display,
  Fraunces,
  Plus_Jakarta_Sans,
  Rubik,
} from "next/font/google";
import localFont from "next/font/local";
import { AnalyticsConsent } from "@/components/analytics/AnalyticsConsent";
import { BRAND } from "@/lib/brand";
import { HOME_TITLE, PAGES } from "@/lib/page-metadata";
import { VisitTracker } from "@/components/analytics/VisitTracker";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Khatt (marketing v3). One variable family carries display and UI in both
// scripts, so Arabic and Latin are co-equal rather than one being a fallback.
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "arabic"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// IBM Plex Sans Arabic — self-hosted so the Arabic UI renders reliably
// offline and in any build environment (no Google Fonts dependency).
const arabic = localFont({
  variable: "--font-arabic",
  display: "swap",
  src: [
    {
      path: "./fonts/ibm-plex-arabic-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-arabic-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-arabic-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-arabic-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
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
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["italic", "normal"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || BRAND.siteUrl;
const siteTitle = HOME_TITLE;
const siteDescription = PAGES.home.description;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `${BRAND.name}: %s`,
  },
  description: siteDescription,
  applicationName: BRAND.name,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: BRAND.name,
    title: siteTitle,
    description: siteDescription,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: `${BRAND.name}: explore your study and career paths`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/twitter-image.jpg"],
  },
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
      className={`${jakarta.variable} ${bricolage.variable} ${caveat.variable} ${arabic.variable} ${question.variable} ${displayItalic.variable} ${rubik.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <AnalyticsConsent />
        <VisitTracker />
      </body>
    </html>
  );
}
