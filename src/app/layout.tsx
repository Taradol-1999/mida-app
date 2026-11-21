import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { UsageTracker } from "@/components/usage-tracker";
import midaLogo from "@/assets/logos/svg/01-mida-property.svg";

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
      <body suppressHydrationWarning>
        <LanguageProvider>
          <UsageTracker />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
