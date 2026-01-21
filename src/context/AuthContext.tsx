import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiPost, apiGet } from "../config/base";
import { endPoints } from "../config/endPoint";

interface Organization {
    id: string;
    name: string;
    type: string;
    status: string;
    availableServices: string[];
}

interface OrganizationMember {
    id: string;
    userId: string;
    organizationId: string;
    role: string;
    allowedServices: string[];
    organization: Organization;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
}

interface AuthContextType {
    user: User | null;
    organizationMember: OrganizationMember | null;
    selectedService: string | null;
    setSelectedService: (service: string) => void;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User; token?: string }>;
    logout: () => void;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [organizationMember, setOrganizationMember] = useState<OrganizationMember | null>(null);
    const [selectedService, setSelectedServiceState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const setSelectedService = (service: string) => {
        setSelectedServiceState(service);
        localStorage.setItem("selectedService", service);
    };

    const checkAuth = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await apiGet<any>(endPoints.AUTH.ME);
            if (response.data) {
                const userData = response.data.user;
                const memberData = response.data.organizationMember;
                
                setUser(userData);
                setOrganizationMember(memberData);
                
                const savedService = localStorage.getItem("selectedService");
                if (savedService && memberData?.allowedServices.includes(savedService)) {
                    setSelectedServiceState(savedService);
                } else if (memberData?.allowedServices?.length > 0) {
                    setSelectedService(memberData.allowedServices[0]);
                }

                localStorage.setItem("user", JSON.stringify(userData));
                localStorage.setItem("organizationMember", JSON.stringify(memberData));
                localStorage.setItem("userRole", userData.role);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            handleLogoutState();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const handleLogoutState = () => {
        setUser(null);
        setOrganizationMember(null);
        setSelectedServiceState(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("organizationMember");
        localStorage.removeItem("selectedService");
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await apiPost<any>(endPoints.AUTH.LOGIN, { email, password });
            
            if (response.data) {
                const userData = response.data.user;
                const memberData = response.data.organizationMember;
                const token = response.data.token;
                
                setUser(userData);
                setOrganizationMember(memberData);
                
                if (memberData?.allowedServices?.length > 0) {
                    setSelectedService(memberData.allowedServices[0]);
                }

                localStorage.setItem("user", JSON.stringify(userData));
                localStorage.setItem("organizationMember", JSON.stringify(memberData));
                if (token) {
                    localStorage.setItem("token", token);
                }
                localStorage.setItem("userRole", userData.role);
                
                return { 
                    success: true, 
                    message: response.message || "Login successful!", 
                    user: userData, 
                    token 
                };
            }
            
            return { success: false, message: response.message || "Login failed" };
        } catch (error: any) {
            console.error("Login failed:", error);
            return { 
                success: false, 
                message: error.message || "Invalid email or password" 
            };
        }
    };

    const logout = async () => {
        try {
            await apiPost(endPoints.AUTH.LOGOUT);
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            handleLogoutState();
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            organizationMember, 
            selectedService, 
            setSelectedService, 
            isAuthenticated: !!user, 
            login, 
            logout, 
            isLoading, 
            checkAuth 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
