import { useState } from "react";
import ServiceDashboardLayout, { type DashboardConfig } from "../components/ServiceDashboardLayout";
import CFOEngagementsTable from "./CFOEngagementsTable";

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
        <CFOEngagementsTable
            selectedId={selectedEngagementId}
            onSelect={setSelectedEngagementId}
        />
    );

    return (
        <ServiceDashboardLayout
            config={{
                ...activeConfig,
                overviewTabLabel: 'Dashboard',
                additionalTabs: [
                    { id: 'engagements', label: 'Engagements', content: EngagementsTab }
                ]
            }}
        />
    );
}
