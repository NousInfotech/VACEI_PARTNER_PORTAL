import { useState, useEffect } from 'react';
import { 
    notificationService, 
    type NotificationPreference 
} from '../../api/notificationService';
import { ShadowCard } from '../../ui/ShadowCard';
import { Button } from '../../ui/Button';
import { Bell, Mail, AppWindow, Speaker, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettings() {
    const [notifications, setNotifications] = useState<NotificationPreference>({
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
        soundEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadPrefs = async () => {
            try {
                const prefs = await notificationService.getPreferences();
                const data = (prefs as any).data || prefs;
                setNotifications(data);
            } catch (err) {
                console.error("Failed to load notification preferences", err);
            } finally {
                setLoading(false);
            }
        };
        loadPrefs();
    }, []);

    const togglePreference = (key: keyof NotificationPreference) => {
        setNotifications((prev: NotificationPreference) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await notificationService.updatePreferences(notifications);
            toast.success("Notification preferences updated successfully");
        } catch (err) {
            console.error("Failed to update preferences", err);
            toast.error("Failed to update notification preferences");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Loading preferences...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <ShadowCard className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Email Notifications</h3>
                            <p className="text-sm text-gray-500 mt-1">Receive important updates via email</p>
                            <div className="mt-4 flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="emailEnabled"
                                    checked={notifications.emailEnabled} 
                                    onChange={() => togglePreference('emailEnabled')}
                                    className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary"
                                />
                                <label htmlFor="emailEnabled" className="text-sm font-bold text-gray-700">Enabled</label>
                            </div>
                        </div>
                    </div>
                </ShadowCard>

                <ShadowCard className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-50 rounded-2xl">
                            <AppWindow className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">In-App Notifications</h3>
                            <p className="text-sm text-gray-500 mt-1">Real-time alerts while using the platform</p>
                            <div className="mt-4 flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="inAppEnabled"
                                    checked={notifications.inAppEnabled} 
                                    onChange={() => togglePreference('inAppEnabled')}
                                    className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary"
                                />
                                <label htmlFor="inAppEnabled" className="text-sm font-bold text-gray-700">Enabled</label>
                            </div>
                        </div>
                    </div>
                </ShadowCard>

                <ShadowCard className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-50 rounded-2xl">
                            <Bell className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Push Notifications</h3>
                            <p className="text-sm text-gray-500 mt-1">Get notified on your mobile or desktop</p>
                            <div className="mt-4 flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="pushEnabled"
                                    checked={notifications.pushEnabled} 
                                    onChange={() => togglePreference('pushEnabled')}
                                    className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary"
                                />
                                <label htmlFor="pushEnabled" className="text-sm font-bold text-gray-700">Enabled</label>
                            </div>
                        </div>
                    </div>
                </ShadowCard>

                <ShadowCard className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-orange-50 rounded-2xl">
                            <Speaker className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Notification Sounds</h3>
                            <p className="text-sm text-gray-500 mt-1">Play a sound when a notification arrives</p>
                            <div className="mt-4 flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="soundEnabled"
                                    checked={notifications.soundEnabled} 
                                    onChange={() => togglePreference('soundEnabled')}
                                    className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary"
                                />
                                <label htmlFor="soundEnabled" className="text-sm font-bold text-gray-700">Enabled</label>
                            </div>
                        </div>
                    </div>
                </ShadowCard>
            </div>

            <div className="flex justify-end pt-4">
                <Button 
                    className="rounded-2xl px-8 h-12 shadow-lg hover:shadow-xl transition-all"
                    onClick={handleSave}
                    disabled={saving}
                >
                    <Save className="h-5 w-5 mr-2" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>
        </div>
    );
}
