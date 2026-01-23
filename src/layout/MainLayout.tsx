import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import SideBar from "./SideBar";
import TopHeader from "./TopHeader";
import { menuData } from "../lib/menuData";
import { cn } from "../lib/utils";
import { useAuth } from "../context/auth-context-core";

// Skeleton Dashboard for loading state
const LoadingSkeleton = () => (
    <div className="flex h-screen bg-[#f5f7ff] overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block w-72 bg-white border-r border-gray-100 p-6 space-y-8 h-full shrink-0">
            <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse" />
            <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-12 w-full bg-gray-50 rounded-xl animate-pulse" />
                ))}
            </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0 pr-2 overflow-hidden">
            {/* Header Skeleton */}
            <div className="h-20 w-full bg-white border-b border-gray-50 px-8 flex items-center justify-between mb-8">
                <div className="h-10 w-48 bg-gray-50 rounded-xl animate-pulse" />
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-50 rounded-full animate-pulse" />
                    <div className="h-10 w-32 bg-gray-50 rounded-xl animate-pulse" />
                </div>
            </div>
            
            {/* Content Area Skeleton */}
            <div className="flex-1 p-6 lg:p-8 space-y-8 overflow-hidden">
                <div className="h-12 w-64 bg-gray-100 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 w-full bg-white rounded-2xl shadow-sm border border-gray-50 animate-pulse" />
                    ))}
                </div>
                <div className="h-96 w-full bg-white rounded-3xl shadow-sm border border-gray-50 animate-pulse" />
            </div>
        </div>
    </div>
);

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading && !user) {
        return <LoadingSkeleton />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const handleSidebarToggle = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const filteredMenu = menuData.filter(item => 
        !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <div className="flex h-screen bg-[#f5f7ff] relative overflow-hidden">
            {/* Sidebar for desktop */}
            <div className="hidden lg:block h-full">
                <SideBar 
                    menu={filteredMenu} 
                    isCollapsed={isSidebarCollapsed} 
                    isOpen={true}
                    onExpand={() => setIsSidebarCollapsed(false)}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Mobile Sidebar */}
            <div className={cn(
                "lg:hidden fixed inset-0 z-50 transition-transform duration-300",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SideBar 
                    menu={filteredMenu} 
                    isCollapsed={false} 
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>

            {/* Main Content Area */}
            <div
                className={cn(
                    "flex-1 flex flex-col transition-all duration-300 min-w-0 pr-2",
                    isSidebarCollapsed ? "lg:ml-28" : "lg:ml-88"
                )}
            >
                {/* Header */}
                <TopHeader
                    onSidebarToggle={handleSidebarToggle}
                    isSidebarCollapsed={isSidebarCollapsed}
                    username={user ? `${user.firstName} ${user.lastName}` : "User"}
                    role={user?.role === "ORG_ADMIN" ? "Admin" : "Employee"}
                />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
