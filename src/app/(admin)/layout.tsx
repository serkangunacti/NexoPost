import Sidebar from "@/components/Sidebar";
import { AppProvider } from "@/context/AppContext";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppProvider>
      <Sidebar className="w-20 md:w-64 fixed top-0 left-0 h-full border-r border-white/5 bg-[#0a0a0f]/80 backdrop-blur-2xl z-50" />
      <main className="ml-20 md:ml-64 min-h-screen p-6 md:p-10 relative z-10 transition-all duration-300">
        {children}
      </main>
    </AppProvider>
  );
}
