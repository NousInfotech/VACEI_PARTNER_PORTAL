import { ExternalLink } from 'lucide-react';

interface Engagement {
    id: string;
    name: string;
    coverage: string;
    status: string;
    lastUpdated: string;
}

interface CFOEngagementsTableProps {
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}

export default function CFOEngagementsTable({ selectedId, onSelect }: CFOEngagementsTableProps) {
    const engagements: Engagement[] = [
        { id: 'monthly-reporting', name: 'Monthly Management Reporting', coverage: 'Monthly', status: 'In Progress', lastUpdated: '2 hours ago' },
        { id: 'cash-flow', name: 'Cash Flow & Forecasting', coverage: 'Ongoing', status: 'Waiting on you', lastUpdated: '1 day ago' },
        { id: 'budgeting', name: 'Budgeting & Planning', coverage: 'Quarterly', status: 'Completed', lastUpdated: '1 week ago' },
        { id: 'board-pack', name: 'Board Pack Preparation', coverage: 'Project', status: 'Not Started', lastUpdated: '-' }
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4">Engagement / Workstream</th>
                        <th className="px-6 py-4">Coverage</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Last Updated</th>
                        <th className="px-6 py-4">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {engagements.map((row) => (
                        <tr key={row.id} className={selectedId === row.id ? "bg-indigo-50/50" : "hover:bg-gray-50/50"}>
                            <td className="px-6 py-4 font-bold text-gray-900">{row.name}</td>
                            <td className="px-6 py-4 text-gray-500">{row.coverage}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${row.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                    row.status === 'Waiting on you' ? 'bg-orange-100 text-orange-700' :
                                        row.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {row.status}
                                </span>
                            </td>
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
