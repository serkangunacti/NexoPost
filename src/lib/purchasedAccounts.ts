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
export const purchasedAccounts: PurchasedAccount[] = [];

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
