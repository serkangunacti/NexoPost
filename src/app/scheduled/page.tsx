import { Calendar as CalendarIcon, MoreVertical, Send, Eye } from "lucide-react";

export default function ScheduledPage() {
  const scheduledPosts = [
    { id: 1, content: "Excited to announce our new feature launching next week! Stay tuned for more updates. 🚀 #NexoPost #Update", date: "Mar 25, 2026", time: "18:00", platforms: ["𝕏", "in", "f"], status: "Scheduled" },
    { id: 2, content: "Behind the scenes look at how we build high performance teams.\nDrop your questions below! 👇", date: "Mar 28, 2026", time: "10:30", platforms: ["in"], status: "Draft" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Scheduled Pipeline</h1>
        <p className="text-neutral-400 text-lg font-medium">Review and manage your upcoming content schedule across all platforms.</p>
      </header>

      <div className="glass flex items-center justify-between p-2 rounded-2xl border border-white/5 mb-8 w-fit shadow-lg shadow-black/20">
        <button className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-violet-500/50">Upcoming</button>
        <button className="px-6 py-2.5 rounded-xl text-neutral-400 hover:text-white font-semibold text-sm transition-colors">Past Published</button>
        <button className="px-6 py-2.5 rounded-xl text-neutral-400 hover:text-white font-semibold text-sm transition-colors">Drafts</button>
      </div>

      <div className="space-y-6 relative">
        <div className="absolute left-6 top-10 bottom-10 w-px bg-white/5 hidden md:block" />
        {scheduledPosts.map(post => (
          <div key={post.id} className="glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-8 group hover:border-violet-500/30 transition-all hover:bg-white/[0.04] shadow-xl relative z-10">
            {/* Date time info */}
            <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-1 md:w-32 shrink-0 border-b md:border-b-0 border-white/5 pb-4 md:pb-0 relative z-20">
              <div className="w-12 h-12 bg-[#0a0a0f] rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-white/10 group-hover:scale-110 group-hover:border-violet-500/50 transition-all duration-300">
                <CalendarIcon className="w-5 h-5 text-violet-400" />
              </div>
              <div className="text-xl font-bold text-white">{post.time}</div>
              <div className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mt-1">{post.date}</div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                {post.platforms.map((p, i) => (
                  <span key={i} className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-md">
                    {p}
                  </span>
                ))}
                <span className={`ml-3 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${post.status === 'Scheduled' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-neutral-800 text-neutral-400 border border-white/10'}`}>
                  {post.status}
                </span>
              </div>
              
              <p className="text-white text-lg font-medium leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
                {post.content}
              </p>
            </div>

            {/* Actions */}
            <div className="flex md:flex-col justify-end gap-3 shrink-0">
              <button className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                <MoreVertical className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                <Eye className="w-5 h-5" />
              </button>
              {post.status === 'Draft' ? (
                 <button className="w-12 h-12 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/50 flex items-center justify-center text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                 <Send className="w-5 h-5 ml-0.5" />
               </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
