import {
  BarChart3,
  Bell,
  Bot,
  CreditCard,
  FileText,
  Link2,
  Home,
  Rocket,
  Search,
  Shield,
  Settings,
  TrendingUp,
  Sparkles,
  Database,
  Users,
  Bookmark,
  Share2,
  Cpu,
  Layers,
  MessageSquare
} from "lucide-react";

export interface SidebarItem {
  href: string;
  label: string;
  icon: any;
  isPro?: boolean;
  isCore?: boolean;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

export const sidebarGroups: SidebarGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: Home },
      { href: "/dashboard/chat", label: "Ask AI", icon: MessageSquare, isCore: true },
      { href: "/dashboard/documents", label: "Documents", icon: FileText },
      { href: "/dashboard/search", label: "Search", icon: Search },
      { href: "/dashboard/insights", label: "Insights", icon: Sparkles },
      { href: "/dashboard/notifications", label: "Alerts", icon: Bell },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/dashboard/connectors", label: "Data Sources", icon: Link2 },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, isPro: true },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { href: "/dashboard/notes", label: "Notes", icon: FileText },
      { href: "/dashboard/shared", label: "Shared", icon: Share2 },
      { href: "/dashboard/saved", label: "Saved", icon: Bookmark },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/admin/ai", label: "AI Admin", icon: Cpu },
      { href: "/dashboard/admin", label: "Workspace Admin", icon: Shield },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];
