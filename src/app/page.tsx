import { ArrowUpRight, BarChart3, Plus, Layers, Calendar } from "lucide-react";
import Link from "next/link";

export default function Home() {
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
        {/* Stat Cards */}
        {[
          { title: "Total Posts", value: "142", trend: "+12%", icon: Layers, color: "text-violet-400", gradient: "from-violet-500/20 to-transparent" },
          { title: "Engagement", value: "8.4k", trend: "+24%", icon: BarChart3, color: "text-sky-400", gradient: "from-sky-500/20 to-transparent" },
          { title: "Connected", value: "4", trend: "Active", icon: ArrowUpRight, color: "text-emerald-400", gradient: "from-emerald-500/20 to-transparent" }
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
              <h3 className="text-4xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-neutral-400 font-medium text-sm tracking-wide uppercase">{stat.title}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Upcoming Posts</h2>
          <Link href="/scheduled" className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 group">
            View all pipeline
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
        <div className="glass rounded-[2rem] p-12 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
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
      </section>
    </div>
  );
}
