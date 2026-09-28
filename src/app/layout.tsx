import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { UserProvider } from "@/lib/UserContext";
import { ToastProvider } from "@/lib/ToastContext";
import { DemoPanel } from "@/components/DemoPanel";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
  // Demo Panel environment enforcement:
  // Automatically eliminated on Vercel deployments, enabled on self-hosted / local.
  // Can be explicitly overridden with NEXT_PUBLIC_ENABLE_DEMO_PANEL or ENABLE_DEMO_PANEL ('true' | 'false').
  const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL === '1';
  const explicitFlag = process.env.NEXT_PUBLIC_ENABLE_DEMO_PANEL ?? process.env.ENABLE_DEMO_PANEL;
  const showDemoPanel = explicitFlag !== undefined
    ? explicitFlag === 'true' || explicitFlag === '1'
    : !isVercel;

  return (
    <html lang="en" suppressHydrationWarning className={display.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='adme_sensory_shield_v1';var p=localStorage.getItem(k);var r=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(p==='true'||(p===null&&r)){document.documentElement.setAttribute('data-sensory-mode','comfort')}else{document.documentElement.setAttribute('data-sensory-mode','standard')}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>
          <UserProvider>
            <main className="container h-full">
              {children}
            </main>
            <MobileBottomNav />
            {showDemoPanel && <DemoPanel />}
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

