"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { 
  LayoutDashboard, 
  PenSquare, 
  CalendarDays, 
  Users, 
  Settings,
  LogOut,
  Plus
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { userType, setUserType, activeClient, setActiveClient, clients, addClient } = useApp();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Composer", href: "/compose", icon: PenSquare },
    { name: "Scheduled", href: "/scheduled", icon: CalendarDays },
    { name: "Accounts", href: "/accounts", icon: Users },
  ];

  return (
    <aside className={cn("flex flex-col py-8 overflow-y-auto overflow-x-hidden", className)}>
      <Link href="/dashboard" className="flex items-center gap-3 px-8 mb-12 group cursor-pointer w-fit">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30 group-hover:scale-105 transition-transform overflow-hidden relative shadow-[0_0_15px_rgba(139,92,246,0.2)]">
           <Image src="/logo.png" alt="NexoPost Logo" fill className="object-cover" />
        </div>
        <span className="text-2xl font-extrabold tracking-tight hidden md:block text-white">Nexo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">Post</span></span>
      </Link>

      <div className="px-6 mb-8 w-full hidden md:block">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 shadow-inner">
          <p className="text-xs font-bold text-violet-300 uppercase tracking-widest mb-1.5 opacity-80">Workspace</p>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="font-semibold text-white truncate max-w-[150px]">{activeClient.name}</p>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
              <select 
                value={activeClient.id}
                onChange={e => setActiveClient(clients.find(c => c.id === e.target.value) || clients[0])}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs text-white font-medium focus:outline-none focus:border-violet-500/50 transition-colors"
              >
                {clients.map(c => <option key={c.id} value={c.id} className="bg-[#0a0a0f]">{c.name}</option>)}
              </select>
              {userType !== 'basic' && (
                <button 
                  onClick={() => {
                    const maxClients = userType === 'pro' ? 3 : Infinity;
                    if (clients.length >= maxClients) {
                      alert(`Planınız (${userType.toUpperCase()}) en fazla ${maxClients} çalışma alanı (müşteri) eklemenize izin veriyor.`);
                      return;
                    }
                    const name = prompt("Enter new client / workspace name:");
                    if(name) addClient(name);
                  }} 
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-bold rounded-lg transition-colors border border-violet-500/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Workspace
                </button>
              )}
            </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 relative z-10">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-gradient-to-r from-violet-600/20 to-transparent text-white border-l-2 border-violet-500 font-bold" 
                  : "text-neutral-400 hover:bg-white/[0.04] hover:text-white font-semibold"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-50" />
              )}
              <link.icon className={cn(
                "w-5 h-5 transition-transform duration-300 relative z-10",
                isActive ? "text-violet-400 scale-110" : "group-hover:text-violet-400"
              )} />
              <span className="hidden md:block relative z-10 tracking-wide text-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 space-y-2 pt-8 relative z-10 border-t border-white/5 mx-4 pb-12">
        <button onClick={() => setUserType(userType === 'basic' ? 'pro' : userType === 'pro' ? 'agency' : 'basic')} className="flex items-center w-full gap-4 px-4 py-3 rounded-2xl text-neutral-500 hover:text-white hover:bg-white/[0.04] transition-all font-semibold group cursor-pointer border border-transparent hover:border-white/5">
          <Settings className="w-5 h-5 transition-transform group-hover:rotate-45" />
          <span className="hidden md:block tracking-wide text-xs uppercase leading-tight">Switch Mode (Now:<br/><span className="text-violet-400 font-bold">{userType}</span>)</span>
        </button>
        <Link href="/" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all font-semibold group cursor-pointer">
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden md:block tracking-wide text-sm">Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
