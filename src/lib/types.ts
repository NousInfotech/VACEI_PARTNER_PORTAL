

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
export type ComplianceCalendarFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
export type ComplianceCalendarType = 'COMPANY' | 'GLOBAL';

export interface ComplianceCalendarItem {
  id: string;
  type: ComplianceCalendarType;
  companyId: string | null;
  title: string;
  description: string | null;
  startDate: string;
  dueDate: string;
  frequency: ComplianceCalendarFrequency;
  customFrequencyPeriodUnit: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS' | null;
  customFrequencyPeriodValue: number | null;
  serviceCategory: string;
  customServiceCycleId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
  customServiceCycle?: {
    id: string;
    title: string;
  };
  createdBy?: {
    id: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

// Auth types
export interface Organization {
  id: string;
  name: string;
  type: string;
  status: string;
  availableServices: string[];
}

export interface CustomServiceCycle {
  id: string;
  title: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  allowedServices: string[];
  allowedCustomServiceCycles?: CustomServiceCycle[];
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
    refreshToken?: string;
  };
  message?: string;
}

export interface AuthMeResponse {
  data: {
    id?: string;
    user?: User;
    organizationMember?: OrganizationMember;
    role?: string;
    refreshToken?: string;
  } & Partial<User>;
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

