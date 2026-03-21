import { LanguageProvider } from "@/context/LanguageContext";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import CookieBanner from "@/components/public/CookieBanner";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <div className="relative z-10 min-h-screen flex flex-col pt-20">
        <PublicNavbar />
        <main className="flex-1 w-full flex flex-col items-center">
          {children}
        </main>
        <PublicFooter />
        <CookieBanner />
      </div>
    </LanguageProvider>
  );
}
