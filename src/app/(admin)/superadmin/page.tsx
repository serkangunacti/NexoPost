import SuperadminDashboard from "@/components/SuperadminDashboard";
import { requireSuperadminUser } from "@/lib/staff";

export default async function SuperadminPage() {
  await requireSuperadminUser();
  return <SuperadminDashboard />;
}
