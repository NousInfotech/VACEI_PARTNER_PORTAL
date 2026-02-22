import PageHeader from './PageHeader';
import NotificationSettings from './NotificationSettings';
import { Settings as SettingsIcon, Bell } from 'lucide-react';

interface SettingsProps {
    activeTab?: string;
}

export default function Settings({ activeTab = "notifications" }: SettingsProps) {
    return (
        <div className="space-y-8">
            <PageHeader 
                title="Settings"
                subtitle="Manage your account settings and preferences"
                icon={SettingsIcon}
            />

            <div className="flex gap-4 border-b border-gray-100 overflow-x-auto pb-1">
                <button className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                    activeTab === "notifications" ? "text-primary" : "text-gray-400 hover:text-gray-600"
                }`}>
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </div>
                    {activeTab === "notifications" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                    )}
                </button>
                {/* Add more tabs here as needed */}
            </div>

            <div className="pt-4">
                {activeTab === "notifications" && <NotificationSettings />}
            </div>
        </div>
    );
}
