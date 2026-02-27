import React from 'react';
import PageHeader from './PageHeader';

import { 
    Settings as SettingsIcon,
    User, 
    Bell, 
    Lock, 
    Palette, 
    Globe, 
    Mail, 
    Smartphone, 
    Shield, 
    Save,
    Camera,
    CheckCircle2
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { ShadowCard } from '../../ui/ShadowCard';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiPatch } from '../../config/base';
import { endPoints } from '../../config/endPoint';
import { useAuth } from '../../context/auth-context-core';
import { fetchPreferencesAPI, updatePreferencesAPI, type NotificationPreference } from '../../api/notificationService';

type MfaMethod = 'none' | 'email' | 'totp' | 'webauthn';

function bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function toPublicKeyCreationOptions(options: Record<string, unknown>): CredentialCreationOptions {
    const o: any = options;
    const challenge = base64UrlToBuffer(o.challenge);
    const userId = base64UrlToBuffer(o.user.id);
    const excludeCredentials = o.excludeCredentials?.map((cred: any) => ({
        ...cred,
        id: base64UrlToBuffer(cred.id),
    }));

    return {
        publicKey: {
            ...o,
            challenge,
            user: {
                ...o.user,
                id: userId,
            },
            excludeCredentials,
        },
    };
}

const Settings: React.FC = () => {
    const { user, checkAuth } = useAuth();
    const [activeTab, setActiveTab] = React.useState('profile');
    const [isSaving, setIsSaving] = React.useState(false);

    const [profileData, setProfileData] = React.useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
    });

    React.useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
            });
        }
    }, [user]);

    const [notifications, setNotifications] = React.useState<NotificationPreference>({
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
        soundEnabled: true,
    });

    React.useEffect(() => {
        const loadPrefs = async () => {
            try {
                const prefs = await fetchPreferencesAPI();
                setNotifications(prefs);
            } catch (err) {
                console.error("Failed to load notification preferences", err);
            }
        };
        loadPrefs();
    }, []);

    const togglePreference = async (key: keyof NotificationPreference) => {
        const newValue = !notifications[key];
        setNotifications(prev => ({ ...prev, [key]: newValue }));
        try {
            await updatePreferencesAPI({ [key]: newValue });
        } catch (err) {
            console.error("Failed to update preference", err);
            setNotifications(prev => ({ ...prev, [key]: !newValue }));
            toast.error('Failed to update preference');
        }
    };

    const [mfaMethod, setMfaMethod] = React.useState<MfaMethod>('none');
    const [mfaLoading, setMfaLoading] = React.useState(false);
    const [totpOtpauthUrl, setTotpOtpauthUrl] = React.useState<string | null>(null);
    const [totpCode, setTotpCode] = React.useState('');
    const [totpVerifying, setTotpVerifying] = React.useState(false);
    const [totpConfigured, setTotpConfigured] = React.useState(false);
    const [webauthnRegistering, setWebauthnRegistering] = React.useState(false);

    React.useEffect(() => {
        const loadMfa = async () => {
            try {
                const res = await apiGet<{ data?: { mfaEnabled: boolean; mfaMethod: 'email' | 'totp' | 'webauthn' | null } }>(
                    endPoints.AUTH.MFA_PREFERENCES
                );
                const payload = (res as any).data || res;
                const enabled = Boolean(payload.mfaEnabled);
                const method = payload.mfaMethod as 'email' | 'totp' | 'webauthn' | null;
                if (!enabled || !method) {
                    setMfaMethod('none');
                    setTotpConfigured(false);
                } else if (method === 'email') {
                    setMfaMethod('email');
                    setTotpConfigured(false);
                } else if (method === 'totp') {
                    setMfaMethod('totp');
                    setTotpConfigured(true);
                } else if (method === 'webauthn') {
                    setMfaMethod('webauthn');
                    setTotpConfigured(false);
                }
            } catch (err) {
                console.error('Failed to load MFA preferences', err);
            }
        };
        loadMfa();
    }, []);

    const updateMfaPreference = async (method: MfaMethod) => {
        setMfaLoading(true);
        try {
            await apiPatch(endPoints.AUTH.MFA_PREFERENCES, { method });
            setMfaMethod(method);
            const message =
                method === 'none'
                    ? 'Multi-factor authentication disabled'
                    : method === 'email'
                    ? 'Email-based MFA enabled'
                    : method === 'totp'
                    ? 'Authenticator app MFA enabled'
                    : 'Device passkey MFA enabled';
            toast.success(message);
        } catch (error: any) {
            console.error('Failed to update MFA preferences', error);
            toast.error(error?.response?.data?.message || error?.message || 'Failed to update MFA settings');
        } finally {
            setMfaLoading(false);
        }
    };

    const startTotpSetup = async () => {
        setMfaLoading(true);
        try {
            const res = await apiPost<{ data?: { otpauthUrl: string } }>(endPoints.AUTH.MFA_SETUP_TOTP, {});
            const payload = (res as any).data || res;
            if (!payload?.otpauthUrl) {
                throw new Error('Missing otpauth URL from server');
            }
            setTotpOtpauthUrl(payload.otpauthUrl);
            setTotpConfigured(false);
            setMfaMethod('totp');
            toast.success('Scan the QR code with your authenticator app and enter the 6-digit code to confirm.');
        } catch (error: any) {
            console.error('Failed to start TOTP setup', error);
            toast.error(error?.response?.data?.message || error?.message || 'Failed to start authenticator-app setup');
        } finally {
            setMfaLoading(false);
        }
    };

    const verifyTotpSetup = async () => {
        if (totpCode.trim().length < 6) {
            toast.error('Please enter a valid 6-digit code from your authenticator app');
            return;
        }
        setTotpVerifying(true);
        try {
            await apiPost(endPoints.AUTH.MFA_VERIFY_TOTP_SETUP, { otp: totpCode });
            setTotpCode('');
            setTotpOtpauthUrl(null);
            setTotpConfigured(true);
            toast.success('Authenticator app MFA enabled for your account');
            setMfaMethod('totp');
        } catch (error: any) {
            console.error('Failed to verify TOTP setup', error);
            toast.error(error?.response?.data?.message || error?.message || 'Failed to verify authenticator code');
        } finally {
            setTotpVerifying(false);
        }
    };

    const startWebauthnRegistration = async () => {
        if (typeof window === 'undefined' || typeof navigator === 'undefined' || !(window as any).PublicKeyCredential) {
            toast.error('Your browser does not support passkeys / WebAuthn.');
            return;
        }
        setWebauthnRegistering(true);
        try {
            const res = await apiPost<{ data?: { options: Record<string, unknown> } }>(
                endPoints.AUTH.MFA_WEBAUTHN_REGISTER_CHALLENGE,
                {}
            );
            const payload = (res as any).data || res;
            const options = payload.options as Record<string, unknown> | undefined;
            if (!options) throw new Error('Missing WebAuthn registration options from server');

            const cred = await navigator.credentials.create(toPublicKeyCreationOptions(options));
            if (!cred || cred.type !== 'public-key') {
                throw new Error('Registration was cancelled or failed.');
            }

            const publicKeyCred = cred as PublicKeyCredential;
            const attestation = publicKeyCred.response as AuthenticatorAttestationResponse;

            const webauthnResponse = {
                id: publicKeyCred.id,
                rawId: bufferToBase64Url(publicKeyCred.rawId),
                type: publicKeyCred.type,
                response: {
                    clientDataJSON: bufferToBase64Url(attestation.clientDataJSON),
                    attestationObject: bufferToBase64Url(attestation.attestationObject),
                },
                clientExtensionResults:
                    (publicKeyCred as any).getClientExtensionResults?.() ?? {},
            };

            await apiPost(endPoints.AUTH.MFA_WEBAUTHN_REGISTER_VERIFY, { response: webauthnResponse });
            await updateMfaPreference('webauthn');
            toast.success('Device passkey / biometric MFA registered for your account.');
        } catch (error: any) {
            console.error('WebAuthn registration failed', error);
            toast.error(error?.response?.data?.message || error?.message || 'Failed to register device passkey.');
        } finally {
            setWebauthnRegistering(false);
        }
    };
    
    const [passwords, setPasswords] = React.useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (activeTab === 'security') {
            if (!passwords.currentPassword || !passwords.newPassword) {
                toast.error('Please enter both current and new passwords to change security settings');
                return;
            }
            if (passwords.newPassword !== passwords.confirmNewPassword) {
                toast.error('New passwords do not match');
                return;
            }
            setIsSaving(true);
            try {
                await apiPost(endPoints.AUTH.CHANGE_PASSWORD, {
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                });
                toast.success('Password updated successfully', {
                    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                });
                setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            } catch (error: any) {
                toast.error(error?.response?.data?.message || error?.message || 'Failed to update password');
            } finally {
                setIsSaving(false);
            }
        } else if (activeTab === 'profile') {
            if (!profileData.firstName || !profileData.lastName) {
                toast.error('First name and last name are required');
                return;
            }
            setIsSaving(true);
            try {
                // We use put here for updating the profile
                await apiPut(endPoints.AUTH.ME.replace('GET', 'PUT') || '/auth/me', profileData);
                toast.success('Profile updated successfully', {
                    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                });
                if (checkAuth) await checkAuth();
            } catch (error: any) {
                toast.error(error?.response?.data?.message || error?.message || 'Failed to update profile');
            } finally {
                setIsSaving(false);
            }
        } else {
            setIsSaving(true);
            setTimeout(() => {
                setIsSaving(false);
                toast.success('Settings saved successfully', {
                    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                });
            }, 1000);
        }
    };

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'branding', label: 'Portal Branding', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <section className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all overflow-hidden">
                                        <User className="w-10 h-10 text-primary" />
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-110 transition-transform">
                                        <Camera size={14} />
                                    </button>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900">{user?.firstName} {user?.lastName}</h4>
                                    <p className="text-sm text-gray-500">{user?.role?.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">First Name</label>
                                    <input type="text" value={profileData.firstName} onChange={e => setProfileData(p => ({ ...p, firstName: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Last Name</label>
                                    <input type="text" value={profileData.lastName} onChange={e => setProfileData(p => ({ ...p, lastName: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm" />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                                    <input type="email" defaultValue={user?.email || ""} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm text-gray-500" />
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case 'branding':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <section className="space-y-6">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Visual Identity</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Portal Name</label>
                                        <input type="text" defaultValue="Organization Portal" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Primary Color</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-primary shadow-inner border border-white/20" />
                                            <input type="text" defaultValue="#4f46e5" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-xs" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Organization Logo</label>
                                    <div className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-primary/40 transition-all cursor-pointer">
                                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                            <Globe className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 uppercase tracking-widest">Upload SVG or PNG</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <section className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Delivery Channels</h4>
                            {[
                                { title: 'Email Notifications', desc: 'System updates and critical alerts', icon: Mail, key: 'emailEnabled' as const },
                                { title: 'In-App Notifications', desc: 'Real-time alerts while using the portal', icon: Bell, key: 'inAppEnabled' as const },
                                { title: 'Push Notifications', desc: 'Real-time browser notifications', icon: Smartphone, key: 'pushEnabled' as const },
                                { title: 'Sound Notifications', desc: 'Alert sounds for updates', icon: Bell, key: 'soundEnabled' as const },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100/80 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-white rounded-xl text-gray-400 group-hover:text-primary transition-colors shadow-sm">
                                            <item.icon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{item.title}</p>
                                            <p className="text-[11px] text-gray-500">{item.desc}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={Boolean(notifications[item.key])} onChange={() => togglePreference(item.key)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                                    </label>
                                </div>
                            ))}
                        </section>
                    </div>
                );
            case 'security':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <section className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">
                                Access Control
                            </h4>
                            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-white rounded-2xl text-indigo-600 shadow-sm">
                                        <Shield size={20} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <p className="text-sm font-bold text-indigo-900">Multi-Factor Authentication (MFA)</p>
                                        <p className="text-xs text-indigo-700 leading-relaxed">
                                            Choose how you want to approve logins. For strongest security, use an authenticator app.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    <label className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-indigo-100 cursor-pointer hover:border-indigo-300">
                                        <input
                                            type="radio"
                                            className="text-indigo-600"
                                            checked={mfaMethod === 'none'}
                                            onChange={() => updateMfaPreference('none')}
                                            disabled={mfaLoading}
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-900">Disabled</p>
                                            <p className="text-[11px] text-gray-500">Use password only (not recommended).</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-indigo-100 cursor-pointer hover:border-indigo-300">
                                        <input
                                            type="radio"
                                            className="text-indigo-600"
                                            checked={mfaMethod === 'email'}
                                            onChange={() => updateMfaPreference('email')}
                                            disabled={mfaLoading}
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-900">Email code</p>
                                            <p className="text-[11px] text-gray-500">Send a 6-digit code to your email.</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-indigo-100 cursor-pointer hover:border-indigo-300 md:col-span-2">
                                        <input
                                            type="radio"
                                            className="text-indigo-600"
                                            checked={mfaMethod === 'totp'}
                                            onChange={() => {
                                                // Selecting will show setup UI; full enable after verification
                                                setMfaMethod('totp');
                                            }}
                                            disabled={mfaLoading}
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">Authenticator app (recommended)</p>
                                            <p className="text-[11px] text-gray-500">
                                                Use apps like Google Authenticator, 1Password, or Authy.
                                            </p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-indigo-100 cursor-pointer hover:border-indigo-300 md:col-span-2">
                                        <input
                                            type="radio"
                                            className="text-indigo-600"
                                            checked={mfaMethod === 'webauthn'}
                                            onChange={() => setMfaMethod('webauthn')}
                                            disabled={mfaLoading}
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">Device passkey / biometric</p>
                                            <p className="text-[11px] text-gray-500">
                                                Use your laptop or phone&apos;s built-in security (Face ID, Touch ID, Windows Hello, etc.).
                                            </p>
                                        </div>
                                    </label>
                                </div>
                                {mfaMethod === 'totp' && (
                                    <div className="mt-2 space-y-3 rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-4">
                                        {totpConfigured && !totpOtpauthUrl ? (
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div className="space-y-1 text-xs text-gray-700">
                                                    <p className="font-semibold text-gray-900">Authenticator app is enabled</p>
                                                    <p>
                                                        Use your authenticator app code whenever you sign in. If you need to move to a new
                                                        device, you can reconfigure it – this will generate a new QR code and invalidate the
                                                        old one.
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-[11px] font-black tracking-widest uppercase"
                                                    onClick={startTotpSetup}
                                                    disabled={mfaLoading}
                                                >
                                                    {mfaLoading ? 'Preparing…' : 'Reconfigure app'}
                                                </Button>
                                            </div>
                                        ) : !totpOtpauthUrl ? (
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <p className="text-[11px] text-gray-700">
                                                    Start authenticator-app setup to generate a QR code and secret for your device.
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black tracking-widest uppercase"
                                                    onClick={startTotpSetup}
                                                    disabled={mfaLoading}
                                                >
                                                    {mfaLoading ? 'Starting…' : 'Start setup'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col sm:flex-row gap-4 items-center">
                                                    <div className="shrink-0">
                                                        <img
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                                                totpOtpauthUrl
                                                            )}`}
                                                            alt="MFA QR code"
                                                            className="rounded-xl border border-indigo-100 bg-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2 text-xs text-gray-700">
                                                        <p className="font-semibold text-gray-900">Scan this QR code</p>
                                                        <p>
                                                            Open your authenticator app, add a new account, and scan the QR code. If you can&apos;t
                                                            scan, you can paste this key manually:
                                                        </p>
                                                        <code className="block break-all rounded-md bg-gray-50 px-2 py-1 text-[11px] border border-gray-200">
                                                            {totpOtpauthUrl}
                                                        </code>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-semibold text-gray-800">
                                                        Enter the 6-digit code from your app
                                                    </label>
                                                    <div className="flex gap-2 items-center">
                                                        <input
                                                            type="text"
                                                            maxLength={6}
                                                            value={totpCode}
                                                            onChange={(e) =>
                                                                setTotpCode(e.target.value.replace(/[^0-9]/g, ''))
                                                            }
                                                            className="h-10 w-32 rounded-lg border border-gray-200 px-3 text-center tracking-[0.3em] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                            placeholder="000000"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black tracking-widest uppercase"
                                                            onClick={verifyTotpSetup}
                                                            disabled={totpVerifying}
                                                        >
                                                            {totpVerifying ? 'Verifying…' : 'Verify & enable'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                                {mfaMethod === 'webauthn' && (
                                    <div className="mt-2 space-y-3 rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-4">
                                        <p className="text-[11px] text-gray-700">
                                            Register a passkey on this device. On supported browsers, this lets you sign in with your
                                            fingerprint, face, or device PIN instead of typing codes.
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black tracking-widest uppercase"
                                            onClick={startWebauthnRegistration}
                                            disabled={webauthnRegistering}
                                        >
                                            {webauthnRegistering ? 'Registering…' : 'Register this device'}
                                        </Button>
                                        <p className="text-[10px] text-gray-500">
                                            Note: Passkeys are stored per device and browser. Repeat this on each device you want to use.
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-6 border border-gray-100 rounded-3xl space-y-4">
                                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Lock size={16} className="text-gray-400" /> Change Password
                                </p>
                                <div className="grid grid-cols-1 gap-4">
                                    <input name="currentPassword" type="password" placeholder="Current Password" value={passwords.currentPassword} onChange={handlePasswordChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 text-sm" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="newPassword" type="password" placeholder="New Password" value={passwords.newPassword} onChange={handlePasswordChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 text-sm" />
                                        <input name="confirmNewPassword" type="password" placeholder="Confirm New Password" value={passwords.confirmNewPassword} onChange={handlePasswordChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8 mx-auto pb-10">
            <PageHeader 
                title="Settings"
                icon={SettingsIcon}
                description="Manage your account preferences, portal branding, and system configurations."
                actions={
                    <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        variant='header'
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        <span className="tracking-tight">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </Button>
                }
            />

            <div className="flex flex-col lg:flex-row items-stretch gap-8 min-h-[600px]">
                {/* Sidebar Navigation */}
                <aside className="lg:w-72 shrink-0 flex">
                    <div className="bg-white border border-gray-100 rounded-[32px] p-3 space-y-1 shadow-sm flex-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all group ${
                                    activeTab === tab.id 
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'} />
                                <span className={`text-sm font-bold tracking-tight ${activeTab === tab.id ? 'translate-x-1' : ''} transition-transform`}>
                                    {tab.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 flex">
                    <ShadowCard className="bg-white border border-gray-50 rounded-[40px] p-10 shadow-xl shadow-gray-200/50 flex-1">
                        {renderContent()}
                    </ShadowCard>
                </main>
            </div>
        </div>
    );
};

export default Settings;
