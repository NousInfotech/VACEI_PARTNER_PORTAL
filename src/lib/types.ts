// menu types
export type MenuSection = "primary" | "workspaces" | "operations" | "settings";
export interface MenuItem {
  slug: string;
  label: string;
  href?: string;
  icon: any;
  description?: string;
  section?: MenuSection;
  children?: MenuItem[];
  isActive?: boolean;
  roles?: string[];
}

// compliance types
export interface ComplianceItem {
  id: string;
  title: string;
  companyName: string;
  category: "Tax" | "Corporate" | "Legal" | "Audit";
  dueDate: string;
  status: "COMPLETED" | "PENDING" | "OVERDUE";
}