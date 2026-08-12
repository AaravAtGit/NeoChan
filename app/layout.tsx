import "./globals.css";
import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NeoChan — anonymous imageboard",
  description: "NeoChan. Be anonymous. Be brutal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Header />
        <Ticker />
        {children}
        <Footer />
      </body>
    </html>
  );
}