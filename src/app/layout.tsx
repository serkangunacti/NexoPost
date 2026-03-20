import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NexoPost - Automate Your Impact",
  description: "Next Generation Social Media Management Tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#050508] text-white min-h-screen selection:bg-violet-500/30 overflow-x-hidden`}>
        {/* Ambient background glow effects globally */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none z-0" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-600/10 blur-[150px] pointer-events-none z-0" />
        
        {/* children could be (admin) or (public) content */}
        {children}
      </body>
    </html>
  );
}
