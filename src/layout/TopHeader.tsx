import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { PanelLeft, PanelLeftClose, Search, Bell, LogOut, Settings } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../context/auth-context-core";
import { Select } from "../ui/Select";

interface TopHeaderProps {
    onSidebarToggle: () => void;
    isSidebarCollapsed: boolean;
    username: string;
    role: string;
}

export default function TopHeader({ 
    onSidebarToggle, 
    isSidebarCollapsed,
    username,
    role
}: TopHeaderProps) {
    const navigate = useNavigate();
    const { logout, organizationMember, selectedService, setSelectedService } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const services = useMemo(() => {
        return (organizationMember?.allowedServices || []).map(service => ({
            id: service,
            label: service.replace(/_/g, " "),
            onClick: () => setSelectedService(service)
        }));
    }, [organizationMember?.allowedServices, setSelectedService]);

    return (
        <header 
            className="h-16 backdrop-blur-xl border flex items-center justify-between px-6 sticky top-0 z-40 rounded-4xl m-2 mb-0 bg-white/80 shadow-lg border-gray-200"
        >
            <div className="flex items-center gap-4">
                <button
                    className="p-2 rounded-2xl hover:bg-gray-100 transition-colors group"
                    onClick={onSidebarToggle}
                >
                    {isSidebarCollapsed ? (
                        <PanelLeft className="h-5 w-5 text-gray-700" />
                    ) : (
                        <PanelLeftClose className="h-5 w-5 text-gray-700" />
                    )}
                </button>

                <div className="flex items-center gap-2 w-64">
                    <div className="relative flex w-full">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-gray-50 text-gray-900 border border-gray-200 border-r-0 placeholder-gray-500 rounded-l-lg focus:outline-none w-full h-[37px] ps-4 text-sm"
                        />
                        <Button
                            className="h-[37px] rounded-l-none px-3"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {organizationMember && (
                    <div className="flex items-center gap-2 ml-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">Service:</p>
                        <div className="relative group">
                            <Select 
                                label={selectedService?.replace(/_/g, " ") || "Select Service"}
                                items={services}
                                className="w-auto"
                                contentClassName="w-64"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl relative">
                    <Bell className="h-5 w-5 text-gray-700" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </Button>

                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                    <Settings className="h-5 w-5 text-gray-700" />
                </Button>

                <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                    <div className="hidden sm:block text-right">
                        <p className="text-sm font-bold text-gray-900 leading-tight">{username}</p>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">{role}</p>
                    </div>

                    <div className="relative group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-white shadow-lg">
                            <span className="text-sm font-medium">{username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
