type UserType = "free" | "basic" | "pro" | "agency" | "agency_plus";

export interface AnalyticsMetric {
  accent: string;
  iconAccent: string;
  key: "audience" | "impressions" | "engagement";
  title: string;
  trend: string;
  value: string;
}

const platformWeight: Record<string, number> = {
  bluesky: 0.3,
  facebook: 1.2,
  instagram: 1.4,
  linkedin: 0.8,
  pinterest: 0.5,
  threads: 0.6,
  tiktok: 1.5,
  twitter: 1,
  youtube: 1.8,
};

function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 1 : 0,
    notation: "compact",
  }).format(value);
}

export function getAnalyticsOverview(userType: UserType, connectedIds: string[]): AnalyticsMetric[] {
  const connectionScore = connectedIds.reduce((total, id) => total + (platformWeight[id] ?? 0.4), 0);
  const planMultiplier =
    userType === "agency_plus" ? 1.42 : userType === "agency" ? 1.28 : userType === "pro" ? 1.12 : userType === "basic" ? 1 : 0.85;

  const audience = Math.round((820000 + connectionScore * 92000) * planMultiplier);
  const impressions = Math.round((3400000 + connectionScore * 410000) * planMultiplier);
  const engagement = Math.round((185000 + connectionScore * 32000) * planMultiplier);

  return [
    {
      accent: "from-violet-500/20 to-transparent",
      iconAccent: "text-violet-400",
      key: "audience",
      title: "Total Audience",
      trend: `+${(7.8 + connectionScore * 0.6).toFixed(1)}% this month`,
      value: compactNumber(audience),
    },
    {
      accent: "from-sky-500/20 to-transparent",
      iconAccent: "text-sky-400",
      key: "impressions",
      title: "Content Impressions",
      trend: `+${(18.4 + connectionScore * 1.1).toFixed(1)}% this month`,
      value: compactNumber(impressions),
    },
    {
      accent: "from-pink-500/20 to-transparent",
      iconAccent: "text-pink-400",
      key: "engagement",
      title: "Profile Engagement",
      trend: `+${(5.6 + connectionScore * 0.5).toFixed(1)}% this month`,
      value: compactNumber(engagement),
    },
  ];
}
