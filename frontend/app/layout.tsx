import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pmais Eventos",
  description: "Controle de eventos Pmais",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
