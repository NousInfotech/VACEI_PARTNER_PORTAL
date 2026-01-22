import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "../lib/utils";
import type { MenuItem, MenuSection } from "../lib/types";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";

import logourl from "../assets/logo/logo2.png";
import { useAuth } from "../context/auth-context-core";

interface SidebarProps {
    menu: MenuItem[];
    isCollapsed?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
    onExpand?: () => void;
}

export default function SideBar({ 
    menu, 
    isCollapsed = false, 
    isOpen = false, 
    onClose,
    onExpand
}: SidebarProps) {
    const location = useLocation();
    const pathname = location.pathname;
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
    const { user, organizationMember } = useAuth();

    const branding = {
        sidebar_background_color: "15, 23, 41",
        sidebar_footer_color: "222 47% 16%",
        sidebar_text_color: "220 14% 96%"
    };

    const orgName = organizationMember?.organization?.name || "Vacei";
    const orgSubname = "ORGANIZATION PORTAL";

    const toggleItem = (slug: string) => {
        setOpenItems((prev) => ({
            ...prev,
            [slug]: !prev[slug],
        }));
    };

    const handleMenuClick = (e: React.MouseEvent, item: MenuItem, hasChildren: boolean) => {
        if (isCollapsed && hasChildren) {
            if (onExpand) onExpand();
            if (!openItems[item.slug]) {
                toggleItem(item.slug);
            }
            if (!item.href || item.href === "#") {
                e.preventDefault();
            }
            return;
        }

        if (hasChildren && !isCollapsed) {
            toggleItem(item.slug);
            const isHub = ['services-root', 'document-organizer', 'settings', 'payroll'].includes(item.slug);
            if (!isHub) {
                e.preventDefault();
            }
        } else if (item.href && item.href !== "#") {
            if (onClose) onClose();
        }
    };

    const sections: { id: MenuSection; label: string }[] = [
        { id: "primary", label: "Client portal" },
        { id: "operations", label: "Operations & tools" },
        { id: "settings", label: "Settings" },
    ];

    const grouped: Record<MenuSection, MenuItem[]> = {
        primary: [],
        workspaces: [],
        operations: [],
        settings: [],
    };

    menu.forEach((item) => {
        const section = item.section || "primary";
        grouped[section].push(item);
    });

    const renderMenuItem = (item: MenuItem, level = 1) => {
        const hasChildren = !!(item.children && item.children.length > 0);
        const isItemOpen = openItems[item.slug];
        
        const checkActive = (it: MenuItem): boolean => {
            if (!it.href || it.href === "#") {
                return !!(it.children && it.children.some(checkActive));
            }
            if (it.href === "/dashboard") {
                return pathname === "/dashboard";
            }
            const isExact = pathname === it.href;
            const isSubPath = it.href !== "/dashboard" && pathname.startsWith(it.href + "/");
            if (isExact || isSubPath) return true;
            if (it.children) return it.children.some(checkActive);
            return false;
        };
        const isActive = checkActive(item);

        if (level === 1) {
            const linkContent = (
                <Link
                    key={item.slug}
                    to={item.href || "#"}
                    onClick={(e) => handleMenuClick(e, item, hasChildren)}
                    className={cn(
                        'group relative flex items-center transition-all duration-300 ease-out',
                        isCollapsed 
                            ? 'justify-center px-2 py-3 rounded-2xl' 
                            : 'gap-4 px-4 py-3 rounded-2xl',
                        'hover:scale-[1.02] hover:shadow-lg border'
                    )}
                    style={{
                        backgroundColor: isActive ? `hsl(var(--sidebar-active))` : 'transparent',
                        color: isActive ? `hsl(var(--sidebar-foreground))` : `hsl(var(--sidebar-foreground) / 0.8)`,
                        borderColor: isActive ? `hsl(var(--sidebar-border))` : 'transparent'
                    }}
                >
                    {isActive && !isCollapsed && (
                        <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                            style={{ backgroundColor: `hsl(var(--sidebar-primary))` }}
                        ></div>
                    )}
                    
                    <div 
                        className={cn(
                            'relative flex items-center justify-center transition-all duration-300',
                            isCollapsed ? 'w-8 h-8' : 'w-10 h-10',
                            'rounded-xl'
                        )}
                        style={{
                            backgroundColor: isActive ? `hsl(var(--sidebar-primary))` : `hsl(${branding.sidebar_footer_color})`,
                            color: isActive ? `hsl(var(--sidebar-primary-foreground))` : `hsl(var(--sidebar-foreground))`
                        }}
                    >
                        <HugeiconsIcon icon={item.icon} className={cn(isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                    </div>

                    {!isCollapsed && (
                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between w-full gap-2">
                                <span className="font-semibold text-sm truncate">{item.label}</span>
                                {hasChildren && (
                                    isItemOpen ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />
                                )}
                            </div>
                            {item.description && (
                                <p className="text-[11px] leading-tight opacity-50 truncate mt-0.5 font-medium">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    )}

                    <div className={cn(
                        'absolute inset-0 transition-opacity duration-300 rounded-2xl pointer-events-none',
                        isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-10'
                    )}
                    style={{ backgroundColor: `hsl(var(--sidebar-foreground))` }}
                    ></div>
                </Link>
            );

            return (
                <li key={item.slug} className="space-y-1">
                    {isCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-lg p-3 max-w-xs">
                                <div className="space-y-1">
                                    <p className="font-bold text-sm leading-none">{item.label}</p>
                                    {item.description && <p className="text-[11px] opacity-70 leading-relaxed">{item.description}</p>}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        linkContent
                    )}

                    {hasChildren && isItemOpen && !isCollapsed && (
                        <ul className="ml-5 space-y-1 mt-1 border-l border-white/10 pl-4 py-1">
                            {item.children?.map((child) => renderMenuItem(child, level + 1))}
                        </ul>
                    )}
                </li>
            );
        }

        const isServiceActive = item.isActive !== false;
        
        return (
            <li key={item.slug} className="space-y-1">
                <Link
                    to={isServiceActive ? (item.href || "#") : "/dashboard"}
                    onClick={(e) => {
                        if (hasChildren) {
                            toggleItem(item.slug);
                            e.preventDefault();
                        } else if (onClose && item.href !== "#") {
                            onClose();
                        }
                    }}
                    className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl transition-all",
                        isServiceActive 
                            ? "hover:bg-white/5" 
                            : "opacity-50 cursor-not-allowed hover:bg-white/5 text-left",
                        isActive ? "text-white font-semibold bg-white/10 shadow-sm" : "text-white/60",
                        level >= 3 ? "text-xs" : "text-sm"
                    )}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <HugeiconsIcon icon={item.icon} className={cn(level >= 3 ? "h-3 w-3" : "h-4 w-4", !isServiceActive && "opacity-50")} />
                        <span className="truncate">{item.label}</span>
                    </div>
                    {hasChildren && (
                        isItemOpen ? <ChevronUp className="h-3 w-3 opacity-50 shrink-0" /> : <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                    )}
                </Link>

                {hasChildren && isItemOpen && (
                    <ul className="ml-5 space-y-1 mt-1 border-l border-white/10 pl-4 py-1">
                        {item.children?.map((child) => renderMenuItem(child, level + 1))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div
                className={cn(
                    "flex flex-col transform transition-all duration-300 ease-in-out z-50",
                    "fixed inset-y-0 left-0 w-64 h-full md:h-auto",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    isCollapsed 
                    ? "md:fixed md:top-4 md:bottom-4 md:left-4 md:w-20 md:h-[calc(100vh-2rem)]" 
                    : "md:fixed md:top-4 md:bottom-4 md:left-4 md:w-80 md:h-[calc(100vh-2rem)]",
                    "border shadow-xl",
                    "rounded-r-4xl md:rounded-4xl",
                    "bg-sidebar"
                )}
                style={{
                    backgroundColor: `rgb(${branding?.sidebar_background_color})`,
                    color: `hsl(${branding?.sidebar_text_color})`,
                    borderColor: `rgba(255,255,255,0.1)`
                }}
            >
                <div 
                    className={cn(
                        "border-b relative",
                        isCollapsed ? "p-4" : "p-6"
                    )}
                    style={{ borderColor: `rgba(255,255,255,0.1)` }}
                >
                    <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-4")}>
                        <div className="relative">
                            <div 
                                className={cn(
                                    "rounded-2xl flex items-center justify-center shadow-lg p-1 bg-white/10",
                                    isCollapsed ? "w-13 h-13" : "w-14 h-14"
                                )}
                            >
                                <img 
                                    src={logourl} 
                                    alt="Logo" 
                                    className={cn(
                                        "object-contain rounded-lg",
                                        isCollapsed ? "h-10 w-10" : "h-11 w-11"
                                    )} 
                                />
                            </div>
                        </div>
                        
                        {!isCollapsed && (
                            <div className="flex-1 transition-all duration-300 ease-in-out text-left">
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-bold tracking-tight text-white">{orgName}</h1>
                                    <p className="text-[10px] font-medium uppercase tracking-wider opacity-70 text-white/90">{orgSubname}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        className="md:hidden absolute top-6 right-6 p-2 rounded-lg transition-colors hover:bg-white/10"
                        onClick={onClose}
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>
            
                <nav className="flex-1 overflow-y-auto scrollbar-hide p-4">
                    <ul className="space-y-6">
                        {sections.map((section) => {
                            const items = grouped[section.id];
                            if (!items.length) return null;
                            return (
                                <li key={section.id} className="space-y-2">
                                    {!isCollapsed && (
                                        <p className="px-4 py-1 text-[10px] font-semibold tracking-widest uppercase text-white/40 text-left">
                                            {section.label}
                                        </p>
                                    )}
                                    <ul className="space-y-2">
                                        {items.map((item) => renderMenuItem(item))}
                                    </ul>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div 
                    className={cn(
                        "border-t",
                        isCollapsed ? "p-2" : "p-4"
                    )}
                    style={{ borderColor: `rgba(255,255,255,0.1)` }}
                >
                    <div 
                        className={cn(
                            "rounded-2xl p-4 bg-white/5 border border-white/10"
                        )}
                    >
                        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                            <div className="relative">
                                <div 
                                    className={cn("rounded-2xl flex items-center justify-center bg-gray-600", isCollapsed ? "w-8 h-8" : "w-10 h-10")}
                                >
                                    <span className={cn("font-bold text-white", isCollapsed ? "text-xs" : "text-sm")}>
                                        {user?.firstName?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-primary"></div>
                            </div>

                            {!isCollapsed && (
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-semibold truncate text-white">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-[11px] truncate opacity-70 text-white/70">{user?.email}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider> 
    );
}
