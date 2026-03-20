"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenSquare, Calendar, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Composer", href: "/compose", icon: PenSquare },
    { name: "Scheduled", href: "/scheduled", icon: Calendar },
    { name: "Accounts", href: "/accounts", icon: Users },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass border-r z-50 p-6 flex flex-col justify-between hidden md:flex">
      <div>
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-sky-500 shadow-[0_0_15px_rgba(139,92,246,0.5)] flex items-center justify-center font-bold text-white text-lg">
            N
          </div>
          <span className="text-xl font-bold tracking-tight text-white">NexoPost</span>
        </div>

        <nav className="flex flex-col gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "text-white bg-white/10 border border-white/10 shadow-inner" 
                    : "text-neutral-400 hover:text-white glass-hover border border-transparent"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-violet-500 to-sky-500 rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                )}
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-violet-400" : "group-hover:text-white")} />
                <span className="font-medium text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="glass rounded-2xl p-4 flex items-center gap-3 mt-auto cursor-pointer hover:bg-white/10 transition-colors border-white/5">
        <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
          <Settings className="w-5 h-5 text-neutral-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">Settings</span>
          <span className="text-xs text-neutral-500 focus:outline-none">Manage account</span>
        </div>
      </div>
    </aside>
  );
}
