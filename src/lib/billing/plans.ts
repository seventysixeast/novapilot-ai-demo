export interface PlanLimits {
  name: string;
  price: number;
  ai_queries: number;
  workspaces: number;
  maxConnectors: number;
  features: string[];
  analytics_level: "basic" | "advanced" | "premium";
  canAccessAdvancedAnalytics: boolean;
  collaboration: boolean;
  exports: boolean;
  governance: boolean;
}

export const PRICING_PLANS: Record<string, PlanLimits> = {
  basic: {
    name: "Starter",
    price: 3,
    ai_queries: 150,
    workspaces: 1,
    maxConnectors: 1,
    analytics_level: "basic",
    canAccessAdvancedAnalytics: false,
    collaboration: false,
    exports: false,
    governance: false,
    features: [
      "Ask AI questions",
      "One workspace",
      "Basic charts",
      "Weekly summaries",
      "Standard response time"
    ]
  },
  pro: {
    name: "Growth",
    price: 6,
    ai_queries: 1000,
    workspaces: 5,
    maxConnectors: 5,
    analytics_level: "advanced",
    canAccessAdvancedAnalytics: true,
    collaboration: true,
    exports: false,
    governance: false,
    features: [
      "Better AI answers",
      "Growth alerts",
      "Team collaboration",
      "Shared insights",
      "Advanced charts",
      "Priority support"
    ]
  },
  enterprise: {
    name: "Pro",
    price: 9,
    ai_queries: 999999,
    workspaces: 999,
    maxConnectors: 999,
    analytics_level: "premium",
    canAccessAdvancedAnalytics: true,
    collaboration: true,
    exports: true,
    governance: true,
    features: [
      "Unlimited AI usage",
      "Exports",
      "Admin controls",
      "Private models",
      "Advanced connectors",
      "Priority support"
    ]
  }
};
