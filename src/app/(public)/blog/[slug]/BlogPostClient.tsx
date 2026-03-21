"use client";

import { BlogPost, allBlogs } from "@/data/blog";
import { useLanguage } from "@/context/LanguageContext";
import { Calendar, Clock, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function BlogPostClient({ post }: { post: BlogPost }) {
  const { lang, t } = useLanguage();
  const content = lang === "tr" ? post.tr : post.en;
  
  // Exclude current post and get all other posts for the sidebar
  const relatedPosts = allBlogs.filter(p => p.id !== post.id);
  
  return (
    <main className="w-full flex-1 flex flex-col relative pt-32 pb-24 px-6 min-h-screen">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col lg:flex-row gap-12">
        
        {/* Main Content Area */}
        <div className="w-full lg:w-2/3">
          <Link href="/blog" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-medium mb-12 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {lang === "tr" ? "Blog'a Dön" : "Back to Blog"}
          </Link>
          
          {/* Header */}
          <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-neutral-400 mb-6 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
              <Calendar className="w-4 h-4 text-violet-400" />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
              <Clock className="w-4 h-4 text-sky-400" />
              {post.readTime} {t.blog_index.read_time}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-8">
            {content.title}
          </h1>
          
          <p className="text-xl text-neutral-300 font-medium leading-relaxed border-l-4 border-violet-500 pl-6 bg-white/[0.02] py-4 rounded-r-lg">
            {content.excerpt}
          </p>
        </header>
        
          {/* Real Featured Image */}
          <div className="w-full h-64 md:h-80 rounded-3xl mb-12 relative overflow-hidden glass border border-white/10 shadow-2xl">
            <img 
              key={post.coverImage}
              src={post.coverImage} 
              alt={content.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-60" />
          </div>
        
          {/* Content Wrapper for safety */}
          <div className="relative z-20 bg-[#0a0a0f]/50 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-white/5 shadow-2xl">
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          </div>
          
          {/* Keywords */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-2">
            {content.keywords.map((kw, i) => (
              <span key={i} className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-sm font-medium text-neutral-300 shadow-sm">
                #{kw}
              </span>
            ))}
          </div>
        </div>

        {/* Sidebar: Related Posts */}
        <aside className="w-full lg:w-1/3 mt-16 lg:mt-0">
          <div className="sticky top-28 bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 pb-4 border-b border-white/10">
              {lang === "tr" ? "İlginizi Çekebilir" : "Related Articles"}
            </h3>
            
            <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {relatedPosts.map((related) => {
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
              })}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10">
              <Link 
                href="/blog" 
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {lang === "tr" ? "Tüm Makaleler" : "View All Articles"}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
