import { StaggeredMenuItem, StaggeredMenuSocialItem } from "@/components/StaggeredMenu";

export const PUBLIC_NAV_ITEMS: StaggeredMenuItem[] = [
  { label: "Overview", sublabel: "Financial Operating System", link: "/" },
  { label: "Modules", sublabel: "Visual Tour of All 19 Platform Modules", link: "/modules" },
  { label: "About", sublabel: "Architecture, Math & Audit Trail", link: "/about" },
  { label: "Pricing", sublabel: "Transparent Plans & ROI Calculator", link: "/pricing" },
  { label: "Live Dashboard", sublabel: "Real-Time BDT Cashflow & Accounts", link: "/login?redirect=/dashboard" },
  { label: "Chart of Accounts", sublabel: "Pacioli Double-Entry Balancing", link: "/accounts" },
  { label: "Financial Reports", sublabel: "Balance Sheet & Income Statement", link: "/reports" },
  { label: "NBR VAT 9.1", sublabel: "Statutory Tax & Mushak Return", link: "/tax" },
  { label: "Sales & Invoicing", sublabel: "Receivables & Commercial Invoices", link: "/sales" },
  { label: "Sign In", sublabel: "Access Verified Reviewer Session", link: "/login" },
];

export const PUBLIC_SOCIAL_ITEMS: StaggeredMenuSocialItem[] = [
  { label: "Sign In ↗", link: "/login" },
  { label: "Live Demo", link: "/login?redirect=/dashboard" },
  { label: "Financial Reports", link: "/reports" },
  { label: "NBR Compliance", link: "/tax" },
];
