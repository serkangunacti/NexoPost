import AdminShell from "@/components/AdminShell";
import AdminPlanBanner from "@/components/AdminPlanBanner";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminShell>
      <Sidebar className="w-64 fixed top-0 left-0 h-full border-r border-white/5 bg-[#0a0a0f]/80 backdrop-blur-2xl z-50" />
      <main className="ml-0 md:ml-64 min-h-screen p-4 pt-20 md:p-10 relative z-10 transition-all duration-300">
        <AdminPlanBanner />
        {children}
      </main>
    </AdminShell>
  );
}
