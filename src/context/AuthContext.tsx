import { useState, useEffect, useCallback, type ReactNode } from "react";
import { apiPost, apiGet } from "../config/base";
import { endPoints } from "../config/endPoint";
import { type User, type OrganizationMember, type AuthMeResponse, type LoginResponse } from "../lib/types";
import { AuthContext } from "./auth-context-core";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [organizationMember, setOrganizationMember] = useState<OrganizationMember | null>(null);
    const [selectedService, setSelectedServiceState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const setSelectedService = useCallback((service: string) => {
        setSelectedServiceState(service);
        localStorage.setItem("selectedService", service);
    }, []);

    const handleLogoutState = useCallback(() => {
        setUser(null);
        setOrganizationMember(null);
        setSelectedServiceState(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("organizationMember");
        localStorage.removeItem("selectedService");
    }, []);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await apiGet<AuthMeResponse>(endPoints.AUTH.ME);
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
    }, [handleLogoutState, setSelectedService]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email: string, password: string) => {
        try {
            const response = await apiPost<LoginResponse>(endPoints.AUTH.LOGIN, { email, password } as Record<string, unknown>);
            
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
        } catch (error) {
            console.error("Login failed:", error);
            const errorMessage = (error as Error).message || "Invalid email or password";
            return { 
                success: false, 
                message: errorMessage 
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


