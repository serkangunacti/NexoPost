import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexoPost | Premium Social Media Management & Agency Panel",
  description: "Schedule, analyze, and manage all your social media accounts from a single ultimate platform. Empower your reach and automate your impact with NexoPost. A premium brand by Uptexx Information Technologies.",
  keywords: [
    "sosyal medya yönetimi", "social media management", "sosyal medya otomasyonu", 
    "social media automation", "içerik planlama", "content scheduling", 
    "ajans paneli", "agency dashboard", "twitter", "instagram", "tiktok", "linkedin", 
    "facebook", "toplu paylaşım", "cross-platform posting", "NexoPost", "Uptexx"
  ],
  authors: [{ name: "Uptexx Bilgi Teknolojileri", url: "https://www.uptexx.com" }],
  creator: "NexoPost",
  robots: "index, follow",
  openGraph: {
    title: "NexoPost - Social Media Management",
    description: "Manage, schedule, and analyze your social media effortlessly.",
    url: "https://nexopost.com",
    siteName: "NexoPost",
    images: [{ url: "/logo.png", width: 800, height: 600, alt: "NexoPost Logo" }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-[#0a0a0f] text-white min-h-screen antialiased selection:bg-violet-500/30">
        <SessionProvider>
          <AppProvider>{children}</AppProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
