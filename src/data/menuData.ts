import { 
  DashboardSquare02Icon, 
  Book02Icon, 
  GitPullRequestIcon, 
  DocumentValidationIcon, 
  InstallingUpdates02Icon,
  Building01Icon, 
} from '@hugeicons/core-free-icons';
import type { MenuItem } from '../types/menu';

export const menuData: MenuItem[] = [
    {
        slug: "dashboard",
        icon: DashboardSquare02Icon,
        label: "Dashboard",
        href: "/dashboard",
        section: "primary",
        description: "Service Overview",
    },
    {
        slug: "companies",
        icon: Building01Icon,
        label: "Companies",
        href: "/dashboard/companies",
        section: "primary",
        description: "Manage client companies",
    },
    {
        slug: "engagements",
        icon: Book02Icon,
        label: "Engagements",
        href: "/dashboard/engagements",
        section: "primary",
        description: "Active projects & tasks",
    },
    {
        slug: "compliance",
        icon: DocumentValidationIcon,
        label: "Compliance",
        href: "/dashboard/compliance",
        section: "primary",
        description: "Regulatory status",
    },
    {
        slug: "templates",
        icon: GitPullRequestIcon,
        label: "Document Request Templates",
        href: "/dashboard/templates",
        section: "primary",
        description: "Manage templates",
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
