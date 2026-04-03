"use client";

import { useState, useRef, useCallback } from "react";
import { Check, AlertCircle, Building2, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiBluesky, SiThreads, SiPinterest, SiYoutube } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";
import { useApp } from "@/context/AppContext";

interface ConfirmModal {
  message: string;
  onConfirm: () => void;
}

export default function AccountsPage() {
  const {
    userType,
    activeClient,
    clients,
    connectedAccounts,
    removeClient,
    renameClient,
    toggleAccount,
  } = useApp();
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);
  const openConfirm = (message: string, onConfirm: () => void) => setConfirmModal({ message, onConfirm });
  const closeConfirm = () => setConfirmModal(null);
  
  const defaultPlatforms = [
    { id: "twitter", name: "Twitter/X", icon: <SiX className="w-6 h-6" />, color: "bg-neutral-900 border border-neutral-700" },
    { id: "linkedin", name: "LinkedIn", icon: <FaLinkedin className="w-6 h-6" />, color: "bg-[#0A66C2]" },
    { id: "facebook", name: "Facebook", icon: <SiFacebook className="w-6 h-6" />, color: "bg-[#1877F2]" },
    { id: "instagram", name: "Instagram", icon: <SiInstagram className="w-6 h-6" />, color: "bg-gradient-to-tr from-[#FD1D1D] to-[#833AB4]" },
    { id: "tiktok", name: "TikTok", icon: <SiTiktok className="w-6 h-6 text-[#00f2fe] drop-shadow-[1px_1px_0_#fe0979]" />, color: "bg-black border border-white/10" },
    { id: "threads", name: "Threads", icon: <SiThreads className="w-6 h-6" />, color: "bg-black border border-neutral-800" },
    { id: "bluesky", name: "Bluesky", icon: <SiBluesky className="w-6 h-6" />, color: "bg-[#0560FF]" },
    { id: "pinterest", name: "Pinterest", icon: <SiPinterest className="w-6 h-6" />, color: "bg-[#E60023]" },
    { id: "youtube", name: "YouTube", icon: <SiYoutube className="w-6 h-6 text-[#FF0000]" />, color: "bg-white border border-neutral-200" },
  ];

  const currentConnectedIds = connectedAccounts[activeClient.id] || [];

  const handleToggle = (id: string) => {
    toggleAccount(activeClient.id, id);
  };

  const startEditing = (clientId: string, name: string) => {
    setEditingClientId(clientId);
    setEditingName(name);
  };

  const handleRename = () => {
    if (!editingClientId || !editingName.trim()) {
      return;
    }

    renameClient(editingClientId, editingName);
    setEditingClientId(null);
    setEditingName("");
  };

  const handleDelete = (clientId: string, clientName: string) => {
    if (clients.length === 1) {
      showToast("You cannot delete your only workspace.");
      return;
    }
    openConfirm(`Delete "${clientName}" workspace? Connected accounts in this workspace will also be removed.`, () => {
      removeClient(clientId);
      if (editingClientId === clientId) {
        setEditingClientId(null);
        setEditingName("");
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-[#1a0909] border border-red-500/50 text-red-200 px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/60 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 max-w-sm text-center">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          {toast}
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
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-6 pl-2 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Social Accounts</h1>
          <p className="text-neutral-400 text-lg font-medium flex items-center gap-2">
            Managing accounts for: 
            <span className="bg-violet-600/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-lg text-sm flex items-center gap-1.5 shadow-[0_0_10px_rgba(139,92,246,0.1)]">
              <Building2 className="w-4 h-4" /> {activeClient.name}
            </span>
          </p>
        </div>
        <div className="px-4 py-2.5 rounded-xl border font-bold text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
          Unlimited Networks Supported
          <span className="block text-xs font-semibold opacity-70 uppercase mt-0.5">{userType} Plan</span>
        </div>
      </header>

      {userType !== "free" && userType !== "basic" ? (
        <section className="glass rounded-[2rem] border border-white/5 p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Workspace Manager</h2>
              <p className="text-neutral-400 mt-2 max-w-2xl">
                Agency and Pro users can rename or remove client workspaces. Deleting a workspace removes its connected accounts from this admin panel.
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl border border-white/10 bg-black/20 text-sm text-neutral-300">
              {clients.length} active workspace{clients.length === 1 ? "" : "s"}
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="mt-6 py-10 text-center border border-dashed border-white/10 rounded-2xl">
              <p className="text-neutral-500 font-medium text-sm">No clients added yet.</p>
              <p className="text-neutral-600 text-xs mt-1">Use the &quot;Add First Client&quot; button in the sidebar.</p>
            </div>
          ) : (
          <div className="mt-6 space-y-3">
            {clients.map((client) => {
              const isEditing = editingClientId === client.id;
              const isActive = activeClient.id === client.id;
              return (
                <div
                  key={client.id}
                  className={`rounded-2xl border p-4 md:p-5 transition-all ${
                    isActive ? "border-violet-500/30 bg-violet-500/10" : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 font-bold mb-2">
                        {isActive ? "Active Workspace" : "Client Workspace"}
                      </p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          className="w-full md:w-80 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                        />
                      ) : (
                        <p className="text-xl font-bold text-white truncate">{client.name}</p>
                      )}
                      <p className="text-sm text-neutral-400 mt-2">
                        {(connectedAccounts[client.id] || []).length} connected account
                        {(connectedAccounts[client.id] || []).length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleRename}
                            className="px-4 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingClientId(null);
                              setEditingName("");
                            }}
                            className="px-4 py-2.5 rounded-xl border border-white/10 text-neutral-300 hover:bg-white/5 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(client.id, client.name)}
                            className="px-4 py-2.5 rounded-xl border border-white/10 text-neutral-200 hover:bg-white/5 transition-colors flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(client.id, client.name)}
                            disabled={clients.length === 1}
                            className="px-4 py-2.5 rounded-xl border border-red-500/20 text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </section>
      ) : null}

      {clients.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4">
          <Building2 className="w-10 h-10 text-neutral-600" />
          <p className="text-neutral-500 font-medium">Add a client first to connect social accounts.</p>
        </div>
      ) : (
      <div className="glass rounded-[2rem] p-8 md:p-12 border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {defaultPlatforms.map(platform => {
            const isConnected = currentConnectedIds.includes(platform.id);
            
            return (
              <div key={platform.id} className="glass p-6 rounded-2xl flex flex-col justify-between group hover:border-white/20 transition-all hover:bg-white/5 gap-6">
                <div className="flex items-start justify-between w-full">
                  <div className={`w-14 h-14 rounded-[1rem] flex items-center justify-center text-white font-bold shadow-lg shadow-black/30 ${platform.color} group-hover:scale-110 transition-transform duration-300`}>
                    {platform.icon}
                  </div>
                  {isConnected && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold bg-emerald-400/10 px-2 py-1 rounded-md">
                      <Check className="w-3.5 h-3.5" /> Connected
                    </span>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">{platform.name}</h3>
                  {isConnected ? (
                    <p className="text-sm text-neutral-400">@{activeClient.name.toLowerCase().replace(/\s+/g, '')}</p>
                  ) : (
                    <p className="text-sm text-neutral-500 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> Not connected
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={() => handleToggle(platform.id)}
                  className={`py-2 px-5 w-full rounded-xl text-sm font-bold transition-all ${
                    isConnected 
                    ? "bg-white/5 text-neutral-300 hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/30" 
                    : "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:bg-violet-500 hover:scale-105 active:scale-95 border border-violet-400/50"
                  }`}
                >
                  {isConnected ? "Disconnect" : "Connect Account"}
                </button>
              </div>
            )
          })}
        </div>
      </div>
      )}
    </div>
  );
}
