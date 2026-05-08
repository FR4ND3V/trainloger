import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono, Doto } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

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

import { ThemeProvider } from "./components/ThemeProvider";
import { SidebarProvider } from "./components/SidebarContext";
import SidebarLayoutInner from "./components/SidebarLayoutInner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${doto.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (!theme && supportDarkMode) theme = 'dark';
                  if (!theme) theme = 'light';
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[var(--black)] text-[var(--text-primary)] transition-colors duration-300">
        <ThemeProvider>
          <SidebarProvider>
            <SidebarLayoutInner>
              {children}
            </SidebarLayoutInner>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

