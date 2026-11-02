import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./color-mode.css";
import "./optical-light-polish.css";
import "./mail-trigger-motion.css";

import AOSProvider from "@/components/AOSProvider";
import "aos/dist/aos.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keegan LaBrot | Software Developer & Creative Technologist",
  description:
    "Keegan LaBrot is a multidisciplinary software developer in Farmington, Missouri, building interactive web applications, developer tools, and systems experiments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      suppressHydrationWarning
      data-theme="dark"
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Restore the saved appearance before first paint; no component hydration flash. */}
        <script dangerouslySetInnerHTML={{ __html: `try { if (localStorage.getItem("portfolio-color-mode") === "light") { document.documentElement.dataset.theme = "light"; } } catch (e) {}` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AOSProvider />
        {children}
      </body>
    </html>
  );
}
