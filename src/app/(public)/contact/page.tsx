"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Mail, MapPin, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SiWhatsapp } from "react-icons/si";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="w-full flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[90vh] py-32 px-6">
      <div className="max-w-5xl mx-auto">
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-semibold mb-12 transition-colors hover:-translate-x-1 duration-300"
        >
          <ArrowLeft className="w-4 h-4" /> {t.common.go_back}
        </Link>
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">{t.contact.title}</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">{t.contact.desc}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 bg-white/[0.02] border border-white/10 p-8 md:p-12 lg:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden mb-16">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 lg:col-span-3 flex flex-col gap-8">
            <h2 className="text-2xl font-bold text-white mb-2">{t.contact.title}</h2>
            <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-semibold text-neutral-400 mb-2">{t.contact.form_name}</label>
                <input 
                  type="text" 
                  placeholder={t.contact.form_name === "Ad Soyad" ? "Serkan Günacti" : "John Doe"}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-400 mb-2">{t.contact.form_email}</label>
                <input 
                  type="email" 
                  placeholder="hello@nexopost.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-400 mb-2">{t.contact.form_message}</label>
                <textarea 
                  rows={4} 
                  placeholder="..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all resize-none"
                ></textarea>
              </div>
              <a 
                href="mailto:info@nexopost.com"
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] mt-2 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send className="w-5 h-5" />
                {t.contact.form_submit}
              </a>
            </form>
          </div>

          <div className="relative z-10 lg:col-span-2 flex flex-col gap-8 lg:pl-12 lg:border-l border-white/5 pt-10 lg:pt-0 border-t lg:border-t-0 justify-center">
            
            <a href="mailto:info@nexopost.com" className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-500 mb-1">{t.common.email}</p>
                <div className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">info@nexopost.com</div>
              </div>
            </a>

            <a href="https://wa.me/905438716131" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
              <div className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-xl flex items-center justify-center shrink-0 border border-[#25D366]/20 group-hover:scale-110 transition-transform shadow-lg shadow-[#25D366]/5">
                <SiWhatsapp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-500 mb-1">{t.common.whatsapp}</p>
                <div className="text-white font-bold text-lg group-hover:text-[#25D366] transition-colors">0543 871 61 31</div>
              </div>
            </a>

            <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
              <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-xl flex items-center justify-center shrink-0 border border-sky-500/20 group-hover:scale-110 transition-transform shadow-lg shadow-sky-500/5">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-500 mb-2">{t.contact.address_title}</p>
                <p className="text-white leading-relaxed text-sm font-medium">{t.contact.address}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Google Maps Embed */}
        <div className="w-full h-[220px] sm:h-[320px] md:h-[450px] rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative group">
          <div className="absolute inset-0 border-[3px] border-white/5 pointer-events-none z-10 rounded-[3rem]" />
          <iframe 
            src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=One%20Block%20Plaza,%20Fatih%20Sultan%20Mehmet%20Mah.%20Depoyolu%20Sk.%20No:16%20%C3%9Cmraniye/%C4%B0stanbul+(NexoPost)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 grayscale-[0.85] invert-[0.95] hue-rotate-[180deg] contrast-125 opacity-70 group-hover:opacity-100 group-hover:grayscale-0 group-hover:invert-0 group-hover:hue-rotate-0 group-hover:contrast-100 transition-all duration-[800ms] cursor-crosshair"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
