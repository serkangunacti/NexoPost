"use client";

import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  const { t } = useLanguage();
  
  // Cast safety since we know it's an array from our JSON
  const content = t.legal.terms_content as Array<{tag: string, text: string}>;

  return (
    <div className="w-full flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen py-32 px-6">
      <div className="max-w-4xl mx-auto">
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-semibold mb-12 transition-colors hover:-translate-x-1 duration-300 relative z-20"
        >
          <ArrowLeft className="w-4 h-4" /> {t.common.go_back}
        </Link>
        
        <div className="relative glass p-6 md:p-10 lg:p-16 rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 text-center border-b border-white/10 pb-10 mb-10">
            <div className="w-20 h-20 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
                <BookOpen className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              {t.legal.terms_title}
            </h1>
            <p className="text-neutral-500 font-medium">
              {t.legal.terms_date}
            </p>
          </div>

          <article className="relative z-10 space-y-4 text-neutral-300 leading-relaxed font-medium">
             {content?.map((item, i) => {
               if (item.tag === "h2") {
                 return <h2 key={i} className="text-xl font-bold text-neutral-200 mt-10 mb-2 first:mt-0">{item.text}</h2>;
               }
               return <p key={i} className="text-neutral-400 text-sm leading-relaxed text-justify">{item.text}</p>;
             })}
          </article>
        </div>

      </div>
    </div>
  );
}
