import { 
  DashboardSquare02Icon, 
  Book02Icon, 
  TaxesIcon, 
  GitPullRequestIcon, 
  DocumentValidationIcon, 
  InstallingUpdates02Icon,
  Building01Icon, 
  CashbackPoundIcon
} from '@hugeicons/core-free-icons';
import type { MenuItem } from '../types/menu';

export const menuData: MenuItem[] = [
    {
        slug: "dashboard",
        icon: DashboardSquare02Icon,
        label: "Dashboard",
        href: "/dashboard",
        section: "primary",
        description: "Company overview & status",
    },
    {
        slug: "company",
        icon: Building01Icon,
        label: "Company",
        href: "/dashboard/company",
        section: "primary",
        description: "Company details & documents",
    },
    {
        slug: "documents",
        icon: DocumentValidationIcon,
        label: "Documents",
        href: "/dashboard/documents",
        section: "primary",
        description: "Store and access documents",
    },
    {
        slug: "services-root",
        icon: GitPullRequestIcon,
        label: "Services",
        href: "/dashboard/services",
        section: "primary",
        description: "Accounting, audit & corporate services",
        children: [
            {
                slug: "accounting-bookkeeping",
                icon: Book02Icon,
                label: "Accounting & Bookkeeping",
                href: "/dashboard/services/bookkeeping",
                isActive: true,
            },
            {
                slug: "vat-tax",
                icon: TaxesIcon,
                label: "VAT & Tax",
                href: "/dashboard/services/vat",
                isActive: true,
            },
            {
                slug: "payroll",
                icon: CashbackPoundIcon,
                label: "Payroll",
                href: "/dashboard/services/payroll",
                isActive: true,
            },
            {
                slug: "audit",
                icon: DocumentValidationIcon,
                label: "Audit",
                href: "/dashboard/services/audit",
                isActive: true,
            }
        ]
    },
    {
        slug: "settings",
        icon: InstallingUpdates02Icon,
        label: "Settings",
        href: "/dashboard/settings",
        section: "settings",
        description: "Configure preferences",
    }
];
