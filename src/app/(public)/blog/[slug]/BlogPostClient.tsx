"use client";
import React, { useEffect, useState } from "react";

import { BlogPost, allBlogs } from "@/data/blog";
import { useLanguage } from "@/context/LanguageContext";
import { Calendar, Clock, ArrowLeft, ChevronRight, Search, ArrowUp } from "lucide-react";
import Link from "next/link";

export default function BlogPostClient({ post }: { post: BlogPost }) {
  const { lang, t } = useLanguage();
  
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const articles = document.querySelectorAll("article[data-post-id]");
      let activeProgress = 0;
      const readOffset = 250; // Distance from the top of viewport to consider as reading boundary

      for (let i = 0; i < articles.length; i++) {
        const article = articles[i] as HTMLElement;
        const rect = article.getBoundingClientRect();

        if (rect.top <= readOffset && rect.bottom > readOffset) {
          const totalScrollable = article.offsetHeight - window.innerHeight + readOffset;
          const currentReadingProgress = readOffset - rect.top;
          
          if (totalScrollable <= 0) {
            activeProgress = 100;
          } else {
            activeProgress = Math.min(100, Math.max(0, (currentReadingProgress / totalScrollable) * 100));
          }
          break; // Stop at the currently read article
        }
      }
      setProgress(activeProgress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Trigger once on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentIndex = allBlogs.findIndex(p => p.id === post.id);
  const postsToRender = [
    allBlogs[currentIndex],
    ...allBlogs.slice(currentIndex + 1),
    ...allBlogs.slice(0, currentIndex)
  ];

  // Exclude current post from sidebar by default, but allow searching from all
  const filteredSidebar = allBlogs.filter(p => {
    if (!searchQuery && p.id === post.id) return false;
    const c = lang === "tr" ? p.tr : p.en;
    return c.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-neutral-900 z-50">
        <div 
          className="h-full bg-gradient-to-r from-violet-600 to-sky-400 ease-out transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="w-full flex-1 flex flex-col relative pt-32 pb-24 px-6 min-h-screen">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      
        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col lg:flex-row gap-12">
          
          {/* Main Content Area: Infinite Read */}
          <div className="w-full lg:w-2/3">
            <Link href="/blog" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-medium mb-12 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {lang === "tr" ? "Blog'a Dön" : "Back to Blog"}
            </Link>
            
            {postsToRender.map((p, index) => {
              const c = lang === "tr" ? p.tr : p.en;
              const isFirst = index === 0;
              
              return (
                <article key={p.id} data-post-id={p.id} className={!isFirst ? "mt-32 pt-24 border-t-2 border-dashed border-white/10" : ""}>
                  {/* Header */}
                  <header className="mb-12">
                    <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-neutral-400 mb-6 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
                        <Calendar className="w-4 h-4 text-violet-400" />
                        {p.date}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
                        <Clock className="w-4 h-4 text-sky-400" />
                        {p.readTime} {t.blog_index.read_time}
                      </span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-8">
                      {c.title}
                    </h1>
                    
                    <p className="text-xl text-neutral-300 font-medium leading-relaxed border-l-4 border-violet-500 pl-6 bg-white/[0.02] py-4 rounded-r-lg">
                      {c.excerpt}
                    </p>
                  </header>
                  
                  {/* Real Featured Image */}
                  <div className="w-full h-64 md:h-80 rounded-3xl mb-12 relative overflow-hidden glass border border-white/10 shadow-2xl">
                    <img 
                      key={p.coverImage}
                      src={p.coverImage} 
                      alt={c.title} 
                      className="w-full h-full object-cover"
                      loading={isFirst ? "eager" : "lazy"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-60" />
                  </div>
                  
                  {/* Content Wrapper for safety */}
                  <div className="relative z-20 bg-[#0a0a0f]/50 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-white/5 shadow-2xl">
                    <div 
                      className="article-content"
                      dangerouslySetInnerHTML={{ __html: c.content }}
                    />
                  </div>
                  
                  {/* Keywords */}
                  <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-2">
                    {c.keywords.map((kw, i) => (
                      <span key={i} className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm font-medium text-neutral-300 shadow-sm">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}

            {/* Başa Dön Button */}
            <div className="mt-24 pt-16 border-t border-white/10 flex justify-center">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full font-bold shadow-2xl transition-all hover:scale-105 flex items-center gap-2 border border-white/10 group"
              >
                <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                {lang === "tr" ? "Başa Dön" : "Back to Top"}
              </button>
            </div>
          </div>

          {/* Sidebar: Related Posts & Search */}
          <aside className="w-full lg:w-1/3 mt-16 lg:mt-0">
            <div className="sticky top-28 bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-2xl">
              
              <div className="mb-6 relative">
                <input 
                  type="text"
                  placeholder={lang === "tr" ? "Makale ara..." : "Search articles..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-neutral-500"
                />
                <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>

              <h3 className="text-xl font-bold text-white mb-6 pb-4 border-b border-white/10">
                {searchQuery ? (lang === "tr" ? "Sonuçlar" : "Results") : (lang === "tr" ? "Tüm Makaleler" : "All Articles")}
              </h3>
              
              <div className="flex flex-col gap-6">
                {filteredSidebar.length > 0 ? (
                  filteredSidebar.map((related) => {
                    const relContent = lang === "tr" ? related.tr : related.en;
                    return (
                      <Link 
                        key={related.id} 
                        href={"/blog/" + related.slug}
                        className="group flex gap-4 items-center hover:bg-white/5 rounded-xl p-2 -mx-2 transition-colors"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden relative shrink-0">
                          <img 
                            src={related.coverImage} 
                            alt={relContent.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-neutral-200 group-hover:text-violet-400 transition-colors line-clamp-2 leading-snug mb-2">
                            {relContent.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs font-semibold text-neutral-500 uppercase">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {related.readTime} {t.blog_index.read_time}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    {lang === "tr" ? "Sonuç bulunamadı." : "No results found."}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
