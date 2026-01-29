import { X } from "lucide-react";

export interface TabItem {
    id: string;
    label: string;
    canClose?: boolean;
}

interface ClassificationTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    tabs: TabItem[];
    onCloseTab?: (tabId: string) => void;
}

export default function ClassificationTabs({ activeTab, onTabChange, tabs, onCloseTab }: ClassificationTabsProps) {
    return (
        <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-4 gap-1">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={`group relative flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md transition-all cursor-pointer ${activeTab === tab.id
                        ? 'text-gray-900 bg-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <span>{tab.label}</span>
                    {tab.canClose && onCloseTab && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCloseTab(tab.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-all absolute right-2"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
