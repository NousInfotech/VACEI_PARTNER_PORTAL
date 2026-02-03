import { ExternalLink } from 'lucide-react';

interface CoverageItem {
    id: string;
    name: string;
    status: string;
    expiry: string;
    lastUpdated: string;
}

interface CSPCoverageTableProps {
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}

export default function CSPCoverageTable({ selectedId, onSelect }: CSPCoverageTableProps) {
    const coverageItems: CoverageItem[] = [
        { id: 'director-appointments', name: 'Director Appointments', status: 'Action Required', expiry: '-', lastUpdated: '1 day ago' },
        { id: 'registered-office', name: 'Registered Office Address', status: 'On Track', expiry: 'Jan 2027', lastUpdated: '1 month ago' },
        { id: 'company-secretary', name: 'Company Secretary', status: 'On Track', expiry: '-', lastUpdated: '2 weeks ago' },
        { id: 'statutory-registers', name: 'Statutory Registers Maintenance', status: 'On Track', expiry: 'Ongoing', lastUpdated: '1 week ago' },
        { id: 'share-capital', name: 'Share Capital Changes', status: 'Due Soon', expiry: 'Mar 2026', lastUpdated: '3 days ago' }
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4">Coverage Item</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Expiry / Renewal</th>
                        <th className="px-6 py-4">Last Updated</th>
                        <th className="px-6 py-4">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {coverageItems.map((row) => (
                        <tr key={row.id} className={selectedId === row.id ? "bg-indigo-50/50" : "hover:bg-gray-50/50"}>
                            <td className="px-6 py-4 font-bold text-gray-900">{row.name}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${row.status === 'On Track' ? 'bg-green-100 text-green-700' :
                                    row.status === 'Action Required' ? 'bg-red-100 text-red-700' :
                                        row.status === 'Due Soon' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {row.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">{row.expiry}</td>
                            <td className="px-6 py-4 text-gray-500">{row.lastUpdated}</td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => onSelect(row.id === selectedId ? null : row.id)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                                >
                                    {selectedId === row.id ? 'Active' : 'Open'}
                                    <ExternalLink size={12} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
