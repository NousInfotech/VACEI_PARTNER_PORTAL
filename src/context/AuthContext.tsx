import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { users } from "../data/mockUserData";

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User, token?: string) => void;
    loginMock: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User; token?: string }>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initialize from localStorage on mount
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        
        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse stored user", error);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                localStorage.removeItem("userRole");
            }
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User, token?: string) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        if (token) {
            localStorage.setItem("token", token);
        }
        localStorage.setItem("userRole", userData.role);
    };

    const loginMock = async (email: string, password: string) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const foundUser = users.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
            // Remove password from the user object before storing it in context
            const { password: _, ...userData } = foundUser;
            const token = "mock-jwt-token"; // Placeholder token
            
            login(userData as User, token);
            return { success: true, message: "Login successful!", user: userData as User, token };
        }
        
        return { success: false, message: "Invalid email or password" };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginMock, logout, isLoading }}>
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
