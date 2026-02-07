import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: '--font-montserrat' });
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "Finanza Fácil | Libertad",
  description: "Simplifica tus finanzas y gana libertad.",
  /* 
  DISABLED PWA FEATURES BY USER REQUEST
  manifest: "/manifest.json",
  icons: {
    apple: "/pwa-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Finanza Fácil",
  },
  */
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0056B3",
  viewportFit: "cover",
}

import { Providers } from "@/components/Providers";
import { PWARegistration } from "@/components/PWARegistration";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${inter.variable} font-sans antialiased bg-[#F4F7F9]`}
        suppressHydrationWarning
      >
        <PWARegistration />
        <InstallPrompt />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
