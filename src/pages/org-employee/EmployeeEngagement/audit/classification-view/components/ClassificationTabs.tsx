interface ClassificationTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function ClassificationTabs({ activeTab, onTabChange }: ClassificationTabsProps) {
    const tabs = ['Lead Sheet', 'Evidence', 'Procedures', 'WorkBook'];

    return (
        <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-4 gap-1">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`py-2 px-4 text-sm font-medium rounded-md transition-all text-center ${activeTab === tab
                            ? 'text-gray-900 bg-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}
