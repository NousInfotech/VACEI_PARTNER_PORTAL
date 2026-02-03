import { useState } from "react";
import ServiceDashboardLayout, { type DashboardConfig } from "../components/ServiceDashboardLayout";
import CSPCoverageTable from "./CSPCoverageTable";

// Mock Data for "coverage" context switching
const COVERAGE_DATA: Record<string, Partial<DashboardConfig>> = {
    'director-appointments': {
        compliance: {
            coverage: 'Director Appointments',
            cycleLabel: 'Ongoing',
            status: 'waiting_on_you',
            statusLine: 'Director change in progress — documents pending from you.',
            requiredActions: [
                { id: '1', type: 'upload', label: 'Upload signed appointment forms', context: 'Form K' },
                { id: '2', type: 'confirm', label: 'Confirm new director address', context: 'Proof of address needed' }
            ]
        },
        currentCycle: {
            label: 'Director Change Request',
            statusLine: 'Waiting for signed documents to proceed with filing.',
            reassuranceText: 'We handle the registry filing.'
        },
        inlineRequests: [
            { id: 'req1', title: 'Passport copy for new director', details: 'Expiry date must be visible', ctaType: 'upload', ctaLabel: 'Upload', priority: 'high' }
        ],
        referenceList: [
            {
                group: 'Appointments',
                items: [
                    { title: 'Current Directors List', type: 'pdf', link: '#' },
                    { title: 'Draft Appointment Forms', type: 'pdf', link: '#' }
                ]
            }
        ]
    },
    'registered-office': {
        compliance: {
            coverage: 'Registered Office',
            cycleLabel: 'Annual Renewal',
            status: 'completed',
            statusLine: 'Monitoring upcoming renewal.',
            requiredActions: []
        },
        currentCycle: {
            label: 'Registered Office Maintenance',
            statusLine: 'Compliance is up to date.',
            reassuranceText: 'Next renewal due in 6 months.'
        },
        inlineRequests: [],
        referenceList: [
            {
                group: 'Registers',
                items: [
                    { title: 'Register of Directors', type: 'pdf', link: '#' },
                    { title: 'Register of Members', type: 'pdf', link: '#' }
                ]
            }
        ]
    }
};

const DEFAULT_CONFIG: DashboardConfig = {
    serviceName: 'Corporate Services (CSP)',
    description: 'We maintain your company’s statutory obligations, appointments, registers, and key filings.',
    statusPill: {
        label: 'Action Required',
        status: 'action_required'
    },
    compliance: {
        coverage: 'Ongoing (Corporate Compliance)',
        cycleLabel: 'Ongoing',
        status: 'waiting_on_you',
        statusLine: 'Director change in progress — documents pending.',
        requiredActions: [
            { id: '1', type: 'upload', label: 'Upload signed appointment forms', context: 'For new Director' },
            { id: '2', type: 'approve', label: 'Approve resolution draft', context: 'Board Resolution #24' }
        ]
    },
    currentCycle: {
        label: 'Ongoing — Corporate Compliance',
        statusLine: 'Monitoring upcoming renewals and statutory updates.',
        reassuranceText: 'We handle processing and submissions on your behalf.'
    },
    inlineRequests: [
        { id: 'r1', title: 'Upload passport for new officer', details: 'High priority', ctaType: 'upload', ctaLabel: 'Upload', priority: 'high' }
    ],
    referenceList: [
        {
            group: 'Appointments',
            items: [
                { title: 'Current Directors/Officers List', type: 'pdf', link: '#' },
                { title: 'Secretary Appointment Confirmation', type: 'pdf', link: '#' }
            ]
        },
        {
            group: 'Statutory Documents',
            items: [
                { title: 'Resolutions & Minutes Pack', type: 'pdf', link: '#' },
                { title: 'Company Documents Index', type: 'pdf', link: '#' }
            ]
        }
    ],
    messages: [
        { id: 'm1', sender: 'System', content: 'Ordinance update available for review.', date: 'Today, 11:00 AM', isSystem: true },
        { id: 'm2', sender: 'James (CSP)', content: 'We need the signed forms by Friday to meet the filing deadline.', date: 'Yesterday, 2:00 PM' }
    ]
};

export default function CSPView() {
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // Merge default config with selected coverage overrides
    const activeConfig = selectedItemId && COVERAGE_DATA[selectedItemId]
        ? { ...DEFAULT_CONFIG, ...COVERAGE_DATA[selectedItemId] }
        : DEFAULT_CONFIG;

    const CoverageTab = (
        <CSPCoverageTable
            selectedId={selectedItemId}
            onSelect={setSelectedItemId}
        />
    );

    return (
        <ServiceDashboardLayout
            config={{
                ...activeConfig,
                overviewTabLabel: 'Dashboard',
                additionalTabs: [
                    { id: 'coverage', label: 'Services & Coverage', content: CoverageTab }
                ]
            }}
        />
    );
}
