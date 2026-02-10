import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { OnlineStatusIndicator } from "@/components/online-status-indicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: "Gestor Naval Pro",
  description: "Sistema de gestão naval completo para jangadas, navios, clientes e stock",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gestor Naval",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Gestor Naval",
    "msapplication-TileColor": "#2563eb",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen flex flex-col transition-colors duration-300 ease-in-out`}
      >
        <Providers>
          <OnlineStatusIndicator />
          <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 md:px-8 py-4 animate-fade-in">
            {children}
          </main>
          <MobileNavigation />
        </Providers>
      </body>
    </html>
  );
}
