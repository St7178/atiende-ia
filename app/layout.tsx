import type { Metadata } from "next";
import { Inter, Manrope, Public_Sans } from "next/font/google";
import "./globals.css";
import { brand, brandCssVars } from "@/lib/brand";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ios",
});

export const metadata: Metadata = {
  title: brand.metaTitle,
  description: brand.metaDescription,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" style={brandCssVars()}>
      <body className={`${manrope.variable} ${publicSans.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
