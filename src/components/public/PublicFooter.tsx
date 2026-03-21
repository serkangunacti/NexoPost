"use client";

import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiBluesky, SiThreads, SiPinterest, SiYoutube } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";

export default function PublicFooter() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-white/5 bg-[#050508] py-16 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link href="/" className="flex items-center gap-2 group mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30 group-hover:scale-105 transition-transform overflow-hidden relative shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Image src="/logo.png" alt="NexoPost Logo" fill className="object-cover" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Nexo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">Post</span>
            </span>
          </Link>
          <div className="text-neutral-500 text-sm font-medium text-center md:text-left">
            {t.footer.copyright.split(t.footer.uptexx)[0]}
            <a href="https://www.uptexx.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 font-bold transition-colors">
              {t.footer.uptexx}
            </a>
            {t.footer.copyright.split(t.footer.uptexx)[1]}
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-6">
          <div className="flex items-center gap-5 text-neutral-400">
            <a href="#" className="hover:text-white transition-colors hover:-translate-y-1"><SiX className="w-5 h-5" /></a>
            <a href="#" className="hover:text-[#0A66C2] transition-colors hover:-translate-y-1"><FaLinkedin className="w-5 h-5" /></a>
            <a href="#" className="hover:text-[#1877F2] transition-colors hover:-translate-y-1"><SiFacebook className="w-5 h-5" /></a>
            <a href="#" className="hover:text-[#E1306C] transition-colors hover:-translate-y-1"><SiInstagram className="w-5 h-5" /></a>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold text-neutral-500">
            <Link href="/privacy" className="hover:text-white transition-colors">{t.footer.privacy}</Link>
            <Link href="/terms" className="hover:text-white transition-colors">{t.footer.terms}</Link>
            <Link href="/contact" className="hover:text-white transition-colors">{t.footer.contact}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
