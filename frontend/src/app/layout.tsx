import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Gulfstream Intelligence",
    template: "%s | Gulfstream Intelligence",
  },
  description:
    "The AI platform that helps life sciences teams anticipate regulatory expectations, close gaps, and accelerate global approvals with confidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sync dark class before React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem('gs-theme')||'{}');if(t&&t.state&&t.state.theme==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
