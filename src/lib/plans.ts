export type PlanId = "free" | "basic" | "pro" | "agency" | "agency_plus";
export type BillingCycle = "monthly" | "annual";

export type PlatformId =
  | "twitter"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "bluesky"
  | "threads";

export type PlanEntitlements = {
  id: PlanId;
  label: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  maxWorkspaces: number | null;
  maxMembers: number | null;
  monthlyPlatformJobs: number | null;
  allowedPlatforms: PlatformId[];
  connectablePlatforms: PlatformId[];
  dailyPerPlatformCaps?: Partial<Record<PlatformId, number>>;
  xEnabled: boolean;
  xSpendCapCents: number | null;
  marketing: {
    badge?: string;
    headline: string;
    summary: string;
    cta: string;
    perks: string[];
  };
};

export const PLAN_ORDER: PlanId[] = ["free", "basic", "pro", "agency", "agency_plus"];

const PAID_ROLLOUT_PLATFORMS: PlatformId[] = [
  "tiktok",
  "youtube",
  "pinterest",
  "bluesky",
  "threads",
];

export const PLAN_CATALOG: Record<PlanId, PlanEntitlements> = {
  free: {
    id: "free",
    label: "Free",
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    maxWorkspaces: 1,
    maxMembers: 1,
    monthlyPlatformJobs: null,
    allowedPlatforms: ["facebook", "instagram"],
    connectablePlatforms: ["facebook", "instagram"],
    dailyPerPlatformCaps: {
      facebook: 5,
      instagram: 5,
    },
    xEnabled: false,
    xSpendCapCents: null,
    marketing: {
      badge: "Free Forever",
      headline: "Free",
      summary: "Start with the Meta stack and test your workflow without a card.",
      cta: "Start Free",
      perks: [
        "1 workspace",
        "1 member",
        "Facebook + Instagram only",
        "5 daily posts per platform",
        "No credit card required",
      ],
    },
  },
  basic: {
    id: "basic",
    label: "Basic",
    monthlyPriceCents: 1900,
    annualPriceCents: 20900,
    maxWorkspaces: 1,
    maxMembers: 2,
    monthlyPlatformJobs: 300,
    allowedPlatforms: ["facebook", "instagram", "linkedin"],
    connectablePlatforms: ["facebook", "instagram", "linkedin", ...PAID_ROLLOUT_PLATFORMS],
    xEnabled: false,
    xSpendCapCents: null,
    marketing: {
      headline: "Basic",
      summary: "For solo operators managing one brand with dependable core publishing.",
      cta: "Choose Basic",
      perks: [
        "1 workspace",
        "2 members",
        "300 monthly platform jobs",
        "Facebook, Instagram, LinkedIn",
        "Core scheduling and analytics",
      ],
    },
  },
  pro: {
    id: "pro",
    label: "Pro",
    monthlyPriceCents: 4900,
    annualPriceCents: 53900,
    maxWorkspaces: 5,
    maxMembers: 5,
    monthlyPlatformJobs: 1500,
    allowedPlatforms: ["facebook", "instagram", "linkedin"],
    connectablePlatforms: ["facebook", "instagram", "linkedin", ...PAID_ROLLOUT_PLATFORMS],
    xEnabled: false,
    xSpendCapCents: null,
    marketing: {
      badge: "Popular",
      headline: "Pro",
      summary: "For growing teams who need more brands, more seats, and more output.",
      cta: "Choose Pro",
      perks: [
        "5 workspaces",
        "5 members",
        "1,500 monthly platform jobs",
        "Facebook, Instagram, LinkedIn",
        "Priority scheduling and approvals",
      ],
    },
  },
  agency: {
    id: "agency",
    label: "Agency",
    monthlyPriceCents: 7900,
    annualPriceCents: 86900,
    maxWorkspaces: 10,
    maxMembers: 10,
    monthlyPlatformJobs: 5000,
    allowedPlatforms: ["facebook", "instagram", "linkedin", "twitter"],
    connectablePlatforms: ["facebook", "instagram", "linkedin", "twitter", ...PAID_ROLLOUT_PLATFORMS],
    xEnabled: true,
    xSpendCapCents: 2000,
    marketing: {
      headline: "Agency",
      summary: "Built for client work, team approvals, and included X publishing.",
      cta: "Choose Agency",
      perks: [
        "10 workspaces",
        "10 members",
        "5,000 monthly platform jobs",
        "X publishing included",
        "Approval flows and white-label foundations",
      ],
    },
  },
  agency_plus: {
    id: "agency_plus",
    label: "Agency Plus",
    monthlyPriceCents: 17900,
    annualPriceCents: 196900,
    maxWorkspaces: null,
    maxMembers: 25,
    monthlyPlatformJobs: 20000,
    allowedPlatforms: ["facebook", "instagram", "linkedin", "twitter"],
    connectablePlatforms: ["facebook", "instagram", "linkedin", "twitter", ...PAID_ROLLOUT_PLATFORMS],
    xEnabled: true,
    xSpendCapCents: 8000,
    marketing: {
      badge: "High Volume",
      headline: "Agency Plus",
      summary: "For agencies running many brands with high-volume X access built in.",
      cta: "Choose Agency Plus",
      perks: [
        "Unlimited workspaces",
        "25 members",
        "20,000 monthly platform jobs",
        "High-volume X publishing included",
        "Advanced campaign operations",
      ],
    },
  },
};

export function isPlanId(value: string): value is PlanId {
  return value in PLAN_CATALOG;
}

export function getPlanConfig(plan: PlanId) {
  return PLAN_CATALOG[plan];
}

export function getPlanLabel(plan: PlanId) {
  return PLAN_CATALOG[plan].label;
}

export function getPlanPriceCents(plan: PlanId, billingCycle: BillingCycle) {
  return billingCycle === "annual"
    ? PLAN_CATALOG[plan].annualPriceCents
    : PLAN_CATALOG[plan].monthlyPriceCents;
}

export function formatPriceCents(priceCents: number) {
  return (priceCents / 100).toFixed(0);
}

export function canPlanPublishToPlatform(plan: PlanId, platform: string) {
  return PLAN_CATALOG[plan].allowedPlatforms.includes(platform as PlatformId);
}

export function canPlanConnectPlatform(plan: PlanId, platform: string) {
  return PLAN_CATALOG[plan].connectablePlatforms.includes(platform as PlatformId);
}

export function getDailyPlatformCap(plan: PlanId, platform: string) {
  return PLAN_CATALOG[plan].dailyPerPlatformCaps?.[platform as PlatformId] ?? null;
}

export function getWorkspaceLimit(plan: PlanId) {
  return PLAN_CATALOG[plan].maxWorkspaces;
}

export function getMemberLimit(plan: PlanId) {
  return PLAN_CATALOG[plan].maxMembers;
}

export function isUnlimited(value: number | null) {
  return value === null;
}
