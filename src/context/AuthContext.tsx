import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { apiPost, apiGet } from "../config/base";
import { endPoints } from "../config/endPoint";
import { type User, type OrganizationMember, type AuthMeResponse, type LoginResponse, AVAILABLE_SERVICES } from "../lib/types";
import { AuthContext } from "./auth-context-core";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem("user");
            if (!saved || saved === "undefined" || saved === "null") return null;
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse user from localStorage:", e);
            return null;
        }
    });
    const [organizationMember, setOrganizationMember] = useState<OrganizationMember | null>(() => {
        try {
            const saved = localStorage.getItem("organizationMember");
            if (!saved || saved === "undefined" || saved === "null") return null;
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse organizationMember from localStorage:", e);
            return null;
        }
    });
    const [selectedService, setSelectedServiceState] = useState<string | null>(() => {
        return localStorage.getItem("selectedService");
    });
    const [isLoading, setIsLoading] = useState(true);

    const setSelectedService = useCallback((service: string) => {
        setSelectedServiceState(service);
        localStorage.setItem("selectedService", service);
    }, []);

    const selectedServiceLabel = useMemo(() => {
        if (!selectedService) return "Select Service";
        
        // Check standard services first
        const standardService = AVAILABLE_SERVICES.find(s => s.id === selectedService);
        if (standardService) return standardService.label;

        // Check custom services in organizationMember
        const customService = organizationMember?.allowedCustomServiceCycles?.find(c => c.id === selectedService);
        if (customService) return customService.title;

        // Fallback to formatted ID
        return selectedService.replace(/_/g, " ");
    }, [selectedService, organizationMember]);

    const handleLogoutState = useCallback(() => {
        setUser(null);
        setOrganizationMember(null);
        setSelectedServiceState(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
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
                // Backend may return flat user object or nested for /auth/me
                const responseData = response.data;
                const userData = (responseData.user || (responseData.id ? responseData : null)) as User | null;
                let memberData = responseData.organizationMember || null;
                const refreshToken = responseData.refreshToken;
                
                if (userData) {
                    if (userData.role !== "ORG_ADMIN" && userData.role !== "ORG_EMPLOYEE") {
                        handleLogoutState();
                        return;
                    }

                    setUser(userData);
                    if (refreshToken) {
                        localStorage.setItem("refreshToken", refreshToken);
                    }
                    
                    // Fallback to localStorage for organizationMember if not provided by /auth/me
                    if (!memberData) {
                        const savedMember = localStorage.getItem("organizationMember");
                        if (savedMember && savedMember !== "undefined" && savedMember !== "null") {
                            try {
                                memberData = JSON.parse(savedMember);
                            } catch (e) {
                                console.error("Failed to parse cached organizationMember:", e);
                            }
                        }
                    }
                    
                    setOrganizationMember(memberData);
                    
                    const savedService = localStorage.getItem("selectedService");
                    const isServiceAllowed = memberData && savedService && (
                        memberData.allowedServices?.includes(savedService) || 
                        memberData.allowedCustomServiceCycles?.some(c => c.id === savedService)
                    );

                    if (isServiceAllowed) {
                        setSelectedServiceState(savedService as string);
                    } else if (memberData) {
                        if (memberData.allowedServices && memberData.allowedServices.length > 0) {
                            setSelectedService(memberData.allowedServices[0]);
                        } else if (memberData.allowedCustomServiceCycles && memberData.allowedCustomServiceCycles.length > 0) {
                            setSelectedService(memberData.allowedCustomServiceCycles[0].id);
                        }
                    }

                    localStorage.setItem("user", JSON.stringify(userData));
                    if (memberData) {
                        localStorage.setItem("organizationMember", JSON.stringify(memberData));
                    }
                    localStorage.setItem("userRole", userData.role);
                } else {
                    handleLogoutState();
                }
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            const status = (error as { response?: { status?: number } }).response?.status;
            if (status === 401) {
                handleLogoutState();
            }
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

                // Restrict login to specific roles
                if (userData.role !== 'ORG_ADMIN' && userData.role !== 'ORG_EMPLOYEE') {
                    return { 
                        success: false, 
                        message: "Access Denied: You do not have permission to access this portal." 
                    };
                }

                if (response.data.mfaRequired) {
                    return {
                        success: true,
                        message: response.message || "MFA Required",
                        mfaRequired: true
                    };
                }

                const memberData = response.data.organizationMember;
                const token = response.data.token;
                
                setUser(userData);
                setOrganizationMember(memberData);
                
                if (memberData?.allowedServices && memberData.allowedServices.length > 0) {
                    setSelectedService(memberData.allowedServices[0]);
                } else if (memberData?.allowedCustomServiceCycles && memberData.allowedCustomServiceCycles.length > 0) {
                    setSelectedService(memberData.allowedCustomServiceCycles[0].id);
                }

                localStorage.setItem("user", JSON.stringify(userData));
                if (memberData) {
                    localStorage.setItem("organizationMember", JSON.stringify(memberData));
                }
                if (token) {
                    localStorage.setItem("token", token);
                }
                if (response.data.refreshToken) {
                    localStorage.setItem("refreshToken", response.data.refreshToken);
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

    const verifyMfa = async (email: string, otp: string) => {
        try {
            const response = await apiPost<LoginResponse>(endPoints.AUTH.VERIFY_MFA, { email, otp } as Record<string, unknown>);
            if (response.data) {
                const userData = response.data.user;
                const memberData = response.data.organizationMember;
                const token = response.data.token;

                setUser(userData);
                setOrganizationMember(memberData);
                
                // Set default service
                if (memberData?.allowedServices && memberData.allowedServices.length > 0) {
                    setSelectedService(memberData.allowedServices[0]);
                }

                localStorage.setItem("user", JSON.stringify(userData));
                if (memberData) localStorage.setItem("organizationMember", JSON.stringify(memberData));
                if (token) localStorage.setItem("token", token);
                if (response.data.refreshToken) localStorage.setItem("refreshToken", response.data.refreshToken);
                localStorage.setItem("userRole", userData.role);

                return { success: true, message: "Verification successful!" };
            }
            return { success: false, message: response.message || "Verification failed" };
        } catch (error) {
            console.error("MFA verification failed:", error);
            return { success: false, message: (error as Error).message || "Verification failed" };
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
            selectedServiceLabel,
            setSelectedService, 
            isAuthenticated: !!user, 
            login, 
            verifyMfa,
            logout, 
            isLoading, 
            checkAuth 
        }}>
            {children}
        </AuthContext.Provider>
    );
}


