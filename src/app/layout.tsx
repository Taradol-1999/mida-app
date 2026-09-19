import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIDA Property | Find your home",
  description: "เว็บไซต์อสังหาริมทรัพย์และระบบจัดการโครงการ MIDA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
