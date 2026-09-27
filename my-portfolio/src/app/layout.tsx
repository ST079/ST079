import type { Metadata } from "next";
import "./globals.css";
import IntroLoader from "../components/ui/IntroLoader";

export const metadata: Metadata = {
  title: "ST079",
  description: "ST079 Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <IntroLoader />
        {children}
      </body>
    </html>
  );
}
