import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BeforeWeMeet | Consent-First AI Compatibility Agent",
  description: "A private, agent-mediated introduction platform built on CROO CAP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-white antialiased selection:bg-indigo-500/30`}>
        {children}
      </body>
    </html>
  );
}
