import type { Metadata } from "next";
import { Geist } from "next/font/google";

import IntroGate from "@/components/intro/IntroGate";
import siteConfig from "@/config/site";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <IntroGate>{children}</IntroGate>
      </body>
    </html>
  );
}
