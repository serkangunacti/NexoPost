"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, BarChart3, Plus, Layers, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiBluesky, SiThreads, SiPinterest } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";

export default function Home() {
  const [stats, setStats] = useState({ total: 0, published: 0, scheduled: 0 });
  const [upcomingPosts, setUpcomingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      let published = 0;
      let scheduled = 0;
      const upcoming: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        total++;
        if (data.status === 'Published') published++;
        if (data.status === 'Scheduled' || data.status === 'Draft') {
          scheduled++;
          if (upcoming.length < 3) upcoming.push({ id: doc.id, ...data });
        }
      });

      setStats({ total, published, scheduled });
      setUpcomingPosts(upcoming);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderPlatformIcon = (p: string) => {
    switch (p) {
      case 'twitter': return <SiX className="w-4 h-4" />;
      case 'linkedin': return <FaLinkedin className="w-4 h-4 text-[#0A66C2]" />;
      case 'facebook': return <SiFacebook className="w-4 h-4 text-[#1877F2]" />;
      case 'instagram': return <SiInstagram className="w-4 h-4 text-[#E1306C]" />;
      case 'tiktok': return <SiTiktok className="w-4 h-4 text-[#00f2fe] drop-shadow-[1px_1px_0_#fe0979]" />;
      case 'threads': return <SiThreads className="w-4 h-4" />;
      case 'bluesky': return <SiBluesky className="w-4 h-4 text-[#0560FF]" />;
      case 'pinterest': return <SiPinterest className="w-4 h-4 text-[#E60023]" />;
      default: return p;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent pb-1">
            Welcome back
          </h1>
          <p className="text-neutral-400 mt-2 text-lg font-medium">
            Here's what's happening with your accounts today.
          </p>
        </div>
        <Link 
          href="/compose" 
          className="glass py-3 px-6 rounded-full flex items-center gap-2 font-semibold hover:bg-white/10 transition-all text-white border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)] group hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5 text-violet-400 group-hover:rotate-90 transition-transform duration-300" />
          Create Post
        </Link>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Total Library", value: loading ? "-" : stats.total, trend: "All time", icon: Layers, color: "text-violet-400", gradient: "from-violet-500/20 to-transparent" },
          { title: "Published", value: loading ? "-" : stats.published, trend: "Live", icon: BarChart3, color: "text-sky-400", gradient: "from-sky-500/20 to-transparent" },
          { title: "In Pipeline", value: loading ? "-" : stats.scheduled, trend: "Queued", icon: ArrowUpRight, color: "text-emerald-400", gradient: "from-emerald-500/20 to-transparent" }
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-[2]" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 shadow-inner">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full ring-1 ring-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                {stat.trend}
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl font-bold text-white mb-1">
                {stat.value === "-" ? <Loader2 className="w-8 h-8 animate-spin text-neutral-500 mt-2 mb-1" /> : stat.value}
              </h3>
              <p className="text-neutral-400 font-medium text-sm tracking-wide uppercase">{stat.title}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Latest Activity</h2>
          <Link href="/scheduled" className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 group">
            View all pipeline
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
        
        {loading ? (
           <div className="glass rounded-[2.5rem] p-12 border border-white/5 flex flex-col items-center justify-center min-h-[300px]">
             <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
             <p className="text-neutral-400 font-medium">Syncing with Firestore...</p>
           </div>
        ) : upcomingPosts.length === 0 ? (
          <div className="glass rounded-[2.5rem] p-12 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 relative z-10 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <Calendar className="w-8 h-8 text-neutral-400 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Your pipeline is empty</h3>
            <p className="text-neutral-400 max-w-md mx-auto mb-8 font-medium relative z-10">
              You don't have any posts scheduled for the upcoming days. Design a new campaign to reach your audience across all channels.
            </p>
            <Link href="/compose" className="glass py-3 px-8 rounded-full font-semibold hover:bg-white/10 transition-all text-white text-sm relative z-10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20">
              Craft a New Post
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingPosts.map(post => (
              <Link href="/scheduled" key={post.id} className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-violet-500/30 transition-all shadow-lg hover:-translate-y-1 block">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex -space-x-2">
                    {post.platforms.map((p: string, i: number) => (
                      <div key={i} className="w-9 h-9 rounded-full bg-neutral-800 border-2 border-[#0a0a0f] flex items-center justify-center text-white shadow-sm z-10 relative">
                        {renderPlatformIcon(p)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-sky-400 bg-sky-400/10 px-3 py-1 rounded-md uppercase tracking-wider">{post.status}</span>
                </div>
                <p className="text-neutral-300 font-medium line-clamp-3 mb-6 leading-relaxed">{post.content}</p>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {post.date} · {post.time}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
