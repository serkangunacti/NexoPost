"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { getPlanConfig, getPlanLabel, isUnlimited, type PlanId } from "@/lib/plans";
import {
  LayoutDashboard,
  PenSquare,
  CalendarDays,
  Users,
  LogOut,
  Plus,
  BarChart3,
  X,
  Building2,
  Pencil,
  ChevronDown,
  User,
  ArrowUpRight,
  KeyRound,
  Menu,
  Link2,
  LifeBuoy,
  Shield,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const inputCls = "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 font-medium focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all";
const labelCls = "block text-sm font-semibold text-neutral-400 mb-2";

/* ── Generic Modal Shell ── */
function Modal({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass rounded-3xl border border-white/10 p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">{icon}</div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Add Workspace Modal ── */
function AddWorkspaceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  const handleSubmit = (e: React.SyntheticEvent) => { e.preventDefault(); if (!name.trim()) return; onAdd(name.trim()); onClose(); };
  return (
    <Modal title="New Workspace" icon={<Building2 className="w-5 h-5 text-violet-400" />} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls}>Client / Company Name <span className="text-red-400">*</span></label>
          <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corp" className={inputCls} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 font-semibold transition-all">Cancel</button>
          <button type="submit" disabled={!name.trim()} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Edit Client Modal ── */
function EditClientModal({ clientName, onClose, onSave }: { clientName: string; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(clientName);
  const handleSubmit = (e: React.SyntheticEvent) => { e.preventDefault(); if (!name.trim()) return; onSave(name.trim()); onClose(); };
  return (
    <Modal title="Edit Client" icon={<Building2 className="w-5 h-5 text-violet-400" />} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls}>Client Name <span className="text-red-400">*</span></label>
          <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 font-semibold transition-all">Cancel</button>
          <button type="submit" disabled={!name.trim()} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all">Save</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Edit Profile Modal ── */
function EditProfileModal({ profile, onClose, onSave }: {
  profile: { fullName: string; companyName: string; phone: string; email: string };
  onClose: () => void;
  onSave: (updates: { fullName: string; companyName: string; phone: string; email: string }) => void;
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [companyName, setCompanyName] = useState(profile.companyName);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const valid = fullName.trim() && companyName.trim() && phone.trim() && email.trim();
  const handleSubmit = (e: React.SyntheticEvent) => { e.preventDefault(); if (!valid) return; onSave({ fullName: fullName.trim(), companyName: companyName.trim(), phone: phone.trim(), email: email.trim() }); onClose(); };
  return (
    <Modal title="Edit Profile" icon={<User className="w-5 h-5 text-violet-400" />} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className={labelCls}>Full Name <span className="text-red-400">*</span></label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>Company Name <span className="text-red-400">*</span></label><input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>Phone <span className="text-red-400">*</span></label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>Email <span className="text-red-400">*</span></label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 font-semibold transition-all">Cancel</button>
          <button type="submit" disabled={!valid} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all">Save</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Switch Workspace Dropdown ── */
function SwitchWorkspaceModal({ clients, activeId, onSelect, onClose }: {
  clients: { id: string; name: string }[];
  activeId: string;
  onSelect: (client: { id: string; name: string }) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Switch Workspace" icon={<Building2 className="w-5 h-5 text-violet-400" />} onClose={onClose}>
      <div className="space-y-2">
        {clients.map(c => (
          <button key={c.id} onClick={() => { onSelect(c); onClose(); }}
            className={cn("w-full text-left px-4 py-3 rounded-xl font-semibold transition-all", c.id === activeId ? "bg-violet-600/20 text-white border border-violet-500/30" : "text-neutral-300 hover:bg-white/5 border border-transparent")}>
            {c.name}
          </button>
        ))}
      </div>
    </Modal>
  );
}

/* ── Change Password Modal ── */
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const valid = current.trim() && next.trim().length >= 6 && next === confirm;
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!valid) return;
    setDone(true);
  };
  return (
    <Modal title="Change Password" icon={<KeyRound className="w-5 h-5 text-violet-400" />} onClose={onClose}>
      {done ? (
        <div className="space-y-5 text-center py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-white font-semibold">Password updated successfully.</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all">Close</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className={labelCls}>Current Password <span className="text-red-400">*</span></label><input type="password" value={current} onChange={e => setCurrent(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>New Password <span className="text-red-400">*</span></label><input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="At least 6 characters" className={inputCls} /></div>
          <div><label className={labelCls}>Confirm New Password <span className="text-red-400">*</span></label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={inputCls} /></div>
          {confirm && next !== confirm && <p className="text-red-400 text-xs font-semibold">Passwords do not match.</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 font-semibold transition-all">Cancel</button>
            <button type="submit" disabled={!valid} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all">Save</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ── Workspace Limit Modal ── */
function WorkspaceLimitModal({ userType, onClose }: { userType: PlanId; onClose: () => void }) {
  const currentPlan = getPlanConfig(userType);
  const limit = currentPlan.maxWorkspaces;
  const nextPlan = userType === "free" ? "Basic" : userType === "basic" ? "Pro" : userType === "pro" ? "Agency" : "Agency Plus";
  return (
    <Modal title="Workspace Limit Reached" icon={<Building2 className="w-5 h-5 text-amber-400" />} onClose={onClose}>
      <div className="space-y-5">
        <p className="text-neutral-300 text-sm leading-relaxed">
          Your <span className="font-bold text-white capitalize">{getPlanLabel(userType).toUpperCase()}</span> plan allows up to{" "}
          <span className="font-bold text-amber-300">
            {isUnlimited(limit) ? "unlimited workspaces" : `${limit} workspace${limit > 1 ? "s" : ""}`}
          </span>.
          Upgrade your plan to manage more clients.
        </p>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20">
          <p className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">With {nextPlan} Plan</p>
          <p className="text-white text-sm font-semibold">
            {nextPlan === "Basic"
              ? "1 workspace with paid publishing"
              : nextPlan === "Pro"
                ? "Up to 5 workspaces"
                : nextPlan === "Agency"
                  ? "Up to 10 workspaces with X access"
                  : "Unlimited workspaces and higher X capacity"}
          </p>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 font-semibold transition-all"
          >
            Close
          </button>
          <Link
            href="/checkout"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all flex items-center justify-center gap-2"
          >
            Upgrade Plan <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Modal>
  );
}

/* ── Sidebar ── */
export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userType, activeClient, setActiveClient, clients, addClient, renameClient, logout, userProfile, updateUserProfile, isStaff, isSuperadmin } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSwitchWorkspace, setShowSwitchWorkspace] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Composer", href: "/compose", icon: PenSquare },
    { name: "Scheduled", href: "/scheduled", icon: CalendarDays },
    { name: "Connections", href: "/connections", icon: Link2 },
    { name: "Accounts", href: "/accounts", icon: Users },
    ...(isStaff ? [{ name: "Campaigns", href: "/campaigns", icon: ArrowUpRight }] : []),
    ...(isSuperadmin ? [{ name: "Superadmin", href: "/superadmin", icon: Shield }] : []),
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {showAddModal && (
        <AddWorkspaceModal
          onClose={() => setShowAddModal(false)}
          onAdd={(name) => addClient(name)}
        />
      )}
      {showEditClient && (
        <EditClientModal
          clientName={activeClient.name}
          onClose={() => setShowEditClient(false)}
          onSave={(name) => renameClient(activeClient.id, name)}
        />
      )}
      {showEditProfile && userProfile && (
        <EditProfileModal
          profile={{ fullName: userProfile.fullName ?? "", companyName: userProfile.companyName ?? "", phone: userProfile.phone ?? "", email: userProfile.email ?? "" }}
          onClose={() => setShowEditProfile(false)}
          onSave={(updates) => updateUserProfile(updates)}
        />
      )}
      {showSwitchWorkspace && clients.length > 1 && (
        <SwitchWorkspaceModal
          clients={clients}
          activeId={activeClient.id}
          onSelect={(c) => setActiveClient(c)}
          onClose={() => setShowSwitchWorkspace(false)}
        />
      )}
      {showLimitModal && (
        <WorkspaceLimitModal
          userType={userType}
          onClose={() => setShowLimitModal(false)}
        />
      )}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
      {/* Hamburger button — mobile only, always visible when sidebar is closed */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-[60] p-2.5 rounded-xl bg-[#0a0a0f]/90 border border-white/10 text-neutral-400 hover:text-white transition-all md:hidden shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop — mobile only */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside className={cn(
        "flex flex-col py-8 overflow-y-auto overflow-x-hidden transition-transform duration-300",
        "md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        {/* Logo + close button row */}
        <div className="flex items-center justify-between px-6 mb-8">
          <Link href="/dashboard" onClick={closeMobile} className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Image src="/logo.png" alt="NexoPost Logo" width={28} height={28} className="h-7 w-7 object-contain" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Nexo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">Post</span>
            </span>
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={closeMobile}
            className="p-2 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User / Company section */}
        <div className="px-6 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 shadow-inner">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-violet-300 uppercase tracking-widest mb-1 opacity-80">Company</p>
                <p className="font-bold text-white truncate text-sm">{userProfile?.companyName || "—"}</p>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5 font-medium">{userProfile?.fullName || ""}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <button onClick={() => setShowChangePassword(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-500 hover:text-white transition-colors" title="Change password">
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowEditProfile(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-500 hover:text-white transition-colors" title="Edit profile">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active workspace / client */}
        <div className="px-6 mb-8">
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Active Client</p>
            {clients.length === 0 ? (
              <p className="text-xs text-neutral-600 font-medium mb-3">No clients added yet.</p>
            ) : (
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <p className="font-semibold text-white truncate text-sm">{activeClient.name}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setShowEditClient(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-500 hover:text-white transition-colors" title="Edit client">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {clients.length > 1 && (
                    <button onClick={() => setShowSwitchWorkspace(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-500 hover:text-white transition-colors" title="Switch workspace">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                const maxClients = getPlanConfig(userType).maxWorkspaces;
                if (maxClients !== null && clients.length >= maxClients) {
                  setShowLimitModal(true);
                  return;
                }
                setShowAddModal(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-bold rounded-lg transition-colors border border-violet-500/30"
            >
              <Plus className="w-3.5 h-3.5" /> {clients.length === 0 ? "Add First Client" : "Add Workspace"}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-2 relative z-10">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href} onClick={closeMobile}
                className={cn("flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                  isActive ? "bg-gradient-to-r from-violet-600/20 to-transparent text-white border-l-2 border-violet-500 font-bold" : "text-neutral-400 hover:bg-white/[0.04] hover:text-white font-semibold"
                )}>
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-50" />}
                <link.icon className={cn("w-5 h-5 transition-transform duration-300 relative z-10 shrink-0", isActive ? "text-violet-400 scale-110" : "group-hover:text-violet-400")} />
                <span className="relative z-10 tracking-wide text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="mt-auto px-4 space-y-2 pt-8 relative z-10 border-t border-white/5 mx-4 pb-12">
          <Link
            href="/support"
            onClick={closeMobile}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-all font-semibold group cursor-pointer w-full text-left"
          >
            <LifeBuoy className="w-5 h-5 group-hover:text-violet-400 transition-colors shrink-0" />
            <span className="tracking-wide text-sm">Support</span>
          </Link>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all font-semibold group cursor-pointer w-full text-left"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform shrink-0" />
            <span className="tracking-wide text-sm">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
