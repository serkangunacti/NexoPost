import { PendingPlanChange, SubscriptionRecord, type PlanId } from "@/lib/subscription";

type UserType = PlanId;

export interface UserSeed {
  fullName: string;
  userType: UserType;
  subscription: SubscriptionRecord;
  pendingChange?: PendingPlanChange | null;
  workspaces?: Array<{ id: string; name: string }>;
  connectedAccounts?: Record<string, string[]>;
}

// Seed data for bootstrapping Firestore user documents on first login.
// Passwords are managed entirely in Firebase Authentication Console — NOT stored here.
// To add a new customer: (1) create them in Firebase Console > Authentication,
// (2) add their plan info below keyed by email.
export const userSeeds: Record<string, UserSeed> = {
  "serkan@serkan.com": {
    fullName: "Serkan",
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
  "serkangunacti@gmail.com": {
    fullName: "Serkan Günaktı",
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
  "serkan@nexopost.com": {
    fullName: "Serkan NexoPost",
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
  "admin@nexopost.com": {
    fullName: "NexoPost Admin",
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
  "test@test.com": {
    fullName: "Test User",
    userType: "agency",
    subscription: {
      plan: "agency",
      billingCycle: "monthly",
      phase: "paid",
      startedAt: "2026-03-22T00:00:00.000Z",
      expiresAt: "2026-04-22T00:00:00.000Z",
      hasUsedTrial: false,
    },
  },
};

export function getSeedForEmail(email: string): UserSeed | null {
  return userSeeds[email.trim().toLowerCase()] ?? null;
}
