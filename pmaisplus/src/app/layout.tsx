import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pmais+ · Controle financeiro de eventos",
  description:
    "Plataforma da Pmais Eventos para planejar, executar e analisar financeiramente seus eventos.",
  icons: { icon: "/brand/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
