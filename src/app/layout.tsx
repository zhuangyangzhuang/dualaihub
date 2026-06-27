import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { IntlProvider } from "@/components/i18n/IntlProvider";
import { SessionProvider } from "next-auth/react";
import { cookies } from "next/headers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DUALAIHUB - Global AI Platform",
  description:
    "DUALAIHUB is a cutting-edge AI platform featuring dual AI scheduling, supporting Text AI, Code AI, Image AI, and Video AI. Experience the next generation of intelligent automation.",
  keywords: [
    "AI platform",
    "artificial intelligence",
    "dual AI scheduling",
    "text AI",
    "code AI",
    "image AI",
    "video AI",
    "machine learning",
    "automation",
  ],
  authors: [{ name: "DUALAIHUB Team" }],
  openGraph: {
    title: "DUALAIHUB - Global AI Platform",
    description:
      "Cutting-edge AI platform with dual AI scheduling for Text, Code, Image, and Video generation.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DUALAIHUB - Global AI Platform",
    description:
      "Cutting-edge AI platform with dual AI scheduling for Text, Code, Image, and Video generation.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  const messages = (await import(`../i18n/messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen bg-[#0a0a0f] antialiased">
        <IntlProvider messages={messages} locale={locale}>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#0f0f1a",
                color: "#ffffff",
                border: "1px solid #2a2a3e",
                borderRadius: "0.75rem",
              },
              success: {
                iconTheme: {
                  primary: "#00d4ff",
                  secondary: "#ffffff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ff4444",
                  secondary: "#ffffff",
                },
              },
            }}
          />
          <SessionProvider>
            {children}
          </SessionProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
