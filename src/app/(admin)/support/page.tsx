import SupportCenter from "@/components/SupportCenter";

export default function SupportPage() {
  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-300">Workspace Support</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Support Center</h1>
        <p className="max-w-2xl text-sm leading-7 text-neutral-400">
          Create support requests, review ticket history, and manage the support queue from one place.
        </p>
      </div>
      <SupportCenter />
    </main>
  );
}
