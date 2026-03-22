"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Timestamp, collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Calendar as CalendarIcon, Send, Loader2, Trash2, Pencil, Check, X, Clock, ExternalLink, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { db } from "@/lib/firebase";
import { getSubscriptionSnapshot } from "@/lib/subscription";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiBluesky, SiThreads, SiPinterest } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  platforms: string[];
  status: string;
  mediaUrls?: string[];
  createdAt?: Timestamp | null;
}

interface ConfirmModal {
  message: string;
  onConfirm: () => void;
}

export default function ScheduledPage() {
  const router = useRouter();
  const { subscription } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(() => Boolean(db));
  const [activeTab, setActiveTab] = useState('Upcoming');
  const subscriptionSnapshot = getSubscriptionSnapshot(subscription);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, type: 'error' | 'info' = 'error') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);
  const openConfirm = (message: string, onConfirm: () => void) => setConfirmModal({ message, onConfirm });
  const closeConfirm = () => setConfirmModal(null);

  // Draft content editing
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  // Scheduled post time editing
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTimeDate, setEditingTimeDate] = useState("");
  const [editingTimeTime, setEditingTimeTime] = useState("");
  const [savingTime, setSavingTime] = useState(false);

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...(doc.data() as Omit<Post, "id">) });
      });
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = (id: string) => {
    if (!db) return;
    const database = db;
    openConfirm("Are you sure you want to delete this post?", async () => {
      await deleteDoc(doc(database, "posts", id));
    });
  };

  const handlePublishDraft = (id: string) => {
    if (!db) return;
    if (!subscriptionSnapshot.canPublish) {
      showToast("Your package has expired. Renew your subscription to publish queued content.", "error");
      return;
    }
    const database = db;
    openConfirm("Publish this post now?", async () => {
      await updateDoc(doc(database, "posts", id), { status: "Published" });
    });
  };

  const handleStartTimeEdit = (post: Post) => {
    // Convert stored display date back to input format (approximate via new Date)
    setEditingTimeId(post.id);
    // Store raw time string directly; date needs a yyyy-mm-dd for the input
    const raw = post.date ? new Date(post.date + " " + (post.time || "00:00")) : new Date();
    const yyyy = raw.getFullYear();
    const mm = String(raw.getMonth() + 1).padStart(2, "0");
    const dd = String(raw.getDate()).padStart(2, "0");
    setEditingTimeDate(`${yyyy}-${mm}-${dd}`);
    setEditingTimeTime(post.time || "09:00");
  };

  const handleSaveTime = async (id: string) => {
    if (!db || !editingTimeDate || !editingTimeTime) return;
    setSavingTime(true);
    try {
      const displayDate = new Date(editingTimeDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      await updateDoc(doc(db, "posts", id), { date: displayDate, time: editingTimeTime });
      setEditingTimeId(null);
    } catch (e) {
      console.error(e);
      showToast("Error saving schedule. Please try again.", "error");
    } finally {
      setSavingTime(false);
    }
  };

  const handleStartEdit = (post: Post) => {
    setEditingDraftId(post.id);
    setEditingContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingDraftId(null);
    setEditingContent("");
  };

  const handleSaveDraft = async (id: string) => {
    if (!db || !editingContent.trim()) return;
    setSavingDraft(true);
    try {
      await updateDoc(doc(db, "posts", id), { content: editingContent });
      setEditingDraftId(null);
      setEditingContent("");
    } catch (e) {
      console.error(e);
      showToast("Error saving changes. Please try again.", "error");
    } finally {
      setSavingDraft(false);
    }
  };

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

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'Upcoming') return post.status === 'Scheduled';
    if (activeTab === 'Drafts') return post.status === 'Draft';
    if (activeTab === 'Past Published') return post.status === 'Published';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/60 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 max-w-sm text-center ${toast.type === 'error' ? 'bg-[#1a0909] border border-red-500/50 text-red-200' : 'bg-[#0d0d1a] border border-violet-500/50 text-violet-200'}`}>
          <AlertTriangle className={`w-4 h-4 shrink-0 ${toast.type === 'error' ? 'text-red-400' : 'text-violet-400'}`} />
          {toast.message}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeConfirm}>
          <div className="glass border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="text-white font-bold text-lg mb-6 text-center leading-snug">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={closeConfirm}
                className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { confirmModal.onConfirm(); closeConfirm(); }}
                className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
            {filteredPosts.map(post => {
              const isEditingThis = editingDraftId === post.id;
              return (
                <div key={post.id} className="glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-8 group hover:border-violet-500/30 transition-all hover:bg-white/[0.04] shadow-xl relative z-10">
                  <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-1 md:w-32 shrink-0 border-b md:border-b-0 border-white/5 pb-4 md:pb-0 relative z-20">
                    <div className="w-12 h-12 bg-[#0a0a0f] rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-white/10 group-hover:scale-110 group-hover:border-violet-500/50 transition-all duration-300">
                      <CalendarIcon className="w-5 h-5 text-violet-400" />
                    </div>
                    {editingTimeId === post.id ? (
                      <div className="space-y-2 w-full">
                        <input
                          type="date"
                          value={editingTimeDate}
                          onChange={e => setEditingTimeDate(e.target.value)}
                          className="w-full bg-white/5 border border-violet-500/40 rounded-xl px-2 py-1.5 text-white text-xs font-medium focus:outline-none focus:border-violet-500/70 transition-colors"
                          style={{ colorScheme: "dark" }}
                        />
                        <input
                          type="time"
                          value={editingTimeTime}
                          onChange={e => setEditingTimeTime(e.target.value)}
                          className="w-full bg-white/5 border border-violet-500/40 rounded-xl px-2 py-1.5 text-white text-xs font-medium focus:outline-none focus:border-violet-500/70 transition-colors"
                          style={{ colorScheme: "dark" }}
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleSaveTime(post.id)}
                            disabled={savingTime || !editingTimeDate || !editingTimeTime}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingTime ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => setEditingTimeId(null)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xl font-bold text-white leading-none">{post.time || "--:--"}</div>
                        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mt-2">{post.date || "Unknown"}</div>
                      </>
                    )}
                  </div>

                  <div className="flex-1 space-y-5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.platforms?.map((p, i) => (
                        <span key={i} className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-white shadow-md">
                          {renderPlatformIcon(p)}
                        </span>
                      ))}
                      <span className={`ml-3 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${post.status === 'Scheduled' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : post.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {post.status}
                      </span>
                    </div>

                    {/* Content — editable for drafts */}
                    {isEditingThis ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingContent}
                          onChange={e => setEditingContent(e.target.value)}
                          rows={5}
                          className="w-full bg-white/5 border border-violet-500/40 rounded-2xl p-5 text-white text-base font-medium resize-none focus:outline-none focus:border-violet-500/70 transition-colors leading-relaxed"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveDraft(post.id)}
                            disabled={savingDraft || !editingContent.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 font-bold text-sm transition-all"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white text-lg font-medium leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner break-words relative">
                        {post.content}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 shrink-0 mt-4 md:mt-0 flex-row md:flex-col items-center">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="w-12 h-12 rounded-xl bg-red-500/5 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    {/* Edit button — only for drafts */}
                    {post.status === 'Draft' && !isEditingThis && (
                      <button
                        onClick={() => handleStartEdit(post)}
                        className="w-12 h-12 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center text-amber-400 transition-colors border border-transparent hover:border-amber-500/20"
                        title="Edit draft"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    )}

                    {/* Reschedule button — only for scheduled posts */}
                    {post.status === 'Scheduled' && editingTimeId !== post.id && (
                      <button
                        onClick={() => handleStartTimeEdit(post)}
                        className="w-12 h-12 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 flex items-center justify-center text-sky-400 transition-colors border border-transparent hover:border-sky-500/20"
                        title="Edit schedule time"
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                    )}

                    {/* Edit in Composer — for Draft and Scheduled posts */}
                    {(post.status === 'Draft' || post.status === 'Scheduled') && (
                      <button
                        onClick={() => {
                          localStorage.setItem("nexopost_edit_post", JSON.stringify({
                            id: post.id,
                            content: post.content,
                            platforms: post.platforms,
                            mediaUrls: post.mediaUrls ?? [],
                          }));
                          router.push(`/compose?edit=${post.id}`);
                        }}
                        className="w-12 h-12 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 flex items-center justify-center text-violet-400 transition-colors border border-transparent hover:border-violet-500/20"
                        title="Edit in Composer"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    )}

                    {(post.status === 'Draft' || post.status === 'Scheduled') && (
                      <button
                        onClick={() => handlePublishDraft(post.id)}
                        disabled={!subscriptionSnapshot.canPublish}
                        title={subscriptionSnapshot.canPublish ? "Publish Now" : "Renew your package to publish"}
                        className="w-12 h-12 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/50 flex items-center justify-center text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
