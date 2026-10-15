export interface PricingTier {
  id: string;
  name: string;
  description: string;
  priceMonthly: number | string;
  priceAnnual: number | string;
  periodMonthly: string;
  periodAnnual: string;
  featured?: boolean;
  ctaText: string;
  ctaVariant: "ghost" | "primary" | "matte";
  ctaAction: "github" | "modal" | "contact";
  features: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Frictionless onboarding for developers building prototypes and exploring isolated execution.",
    priceMonthly: "$0",
    priceAnnual: "$0",
    periodMonthly: "/ month",
    periodAnnual: "/ month",
    ctaText: "Get Started Free",
    ctaVariant: "matte",
    ctaAction: "modal",
    features: [
      "1,000 executions per day",
      "100 requests/minute rate limit",
      "Frictionless instant onboarding",
      "Full multi-language runtime access",
      "Community Discord support",
    ],
  },
  {
    id: "backer",
    name: "Backer (PWYW)",
    description: "Community support starting from $20 per month with instant rate limit and API quota upgrades.",
    priceMonthly: "$20",
    priceAnnual: "$16",
    periodMonthly: "/ month",
    periodAnnual: "/ month (billed annually)",
    featured: true,
    ctaText: "Become a Backer",
    ctaVariant: "primary",
    ctaAction: "modal",
    features: [
      "Community support from $20/month",
      "Instant rate limit upgrades",
      "Instant API execution limit upgrades",
      "Elastic bursting above base quotas",
      "Supporter badge & community perks",
    ],
  },
  {
    id: "partner",
    name: "Partner (Custom)",
    description: "For enterprise platforms requiring custom high-volume limits.",
    priceMonthly: "Custom",
    priceAnnual: "Custom",
    periodMonthly: "/ volume",
    periodAnnual: "/ volume",
    ctaText: "Contact Engineering",
    ctaVariant: "matte",
    ctaAction: "modal",
    features: [
      "Custom high-volume limits",
      "Managed via dedicated admin flow",
      "Dedicated single-tenant infrastructure",
      "Custom SquashFS runtime pipeline",
      "99.99% uptime SLA & dedicated Slack",
    ],
  },
];
