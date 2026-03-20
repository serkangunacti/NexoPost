import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexoPost | Social Media Management",
  description: "Cross-post and schedule to multiple platforms seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] text-white flex min-h-screen selection:bg-violet-500/30 font-sans relative`}
      >
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6 lg:p-10 relative z-10 w-full overflow-x-hidden min-h-screen">
          {/* Ambient Glow Effects */}
          <div className="fixed top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none -z-10" />
          <div className="fixed bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-600/10 blur-[150px] pointer-events-none -z-10" />
          
          {children}
        </main>
      </body>
    </html>
  );
}
