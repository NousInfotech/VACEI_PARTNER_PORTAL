import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import SideBar from "./SideBar";
import TopHeader from "./TopHeader";
import { menuData } from "../lib/menuData";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f5f7ff]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
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
