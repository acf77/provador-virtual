import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Provador Virtual — Veja como a roupa fica em você",
  description:
    "Faça upload da sua foto e de uma peça de roupa e veja com IA como o look ficaria em você. Rápido, grátis e sem precisar ir à loja.",
  openGraph: {
    title: "Provador Virtual",
    description: "Veja como qualquer roupa fica em você com IA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
