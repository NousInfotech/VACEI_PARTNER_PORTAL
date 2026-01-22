import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, CheckCircle, Users } from "lucide-react";
import AlertMessage from "../common/AlertMessage";
import { Button } from "../../ui/Button";
import { useAuth } from "../../context/auth-context-core";

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; variant: "success" | "error" | "warning" | "info" } | null>(null);

    useEffect(() => {
        const message = searchParams.get("message");
        if (message) {
            setAlertMessage({ message: decodeURIComponent(message), variant: "info" });
        }
    }, [searchParams]);

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!email) {
            newErrors.email = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Enter a valid email.";
        }
        if (!password) {
            newErrors.password = "Password is required.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setAlertMessage(null);

        try {
            const response = await login(email, password);
            
            if (response.success) {
                setAlertMessage({ message: response.message || "Login successful! Redirecting...", variant: "success" });
                
                setTimeout(() => {
                    navigate("/dashboard");
                }, 1500);
            } else {
                const errorMessage = response.message || "Invalid email or password";
                setErrors({ email: errorMessage, password: "" });
                setAlertMessage({ message: errorMessage, variant: "error" });
            }
        } catch (error) {
            console.error("Login error:", error);
            const errorMessage = (error as Error).message || "Invalid email or password";
            setErrors({ email: errorMessage, password: "" });
            setAlertMessage({ message: errorMessage, variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Sidebar - Dark Theme */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-primary">
                <div className="relative z-10 flex items-center justify-center h-full p-12">
                    <div className="text-center space-y-8 max-w-lg text-white">
                        <div className="flex items-center justify-center space-x-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/30 bg-white/20">
                                <span className="text-3xl font-bold">V</span>
                            </div>
                            <div className="text-left">
                                <span className="text-3xl font-bold block">Vacei</span>
                                <span className="text-xs font-medium uppercase tracking-wider opacity-70 block">ORGANIZATION PORTAL</span>
                            </div>
                        </div>

                        <h1 className="text-4xl font-bold leading-tight">
                            Manage your organization{" "}
                            <span className="block opacity-90">
                                with full transparency
                            </span>
                        </h1>

                        <p className="text-xl leading-relaxed opacity-80">
                            The centralized platform for managing documents, compliance, and multi-entity services seamlessly.
                        </p>

                        <div className="grid grid-cols-1 gap-4 mt-12">
                            <div className="rounded-2xl p-4 border border-white/20 bg-white/10">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
                                        <CheckCircle className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Integrated Workflows</h3>
                                        <p className="text-sm opacity-80">Streamline your business operations across departments.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl p-4 border border-white/20 bg-white/10">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Team Collaboration</h3>
                                        <p className="text-sm opacity-80">Connect with your stakeholders and advisors in real-time.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section - Light Theme */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16 bg-white">
                <div className="relative w-full max-w-md space-y-8">
                    {alertMessage && (
                        <AlertMessage
                            message={alertMessage.message}
                            variant={alertMessage.variant === "error" ? "danger" : alertMessage.variant}
                            onClose={() => setAlertMessage(null)}
                        />
                    )}

                    <div className="space-y-6 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start space-x-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary">
                                <span className="text-xl font-bold text-white">V</span>
                            </div>
                            <div>
                                <span className="text-2xl font-bold block text-dark">Vacei</span>
                                <span className="text-xs font-medium uppercase tracking-wider opacity-70 text-gray-500">ORGANIZATION PORTAL</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold leading-tight text-dark">Welcome back</h1>
                            <p className="text-lg text-gray-500">
                                Sign in to your portal to manage your organizational data and compliance.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="border border-gray-200 rounded-2xl shadow-lg p-8 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {errors.email && !errors.password && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-800 font-medium">{errors.email}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label htmlFor="email" className="text-sm font-medium text-dark">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="h-12 pl-12 pr-4 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark"
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-sm">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label htmlFor="password" className="text-sm font-medium text-dark">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="h-12 pl-12 pr-12 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-sm">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end">
                                <Link 
                                    to="/forgot-password" 
                                    className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 mt-2 rounded-lg font-semibold text-base"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Logging in...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <Lock className="mr-2 h-5 w-5" />
                                        Sign In
                                    </span>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}