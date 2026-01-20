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
}
