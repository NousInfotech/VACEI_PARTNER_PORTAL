import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import AlertMessage from "../common/AlertMessage";
import { Button } from "../../ui/Button";
import axios from "axios";

export default function ForgetPassword() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [messageVariant, setMessageVariant] = useState<"success" | "danger">("danger");

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setAlertMessage(null);

    try {
      const response = await axios.post(`${backendUrl}auth/forgot-password`, {
        email,
      });

      setAlertMessage(response.data.data?.message || "If an account with that email exists, a password reset OTP has been sent to your inbox.");
      setMessageVariant("success");
      setEmail("");
      setErrors({});
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "An unknown error occurred. Please try again.";
      setAlertMessage(errorMessage);
      setMessageVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-[1200px] px-8 w-full">
        <section className="flex justify-center">
          <div className="bg-white border border-gray-200 rounded-[16px] shadow-lg p-8 w-full max-w-md">
            {alertMessage && (
              <AlertMessage
                message={alertMessage}
                variant={messageVariant}
                duration={messageVariant === "success" ? 8000 : 4000}
                onClose={() => setAlertMessage(null)}
              />
            )}

            <div className="flex flex-col items-center mb-6">
               <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-primary mb-4">
                  <span className="text-2xl font-bold text-white">V</span>
               </div>
               <h2 className="text-2xl font-bold text-dark">Forgot Password</h2>
            </div>

            <div className="text-center">
              <p className="mb-6 text-gray-500">Enter your email to receive a password reset OTP.</p>

              <form className="flex flex-col gap-4" onSubmit={handleForgotPassword}>
                <div className="space-y-1">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-12 pr-4 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm text-left">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-2 font-semibold"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </div>

            <div className="mt-8 text-center text-sm">
              <Link to="/login" className="inline-flex items-center text-primary font-semibold hover:underline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}