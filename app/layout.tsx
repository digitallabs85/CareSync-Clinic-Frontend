import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import app from '@/app.json'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Outfit({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: app.name,
  description: "A complete digitized clinic structure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body
        style={{ height: "100%", margin: 0, overflow: "auto" }}
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} antialiased`}
      >
          <div>
              {children}
            {/* ← Always mounted on every route */}
            <div className="fixed bottom-0 left-0 right-0 z-999 pointer-events-none">
              <div className="pointer-events-auto">
              </div>
            </div>

          </div>
      </body>
    </html>
  );
}