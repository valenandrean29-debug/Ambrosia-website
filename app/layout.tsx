import type { Metadata } from "next";
import { Geist } from "next/font/google";
import ChatBubble from "@/components/ChatBubble";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ambrosia | Suplemen Gym Lokal Indonesia",
  description:
    "Ambrosia — Toko online suplemen gym lokal Indonesia terpercaya. Jual whey protein, gainer, creatine, pre-workout dari brand seperti Evolene, Rimbalife, dan lainnya. 100% original, harga terjangkau.",
  keywords: [
    "suplemen gym",
    "whey protein indonesia",
    "evolene",
    "rimbalife",
    "suplemen lokal",
    "gainer",
    "creatine",
    "pre-workout",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <ChatBubble />
      </body>
    </html>
  );
}

