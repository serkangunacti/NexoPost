"use client";

import { BlogPost } from "@/data/blog";
import { useLanguage } from "@/context/LanguageContext";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BlogPostClient({ post }: { post: BlogPost }) {
  const { lang } = useLanguage();
  const content = lang === "tr" ? post.tr : post.en;
  
  return (
    <main className="w-full flex-1 flex flex-col relative pt-32 pb-24 px-6 min-h-screen">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      
      <div className="max-w-4xl mx-auto w-full relative z-10">
        <Link href="/blog" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-medium mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {lang === "tr" ? "Blog'a Dön" : "Back to Blog"}
        </Link>
        
        {/* Header */}
        <header className="mb-16">
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-neutral-400 mb-6 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
              <Calendar className="w-4 h-4 text-violet-400" />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
              <Clock className="w-4 h-4 text-sky-400" />
              {post.readTime}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-8">
            {content.title}
          </h1>
          
          <p className="text-xl text-neutral-300 font-medium leading-relaxed border-l-4 border-violet-500 pl-6 bg-white/[0.02] py-4 rounded-r-lg">
            {content.excerpt}
          </p>
        </header>
        
        {/* Featured Image Replacement - Interactive Glass block */}
        <div className="w-full h-64 md:h-80 rounded-3xl mb-16 relative overflow-hidden glass border border-white/10 flex items-center justify-center">
           <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-sky-600/20 opacity-50" />
           <div className="w-64 h-64 rounded-full bg-white/5 blur-3xl absolute -top-20 -right-20" />
           <div className="w-64 h-64 rounded-full bg-white/5 blur-3xl absolute -bottom-20 -left-20" />
           <p className="text-white/10 font-black text-6xl md:text-8xl tracking-widest absolute uppercase rotate-6 scale-125 select-none pointer-events-none">NexoPost</p>
        </div>
        
        {/* Content */}
        <div 
          className="article-content"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
        
        {/* Keywords */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-2">
          {content.keywords.map((kw, i) => (
            <span key={i} className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm font-medium text-neutral-300 shadow-sm">
              #{kw}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
