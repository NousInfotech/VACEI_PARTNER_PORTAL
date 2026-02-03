import { useState } from "react";
import ServiceDashboardLayout, { type DashboardConfig } from "../components/ServiceDashboardLayout";
import { ExternalLink } from "lucide-react";

// Mock Data for "engagements" context switching
const ENGAGEMENTS_DATA: Record<string, Partial<DashboardConfig>> = {
    'monthly-reporting': {
        compliance: {
            coverage: 'Monthly Cadence',
            cycleLabel: 'This month',
            status: 'in_progress',
            statusLine: 'Monthly reporting in progress — preparing management pack.',
            requiredActions: [
                { id: '1', type: 'upload', label: 'Upload latest bank statements', context: 'Required for reconciliation' },
                { id: '2', type: 'confirm', label: 'Confirm no major changes', context: 'Since last month' }
            ]
        },
        currentCycle: {
            label: 'January 2026 — Management Reporting',
            statusLine: 'Reviewing performance vs budget and updating cash forecast.',
            reassuranceText: 'We handle processing and analysis on your behalf.'
        },
        inlineRequests: [
            { id: 'req1', title: 'Upload updated debtor listing (A/R)', details: 'Needed for aging analysis', ctaType: 'upload', ctaLabel: 'Upload', priority: 'high' }
        ],
        referenceList: [
            {
                group: 'Financial Snapshots',
                items: [
                    { title: 'Latest Management Accounts', type: 'pdf', link: '#' },
                    { title: 'P&L, Balance Sheet Summary', type: 'excel', link: '#' }
                ]
            }
        ]
    },
    'cash-flow': {
        compliance: {
            coverage: 'Ongoing Support',
            cycleLabel: 'Weekly Review',
            status: 'waiting_on_you',
            statusLine: 'Waiting for approval on updated 13-week forecast.',
            requiredActions: [
                { id: '3', type: 'approve', label: 'Approve Cash Forecast', context: 'Q1 2026 Projection' }
            ]
        },
        currentCycle: {
            label: 'Q1 2026 — Cash Flow Forecasting',
            statusLine: 'Awaiting your approval to finalize reporting.',
            reassuranceText: 'Scenario planning active.'
        },
        inlineRequests: [],
        referenceList: [
            {
                group: 'Forecasting & Planning',
                items: [
                    { title: '13-Week Cash Flow Forecast', type: 'excel', link: '#' },
                    { title: 'Scenario Analysis Q1', type: 'pdf', link: '#' }
                ]
            }
        ]
    }
};

const DEFAULT_CONFIG: DashboardConfig = {
    serviceName: 'CFO Services',
    description: 'We provide ongoing financial oversight, reporting, and decision support so you always know where the business stands.',
    statusPill: {
        label: 'On Track',
        status: 'on_track'
    },
    compliance: {
        coverage: 'Ongoing (monthly cadence)',
        cycleLabel: 'This month',
        status: 'in_progress',
        statusLine: 'Monthly reporting in progress — preparing management pack.',
        requiredActions: [
            { id: '1', type: 'upload', label: 'Upload latest bank statements', context: 'For Jan 2026' },
            { id: '2', type: 'approve', label: 'Approve draft management pack', context: 'Draft v1 ready' }
        ]
    },
    currentCycle: {
        label: 'January 2026 — Management Reporting',
        statusLine: 'Reviewing performance vs budget and updating cash forecast.',
        reassuranceText: 'We handle processing and submissions on your behalf.'
    },
    inlineRequests: [
        { id: 'r1', title: 'Confirm planned hiring changes', details: 'Impacts Q2 budget', ctaType: 'confirm', ctaLabel: 'Confirm', priority: 'normal' }
    ],
    referenceList: [
        {
            group: 'Financial Snapshots',
            items: [
                { title: 'Latest Management Accounts', type: 'pdf', link: '#' },
                { title: 'KPI Summary', type: 'pdf', link: '#' }
            ]
        },
        {
            group: 'Decision Support',
            items: [
                { title: 'Board Deck Q4', type: 'pdf', link: '#' },
                { title: 'CFO Commentary', type: 'pdf', link: '#' }
            ]
        }
    ],
    messages: [
        { id: 'm1', sender: 'System', content: 'Management pack v1 uploaded for review.', date: 'Today, 9:00 AM', isSystem: true },
        { id: 'm2', sender: 'Sarah (CFO)', content: 'Please check the cash flow assumptions on page 4.', date: 'Yesterday, 4:30 PM' }
    ]
};

export default function CFOView() {
    const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null);

    // Merge default config with selected engagement overrides
    const activeConfig = selectedEngagementId && ENGAGEMENTS_DATA[selectedEngagementId]
        ? { ...DEFAULT_CONFIG, ...ENGAGEMENTS_DATA[selectedEngagementId] }
        : DEFAULT_CONFIG;

    const EngagementsTab = (
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
                    {[
                        { id: 'monthly-reporting', name: 'Monthly Management Reporting', coverage: 'Monthly', status: 'In Progress', lastUpdated: '2 hours ago' },
                        { id: 'cash-flow', name: 'Cash Flow & Forecasting', coverage: 'Ongoing', status: 'Waiting on you', lastUpdated: '1 day ago' },
                        { id: 'budgeting', name: 'Budgeting & Planning', coverage: 'Quarterly', status: 'Completed', lastUpdated: '1 week ago' },
                        { id: 'board-pack', name: 'Board Pack Preparation', coverage: 'Project', status: 'Not Started', lastUpdated: '-' }
                    ].map((row) => (
                        <tr key={row.id} className={selectedEngagementId === row.id ? "bg-indigo-50/50" : "hover:bg-gray-50/50"}>
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
                                    onClick={() => setSelectedEngagementId(row.id === selectedEngagementId ? null : row.id)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                                >
                                    {selectedEngagementId === row.id ? 'Active' : 'Open'}
                                    <ExternalLink size={12} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <ServiceDashboardLayout
            config={{
                ...activeConfig,
                additionalTabs: [
                    { id: 'engagements', label: 'Engagements', content: EngagementsTab }
                ]
            }}
        />
    );
}
