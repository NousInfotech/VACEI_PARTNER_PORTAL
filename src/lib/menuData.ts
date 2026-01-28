import {
    DashboardSquare02Icon,
    Book02Icon,
    GitPullRequestIcon,
    DocumentValidationIcon,
    InstallingUpdates02Icon,
    Building01Icon,
} from '@hugeicons/core-free-icons';
import type { MenuItem } from './types';

export const menuData: MenuItem[] = [
    {
        slug: "dashboard",
        icon: DashboardSquare02Icon,
        label: "Dashboard",
        href: "/dashboard",
        section: "primary",
        description: "Service Overview",
        roles: ["ORG_ADMIN", "ORG_EMPLOYEE"]
    },
    // {
    //     slug: "clients",
    //     icon: Building01Icon,
    //     label: "Clients",
    //     href: "/dashboard/clients",
    //     section: "primary",
    //     description: "Manage client companies",
    //     roles: ["ORG_ADMIN"]
    // },
    {
        slug: "employees",
        icon: Building01Icon, // Using similar icon for now
        label: "Employees",
        href: "/dashboard/employees",
        section: "primary",
        description: "Manage organization employees",
        roles: ["ORG_ADMIN"]
    },
    {
        slug: "engagements",
        icon: Book02Icon,
        label: "Engagements",
        href: "/dashboard/engagements",
        section: "primary",
        description: "Active projects & tasks",
        roles: ["ORG_EMPLOYEE"]
    },
    {
        slug: "compliance",
        icon: DocumentValidationIcon,
        label: "Compliance",
        href: "/dashboard/compliance",
        section: "primary",
        description: "Regulatory status",
        roles: ["ORG_EMPLOYEE"]
    },
    {
        slug: "templates",
        icon: GitPullRequestIcon,
        label: "Document Request Templates",
        href: "/dashboard/templates",
        section: "primary",
        description: "Manage templates",
        roles: ["ORG_EMPLOYEE"]
    },
    // {
    //     slug: "organization",
    //     icon: Building01Icon,
    //     label: "Organization",
    //     href: "/dashboard/organization",
    //     section: "primary",
    //     description: "Manage organization details",
    //     roles: ["ORG_ADMIN"]
    // },
    {
        slug: "settings",
        icon: InstallingUpdates02Icon,
        label: "Settings",
        href: "/dashboard/settings",
        section: "settings",
        description: "Configure preferences",
        roles: ["ORG_EMPLOYEE", "ORG_ADMIN"]
    },

];
