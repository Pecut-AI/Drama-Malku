import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Suspense } from "react";

// Evolusi P3: font dimuat lewat next/font (self-hosted oleh Next, tanpa
// request render-blocking ke Google Fonts) dan diekspos sebagai CSS variable.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://drama-malku.vercel.app"),
  title: {
    default: "DramaMalku - Streaming Drama Pendek",
    template: "%s | DramaMalku",
  },
  description: "Nonton drama pendek gratis dan tanpa iklan di DramaMalku.",
  keywords: [
    "drama pendek",
    "drama china",
    "dracin",
    "streaming drama pendek",
    "dramabox",
    "melolo",
    "reelshort",
    "nonton drama gratis",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "DramaMalku",
    title: "DramaMalku - Streaming Drama Pendek",
    description: "Nonton drama pendek gratis dan tanpa iklan di DramaMalku.",
    images: [
      {
        url: "/preview.png",
        width: 1915,
        height: 829,
        alt: "DramaMalku - Streaming Drama Pendek",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DramaMalku - Streaming Drama Pendek",
    description: "Nonton drama pendek gratis dan tanpa iklan di DramaMalku.",
    images: ["/preview.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers>
          <Suspense fallback={<div className="h-16" />}>
            <Header />
          </Suspense>
          {children}
          <Footer />
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}
