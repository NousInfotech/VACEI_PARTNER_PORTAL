import { createContext, useContext } from "react";
import { type User, type OrganizationMember } from "../lib/types";

export interface AuthContextType {
    user: User | null;
    organizationMember: OrganizationMember | null;
    selectedService: string | null;
    selectedServiceLabel: string;
    setSelectedService: (service: string) => void;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User; token?: string }>;
    logout: () => void;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
