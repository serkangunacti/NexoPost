type UserType = "basic" | "pro" | "agency";
type BillingCycle = "monthly" | "annual";

export interface SubscriptionRecord {
  billingCycle: BillingCycle;
  expiresAt: string;
  hasUsedTrial: boolean;
  phase: "trial" | "paid";
  plan: UserType;
  startedAt: string;
}

export interface SubscriptionSnapshot {
  canPublish: boolean;
  expiresAtLabel: string;
  isExpired: boolean;
  isTrial: boolean;
  phaseLabel: string;
  planLabel: string;
  renewLabel: string;
  statusLabel: string;
  timeLeftLabel: string;
}

const planLabels: Record<UserType, string> = {
  basic: "Basic",
  pro: "Pro",
  agency: "Agency",
};

const billingLabels: Record<BillingCycle, string> = {
  annual: "Annual",
  monthly: "Monthly",
};

export function getSubscriptionSnapshot(subscription: SubscriptionRecord | null): SubscriptionSnapshot {
  if (!subscription) {
    return {
      canPublish: false,
      expiresAtLabel: "No active expiration date",
      isExpired: true,
      isTrial: false,
      phaseLabel: "No plan",
      planLabel: "No plan",
      renewLabel: "Choose a plan to unlock publishing",
      statusLabel: "Inactive",
      timeLeftLabel: "No active access",
    };
  }

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);
  const msRemaining = expiresAt.getTime() - now.getTime();
  const isExpired = msRemaining <= 0;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isTrial = subscription.phase === "trial";
  const planLabel = planLabels[subscription.plan];
  const expiresAtLabel = formatDate(subscription.expiresAt);

  return {
    canPublish: !isExpired,
    expiresAtLabel,
    isExpired,
    isTrial,
    phaseLabel: isTrial ? "Trial" : `${billingLabels[subscription.billingCycle]} Plan`,
    planLabel,
    renewLabel: isExpired
      ? "Renew your package to publish new posts again."
      : isTrial
        ? "You are on a free trial. You can upgrade to a paid package at any time."
        : `${billingLabels[subscription.billingCycle]} access is active.`,
    statusLabel: isExpired ? "Expired" : isTrial ? "Trialing" : "Active",
    timeLeftLabel: isExpired
      ? `Expired on ${expiresAtLabel}`
      : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`,
  };
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}
