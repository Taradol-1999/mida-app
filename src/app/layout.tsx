import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { UsageTracker } from "@/components/usage-tracker";
import midaLogo from "@/assets/logos/svg/01-mida-property.svg";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["latin", "thai"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MIDA Property",
  description: "เว็บไซต์อสังหาริมทรัพย์และระบบจัดการโครงการ MIDA",
  icons: { icon: { url: midaLogo.src, type: "image/svg+xml" } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={notoSansThai.variable} suppressHydrationWarning>
        <LanguageProvider>
          <UsageTracker />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
