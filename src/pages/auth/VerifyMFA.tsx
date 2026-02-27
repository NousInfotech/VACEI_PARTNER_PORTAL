import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Lock, ArrowLeft, Smartphone, Fingerprint } from "lucide-react";
import AlertMessage from "../common/AlertMessage";
import { Button } from "../../ui/Button";
import { useAuth } from "../../context/auth-context-core";

type MfaMethod = "email" | "totp" | "webauthn";

function bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function toPublicKeyRequestOptions(options: Record<string, unknown>): CredentialRequestOptions {
    const challenge = options.challenge as string;
    const allowCredentials = options.allowCredentials as
        | Array<{ id: string; type: string; transports?: string[] }>
        | undefined;

    return {
        publicKey: {
            challenge: base64UrlToBuffer(challenge),
            timeout: (options.timeout as number) ?? 60000,
            rpId: (options.rpId as string) || undefined,
            // Let the browser decide user verification strategy; fall back to preferred.
            userVerification: (options.userVerification as any) || "preferred",
            allowCredentials: allowCredentials?.map((cred) => ({
                id: base64UrlToBuffer(cred.id),
                type: "public-key" as const,
                transports: cred.transports as AuthenticatorTransport[] | undefined,
            })),
        },
    };
}

export default function VerifyMFA() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { verifyMfa, getWebAuthnLoginChallenge } = useAuth();

    const email = searchParams.get("email") || "";
    const rawMethod = searchParams.get("method")?.toLowerCase();
    const method: MfaMethod =
      rawMethod === "totp" || rawMethod === "webauthn" ? rawMethod : "email";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{
        message: string;
        variant: "success" | "error" | "warning" | "info";
    } | null>(null);

    useEffect(() => {
        if (!email) {
            navigate("/login");
        }
    }, [email, navigate]);

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 6) {
            setAlertMessage({ message: "Please enter a valid 6-digit code.", variant: "error" });
            return;
        }
        setLoading(true);
        setAlertMessage(null);

        try {
            const response = await verifyMfa(email, {
                otp: otp.replace(/\s/g, "").trim(),
                method: method === "totp" ? "totp" : "email",
            });
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

    const handleWebAuthn = async () => {
        setLoading(true);
        setAlertMessage(null);
        try {
            const { options } = await getWebAuthnLoginChallenge(email);
            const cred = await navigator.credentials.get(
                toPublicKeyRequestOptions(options as Record<string, unknown>),
            );

            if (!cred || cred.type !== "public-key") {
                setAlertMessage({ message: "Verification was cancelled or failed.", variant: "error" });
                setLoading(false);
                return;
            }

            const publicKeyCred = cred as PublicKeyCredential;
            const assertion = publicKeyCred.response as AuthenticatorAssertionResponse;

            const webauthnResponse = {
                id: publicKeyCred.id,
                rawId: bufferToBase64Url(publicKeyCred.rawId),
                type: publicKeyCred.type,
                response: {
                    clientDataJSON: bufferToBase64Url(assertion.clientDataJSON),
                    authenticatorData: bufferToBase64Url(assertion.authenticatorData),
                    signature: bufferToBase64Url(assertion.signature),
                    userHandle: assertion.userHandle ? bufferToBase64Url(assertion.userHandle) : undefined,
                },
                clientExtensionResults:
                    (publicKeyCred as unknown as { getClientExtensionResults?: () => Record<string, unknown> }).getClientExtensionResults?.() ?? {},
            };

            const verifyResult = await verifyMfa(email, {
                webauthnResponse,
                method: "webauthn",
            });

            if (verifyResult.success) {
                setAlertMessage({ message: "Verification successful! Redirecting...", variant: "success" });
                setTimeout(() => {
                    navigate("/dashboard");
                }, 1500);
            } else {
                setAlertMessage({ message: verifyResult.message || "Verification failed.", variant: "error" });
            }
        } catch (error) {
            console.error("WebAuthn Error:", error);
            setAlertMessage({
                message: (error as Error).message || "Biometric verification failed. Please try again.",
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const messageCopy =
        method === "email"
            ? (
                <>
                    We've sent a 6-digit verification code to{" "}
                    <span className="font-bold text-dark">{email}</span>.
                </>
            )
            : method === "totp"
                ? "Enter the 6-digit code from your authenticator app."
                : "Use your device fingerprint, face, or security key to sign in.";

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
                            <p className="text-gray-500">{messageCopy}</p>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-2xl shadow-lg p-8 bg-white">
                        {method === "webauthn" ? (
                            <div className="space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Fingerprint className="h-8 w-8 text-primary" />
                                    </div>
                                </div>
                                <p className="text-center text-sm text-gray-500">
                                    When prompted, use your device&apos;s fingerprint, face, or security key to continue.
                                </p>
                                <Button
                                    type="button"
                                    className="w-full h-12 rounded-lg font-semibold"
                                    disabled={loading}
                                    onClick={handleWebAuthn}
                                >
                                    {loading ? "Verifying..." : "Verify with device security"}
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleOtpSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-dark">Verification Code</label>
                                    <div className="relative">
                                        {method === "totp" ? (
                                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        ) : (
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        )}
                                        <input
                                            type="text"
                                            inputMode="numeric"
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
