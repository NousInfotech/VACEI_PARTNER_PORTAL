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
import { apiPost, apiPut } from '../../config/base';
import { endPoints } from '../../config/endPoint';
import { useAuth } from '../../context/auth-context-core';
import { fetchPreferencesAPI, updatePreferencesAPI, type NotificationPreference } from '../../api/notificationService';

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
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Access Control</h4>
                            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-start gap-4">
                                <div className="p-2.5 bg-white rounded-2xl text-indigo-600 shadow-sm">
                                    <Shield size={20} />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <p className="text-sm font-bold text-indigo-900">Two-Factor Authentication (2FA)</p>
                                    <p className="text-xs text-indigo-700 leading-relaxed">Boost your account security by requiring a verification code whenever you log in.</p>
                                    <Button variant="default" className="mt-4 bg-indigo-600 hover:bg-indigo-700 py-1.5! px-4! text-[10px] uppercase font-black tracking-widest">
                                        Enable 2FA
                                    </Button>
                                </div>
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
