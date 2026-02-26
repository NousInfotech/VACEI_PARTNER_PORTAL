import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import AlertMessage from "../common/AlertMessage";
import { Button } from "../../ui/Button";
import { useAuth } from "../../context/auth-context-core";

export default function VerifyMFA() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { verifyMfa } = useAuth();

    const email = searchParams.get("email") || "";
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; variant: "success" | "error" | "warning" | "info" } | null>(null);

    useEffect(() => {
        if (!email) {
            navigate("/login");
        }
    }, [email, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 6) {
            setAlertMessage({ message: "Please enter a valid 6-digit code.", variant: "error" });
            return;
        }
        setLoading(true);
        setAlertMessage(null);

        try {
            const response = await verifyMfa(email, otp);
            if (response.success) {
                setAlertMessage({ message: "Verification successful! Redirecting...", variant: "success" });
                setTimeout(() => {
                    navigate("/dashboard");
                }, 1500);
            } else {
                setAlertMessage({ message: response.message || "Invalid or expired code.", variant: "error" });
            }
        } catch (error) {
            console.error("MFA Error:", error);
            setAlertMessage({ message: "An error occurred. Please try again.", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-primary">
                <div className="relative z-10 flex items-center justify-center h-full p-12">
                     <div className="text-center space-y-8 max-w-lg text-white">
                         <ShieldCheck className="w-24 h-24 mx-auto opacity-80" />
                         <h1 className="text-4xl font-bold">Secure Your Account</h1>
                         <p className="text-xl opacity-80">
                             Multi-factor authentication adds an extra layer of security to your organizational data.
                         </p>
                     </div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16 bg-white">
                <div className="relative w-full max-w-md space-y-8">
                    {alertMessage && (
                        <AlertMessage
                            message={alertMessage.message}
                            variant={alertMessage.variant === "error" ? "danger" : alertMessage.variant}
                            onClose={() => setAlertMessage(null)}
                        />
                    )}

                    <div className="space-y-6">
                        <button 
                            onClick={() => navigate("/login")}
                            className="flex items-center text-gray-500 hover:text-primary transition-colors font-medium"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to login
                        </button>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-dark">Verify Your Identity</h1>
                            <p className="text-gray-500">
                                We've sent a 6-digit verification code to <span className="font-bold text-dark">{email}</span>.
                            </p>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-2xl shadow-lg p-8 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-dark">Verification Code</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                        placeholder="000000"
                                        className="h-12 pl-12 pr-4 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-2xl tracking-[0.5em] font-bold text-center"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-lg font-semibold"
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify Code"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
