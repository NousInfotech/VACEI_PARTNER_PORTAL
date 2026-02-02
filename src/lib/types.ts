

// menu types
export type MenuSection = "primary" | "workspaces" | "operations" | "settings";
export interface MenuItem {
  slug: string;
  label: string;
  href?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Auth types
export interface Organization {
  id: string;
  name: string;
  type: string;
  status: string;
  availableServices: string[];
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  allowedServices: string[];
  organization: Organization;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
}

export interface LoginResponse {
  data: {
    user: User;
    organizationMember: OrganizationMember;
    token: string;
  };
  message?: string;
}

export interface AuthMeResponse {
  data: {
    user: User;
    organizationMember: OrganizationMember;
  };
  message?: string;
}

export const AVAILABLE_SERVICES = [
  { id: "ACCOUNTING", label: "Accounting" },
  { id: "AUDITING", label: "Auditing" },
  { id: "VAT", label: "VAT" },
  { id: "CFO", label: "CFO" },
  { id: "CSP", label: "CSP" },
  { id: "LEGAL", label: "Legal" },
  { id: "PAYROLL", label: "Payroll" },
  { id: "PROJECTS_TRANSACTIONS", label: "Projects & Transactions" },
  { id: "TECHNOLOGY", label: "Technology" },
  { id: "GRANTS_AND_INCENTIVES", label: "Grants & Incentives" },
  { id: "INCORPORATION", label: "Incorporation" },
  { id: "MBR", label: "MBR" },
  { id: "TAX", label: "Tax" }
];
