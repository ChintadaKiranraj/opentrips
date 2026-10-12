import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { UserMenu } from "@/components/auth/UserMenu";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { themeInitScript } from "@/lib/utils/theme";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trip Planner: Outdoor Trip and Landslide Risk Planner",
  description:
    "Hacktoberfest 2026 hackathon project: simulated landslide-risk assessment and personalized outdoor itinerary planning.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="relative flex min-h-full flex-col">
        <div className="mesh-bg" aria-hidden="true">
          <span className="mesh-blob" />
        </div>
        <MotionProvider>
          <SiteHeader
            userMenu={
              <Suspense fallback={null}>
                <UserMenu />
              </Suspense>
            }
          />
          {children}
          <SiteFooter />
        </MotionProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
