import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import IntroLoader from "@/src/components/IntroLoader";
import siteConfig from "@/src/config/siteConfig";
import { SitePointer } from "@/src/components/SitePointer";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: siteConfig.siteTitle,
  description: siteConfig.siteDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        {/* <SitePointer/> */}

        <IntroLoader />
        {children}
      </body>
    </html>
  );
}
