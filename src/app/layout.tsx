/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Metadata } from "next/types";
import { Dancing_Script, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";
import { ThemeProvider } from "@/components/landing-page/theme-provider"
import { dark, shadesOfPurple } from '@clerk/themes';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vectora",
  description: "An AI-powered research assistant with RAG, Image analysis, ai agent capabilities for comprehensive insights",
  authors: [{ name: "Vectora Team" }],
  openGraph: {
    title: "Vectora",
    description: "Automated Insight Extraction & Documentation",
    type: "website",
    locale: "en_US",
    siteName: "Vectora"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ClerkProvider
        appearance={{
          baseTheme: shadesOfPurple
        }}
      >
        <body
          className={`${inter.variable} ${dancingScript.variable} font-inter antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthenticatedLayout>{children}</AuthenticatedLayout>
          </ThemeProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}