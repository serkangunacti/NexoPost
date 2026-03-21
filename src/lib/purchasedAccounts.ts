import { PendingPlanChange, SubscriptionRecord } from "@/lib/subscription";

type UserType = "basic" | "pro" | "agency";

export interface PurchasedAccount {
  connectedAccounts?: Record<string, string[]>;
  email: string;
  fullName: string;
  password: string;
  pendingChange?: PendingPlanChange | null;
  subscription: SubscriptionRecord;
  username?: string;
  userType: UserType;
  workspaces?: Array<{
    id: string;
    name: string;
  }>;
}

// Add purchased users here. Credentials listed in this file can log in directly
// and their saved plan/session state will be restored in the admin panel.
export const purchasedAccounts: PurchasedAccount[] = [
  {
    email: "serkan@serkan.com",
    fullName: "Serkan",
    password: "Trabzon61!",
    userType: "basic",
    subscription: {
      plan: "basic",
      billingCycle: "monthly",
      phase: "trial",
      startedAt: "2026-03-21T00:00:00.000Z",
      expiresAt: "2026-04-05T00:00:00.000Z",
      hasUsedTrial: true,
    },
  },
  {
    email: "serkangunacti@gmail.com",
    fullName: "Serkan Günaktı",
    password: "Trabzon61!",
    userType: "basic",
    subscription: {
      plan: "basic",
      billingCycle: "monthly",
      phase: "paid",
      startedAt: "2026-03-21T00:00:00.000Z",
      expiresAt: "2026-04-21T00:00:00.000Z",
      hasUsedTrial: false,
    },
  },
  {
    email: "serkan@nexopost.com",
    fullName: "Serkan NexoPost",
    password: "Trabzon61!",
    userType: "pro",
    subscription: {
      plan: "pro",
      billingCycle: "monthly",
      phase: "paid",
      startedAt: "2026-03-21T00:00:00.000Z",
      expiresAt: "2026-04-21T00:00:00.000Z",
      hasUsedTrial: false,
    },
  },
  {
    email: "admin@nexopost.com",
    fullName: "NexoPost Admin",
    password: "Trabzon61!",
    userType: "agency",
    subscription: {
      plan: "agency",
      billingCycle: "monthly",
      phase: "paid",
      startedAt: "2026-03-21T00:00:00.000Z",
      expiresAt: "2026-04-21T00:00:00.000Z",
      hasUsedTrial: false,
    },
  },
];

export function findPurchasedAccount(identifier: string, password: string): PurchasedAccount | null {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const normalizedPassword = password.trim();

  return (
    purchasedAccounts.find((account) => {
      const matchesIdentifier =
        account.email.toLowerCase() === normalizedIdentifier ||
        account.username?.toLowerCase() === normalizedIdentifier;

      return matchesIdentifier && account.password === normalizedPassword;
    }) ?? null
  );
}
