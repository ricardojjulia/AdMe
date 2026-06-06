import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { UserProvider } from "@/lib/UserContext";
import { ToastProvider } from "@/lib/ToastContext";
import { DemoPanel } from "@/components/DemoPanel";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AdMe",
  description: "Experience the feed.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={display.variable}>
      <body suppressHydrationWarning>
        <ToastProvider>
          <UserProvider>
            <main className="container h-full">
              {children}
            </main>
            <DemoPanel />
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

