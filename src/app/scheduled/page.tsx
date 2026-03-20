"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, MoreVertical, Send, Eye, Loader2, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  platforms: string[];
  status: string;
  createdAt: any;
}

export default function ScheduledPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if(confirm("Are you sure you want to delete this post?")) {
      await deleteDoc(doc(db, "posts", id));
    }
  };

  const handlePublishDraft = async (id: string) => {
    if(confirm("Publish this draft now?")) {
      await updateDoc(doc(db, "posts", id), { status: "Published" });
    }
  };

  const platformIcons: Record<string, string> = {
    "twitter": "𝕏",
    "linkedin": "in",
    "facebook": "f",
    "instagram": "IG"
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'Upcoming') return post.status === 'Scheduled';
    if (activeTab === 'Drafts') return post.status === 'Draft';
    if (activeTab === 'Past Published') return post.status === 'Published';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="mb-8 pl-4">
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Scheduled Pipeline</h1>
        <p className="text-neutral-400 text-lg font-medium">Review and manage your upcoming content schedule directly from Firestore.</p>
      </header>

      <div className="glass flex items-center justify-between p-2 rounded-2xl border border-white/5 mb-8 w-fit shadow-lg shadow-black/20 gap-2">
        {['Upcoming', 'Past Published', 'Drafts'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === tab 
              ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-violet-500/50" 
              : "text-neutral-400 hover:text-white"
            }`}
          >
            {tab}
            <span className="bg-black/30 px-2 py-0.5 rounded-full text-xs">
              {posts.filter(p => tab === 'Upcoming' ? p.status === 'Scheduled' : tab === 'Drafts' ? p.status === 'Draft' : p.status === 'Published').length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-6 relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass p-12 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-10">
            <CalendarIcon className="w-12 h-12 text-neutral-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No posts found</h3>
            <p className="text-neutral-500 font-medium">There are no internal documents serving the {activeTab} section at this moment.</p>
          </div>
        ) : (
          <>
            <div className="absolute left-6 top-10 bottom-10 w-px bg-white/5 hidden md:block" />
            {filteredPosts.map(post => (
              <div key={post.id} className="glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-8 group hover:border-violet-500/30 transition-all hover:bg-white/[0.04] shadow-xl relative z-10">
                <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-1 md:w-32 shrink-0 border-b md:border-b-0 border-white/5 pb-4 md:pb-0 relative z-20">
                  <div className="w-12 h-12 bg-[#0a0a0f] rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-white/10 group-hover:scale-110 group-hover:border-violet-500/50 transition-all duration-300">
                    <CalendarIcon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="text-xl font-bold text-white leading-none">{post.time || "--:--"}</div>
                  <div className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mt-2">{post.date || "Unknown"}</div>
                </div>

                <div className="flex-1 space-y-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.platforms?.map((p, i) => (
                      <span key={i} className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-md">
                        {platformIcons[p] || p}
                      </span>
                    ))}
                    <span className={`ml-3 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${post.status === 'Scheduled' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : post.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {post.status}
                    </span>
                  </div>
                  
                  <p className="text-white text-lg font-medium leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner break-words relative">
                    {post.content}
                  </p>
                </div>

                <div className="flex justify-end gap-3 shrink-0 mt-4 md:mt-0 flex-row md:flex-col items-center">
                  <button onClick={() => handleDelete(post.id)} className="w-12 h-12 rounded-xl bg-red-500/5 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors border border-transparent hover:border-red-500/20">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  {post.status === 'Draft' || post.status === 'Scheduled' ? (
                     <button onClick={() => handlePublishDraft(post.id)} title="Publish Now" className="w-12 h-12 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/50 flex items-center justify-center text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                     <Send className="w-4 h-4 ml-0.5" />
                   </button>
                  ) : null}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
