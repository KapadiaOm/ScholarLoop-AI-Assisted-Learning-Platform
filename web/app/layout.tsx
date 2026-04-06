import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { GlobalProvider } from "@/context/GlobalContext";
import ThemeScript from "@/components/ThemeScript";
import LayoutWrapper from "@/components/LayoutWrapper";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  fallback: ["Inter", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "ScholarLoop AI Platform",
  description: "Multi-Agent Teaching & Research Copilot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={font.className}>
        <GlobalProvider>
          <LayoutWrapper>
            <div className="flex h-screen bg-[#f7f8fc] dark:bg-[#0c1222] overflow-hidden transition-colors duration-300">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-[#f7f8fc] dark:bg-[#0c1222] transition-colors duration-300">
                {children}
              </main>
            </div>
          </LayoutWrapper>
        </GlobalProvider>
      </body>
    </html>
  );
}

