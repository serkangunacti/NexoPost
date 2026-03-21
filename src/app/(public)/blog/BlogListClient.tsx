"use client";

import { useLanguage } from "@/context/LanguageContext";
import { allBlogs } from "@/data/blog";
import Link from "next/link";
import { Calendar, Clock, ChevronRight } from "lucide-react";

export default function BlogListClient() {
  const { t, lang } = useLanguage();

  return (
    <main className="w-full flex-1 flex flex-col relative pt-32 pb-24 px-6 min-h-screen">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            {t.blog_index.title}
          </h1>
          <div className="w-24 h-1.5 bg-gradient-to-r from-violet-500 to-sky-500 mx-auto rounded-full mb-6" />
          <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto">
            {t.blog_index.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allBlogs.map((post) => {
            const content = lang === "tr" ? post.tr : post.en;
            return (
              <Link
                key={post.id}
                href={"/blog/" + post.slug}
                className="group flex flex-col glass rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-500 border border-white/5 shadow-lg"
              >
                {/* Real Image Cover */}
                <div className="h-56 w-full relative bg-neutral-900 border-b border-white/5 overflow-hidden">
                  <img 
                    src={post.coverImage} 
                    alt={content.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-80" />
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500 mb-4 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.date}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-neutral-600" />
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime} {t.blog_index.read_time}
                    </span>
                  </div>
                  
                  {/* Title & Excerpt */}
                  <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-sky-400 transition-all">
                    {content.title}
                  </h2>
                  <p className="text-neutral-400 font-medium leading-relaxed mb-8 flex-1">
                    {content.excerpt}
                  </p>
                  
                  {/* Tags & Action */}
                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded bg-white/5 text-neutral-300">
                        {content.keywords[0]}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-violet-400 flex items-center gap-1 group-hover:text-sky-400 transition-colors">
                      {t.blog_index.read_more}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
