import { History, CheckCircle2, Clock, User } from "lucide-react";
import { ShadowCard } from "../../../../../ui/ShadowCard";

const MOCK_HISTORY = [
    { id: 1, status: 'Approved', date: 'Oct 24, 2024', time: '14:30', user: 'Sarah Wilson', type: 'success' },
    { id: 2, status: 'Review Pending', date: 'Oct 23, 2024', time: '09:15', user: 'Mike Chen', type: 'warning' },
    { id: 3, status: 'Draft Created', date: 'Oct 22, 2024', time: '16:45', user: 'System', type: 'default' },
];

export default function StatusHistoryCard() {
    return (
        <ShadowCard className="p-6 h-full flex flex-col group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 text-gray-600 rounded-xl">
                        <History size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900">Status History</h3>
                </div>
                <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">Recent</span>
            </div>

            <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100" />

                {MOCK_HISTORY.map((item) => (
                    <div key={item.id} className="relative pl-10">
                        <div className={`
                            absolute left-1.5 top-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center z-10
                            ${item.type === 'success' ? 'bg-green-100 text-green-600' :
                                item.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}
                        `}>
                            {item.type === 'success' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        </div>

                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-gray-900">{item.status}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                        <User size={10} />
                                        <span>{item.user}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-bold text-gray-500">{item.date}</p>
                                <p className="text-[10px] text-gray-400">{item.time}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ShadowCard>
    );
}
