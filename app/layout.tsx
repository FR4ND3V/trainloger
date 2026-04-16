import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono, Doto } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrainLogger — AI Performance Dashboard",
  description:
    "Dashboard de rendimiento deportivo personal con estética Nothing. Monitoriza tu fitness, fatiga y forma.",
  keywords: ["training", "dashboard", "intervals.icu", "fitness", "performance", "nothing style"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${doto.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-[#E8E8E8] dot-grid-subtle">
        <Navbar />
        <main className="pt-20 pb-28 md:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}


