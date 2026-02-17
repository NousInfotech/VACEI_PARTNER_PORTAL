import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, PieChart } from 'lucide-react';
import { type ChecklistPhase, type ChecklistTask, type ChecklistTaskStatus } from './types';
import ChecklistPhaseComponent from './components/ChecklistPhase';
import ChecklistProgressBar from './components/ChecklistProgressBar';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { apiGet } from '../../../../config/base';
import { endPoints } from '../../../../config/endPoint';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  status: string;
  category?: string | null;
  deadline?: string | null;
  level?: number;
  children?: ChecklistItem[];
}

// CONSTANT MOCK DATA
const INITIAL_DATA: ChecklistPhase[] = [
    {
        id: 'pre_audit',
        title: '1. Pre-Audit Phase',
        sections: [
            {
                id: 'engagement_setup',
                title: 'Engagement Setup',
                tasks: [
                    { id: 'eng_letter', title: 'Signed Engagement Letter by Client', type: 'checkbox', status: 'not_started' },
                    { id: 'independence_check', title: 'Independence & Conflict Check', type: 'checkbox', status: 'not_started', notes: 'Partner sign-off required' },
                    { id: 'budget_alloc', title: 'Assign Audit Team & Budget', type: 'text', status: 'not_started' }
                ]
            }
        ]
    },
    {
        id: 'planning',
        title: '2. Audit Planning Phase',
        sections: [
            {
                id: 'risk_assess',
                title: 'Risk Assessment',
                tasks: [
                    { id: 'fraud_risk', title: 'Fraud Risk Inquiry', type: 'select', selectOptions: ['Low', 'Medium', 'High'], status: 'not_started' },
                    { id: 'materiality', title: 'Determine Materiality Threshold', type: 'text', status: 'not_started' }
                ]
            }
        ]
    },
    {
        id: 'fieldwork',
        title: '3. Fieldwork Phase',
        sections: [
            {
                id: 'testing',
                title: 'Substantive Testing',
                tasks: [
                    { id: 'revenue_test', title: 'Revenue Recognition Testing', type: 'checkbox', status: 'not_started' },
                    { id: 'expense_vouch', title: 'Expense Vouching (Sample Size: 25)', type: 'checkbox', status: 'not_started' }
                ]
            }
        ]
    },
    {
        id: 'finalization',
        title: '4. Finalization Phase',
        sections: [
            {
                id: 'review',
                title: 'Review',
                tasks: [
                    { id: 'fin_stmt_review', title: 'Financial Statement Review', type: 'checkbox', status: 'not_started' }
                ]
            }
        ]
    },
    {
        id: 'post_audit_docs',
        title: '5. Post-Audit Letters & Documentation',
        sections: [
            {
                id: 'reps',
                title: 'Representations',
                tasks: [
                    { id: 'rep_letter', title: 'Management Representation Letter', type: 'date', status: 'not_started' }
                ]
            }
        ]
    },
    {
        id: 'post_audit',
        title: '6. Post-Audit Phase',
        sections: [
            {
                id: 'debrief',
                title: 'Debrief',
                tasks: [
                    { id: 'internal_debrief', title: 'Internal Team Debrief', type: 'checkbox', status: 'not_started' }
                ]
            }
        ]
    },
    {
        id: 'conclusion',
        title: '7. Conclusion',
        sections: [
            {
                id: 'archiving',
                title: 'Archiving',
                tasks: [
                    { id: 'archive_file', title: 'Archive Audit File', type: 'checkbox', status: 'not_started' }
                ]
            }
        ]
    }
];

export default function AuditChecklist({ engagementId }: { engagementId?: string }) {
    const [data, setData] = useState<ChecklistPhase[]>(INITIAL_DATA);
    const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>('pre_audit');
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    const { data: apiChecklists } = useQuery({
        queryKey: ['engagement-checklists', engagementId],
        enabled: !!engagementId,
        queryFn: async () => {
            if (!engagementId) return [];
            const res = await apiGet<ApiResponse<ChecklistItem[]>>(
                endPoints.ENGAGEMENTS.CHECKLISTS(engagementId)
            );
            return (res?.data ?? []) as ChecklistItem[];
        },
    });

    const apiItems = (apiChecklists ?? []) as ChecklistItem[];

    // Helper to flatten tasks for calculations
    const getAllTasks = (phases: ChecklistPhase[]): ChecklistTask[] => {
        return phases.flatMap(p => p.sections.flatMap(s => s.tasks));
    };

    const handleTaskUpdate = (taskId: string, updates: Partial<ChecklistTask>) => {
        setData(prev => prev.map(phase => ({
            ...phase,
            sections: phase.sections.map(section => ({
                ...section,
                tasks: section.tasks.map(task =>
                    task.id === taskId ? { ...task, ...updates } : task
                )
            }))
        })));
    };

    const handleStatusChange = (taskId: string, status: ChecklistTaskStatus) => {
        handleTaskUpdate(taskId, { status });
    };

    // Filter Logic
    const filteredData = useMemo(() => {
        if (filter === 'all') return data;
        return data.map(phase => ({
            ...phase,
            sections: phase.sections.map(section => ({
                ...section,
                tasks: section.tasks.filter(t => {
                    if (filter === 'completed') return t.status === 'completed' || t.status === 'not_applicable';
                    if (filter === 'pending') return t.status === 'not_started' || t.status === 'in_progress';
                    return true;
                })
            })).filter(s => s.tasks.length > 0)
        })).filter(p => p.sections.length > 0);
    }, [data, filter]);

    // Progress Stats
    const allTasks = getAllTasks(data);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed' || t.status === 'not_applicable').length;

    return (
        <div className="space-y-6 pb-20">
            {/* Engagement checklists from API (when available) */}
            {engagementId && apiItems.length > 0 && (
                <ShadowCard className="p-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Engagement checklist</h3>
                    <ul className="space-y-2">
                        {apiItems.map((item) => (
                            <li key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <span className="font-medium text-gray-900">{item.title}</span>
                                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                                    {item.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                </ShadowCard>
            )}

            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ShadowCard className="md:col-span-2 p-6 flex flex-col justify-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Audit Procedures Checklist</h2>
                    <p className="text-gray-500 text-sm mb-6">Track progress across all audit phases, from planning to conclusion.</p>
                    <ChecklistProgressBar total={totalTasks} completed={completedTasks} />
                </ShadowCard>

                <ShadowCard className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                        <PieChart size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Overall Completion</p>
                </ShadowCard>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter size={16} className="text-gray-400 ml-1" />
                {(['all', 'pending', 'completed'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-colors ${filter === f
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Content Accordion */}
            <div className="space-y-4">
                {filteredData.map(phase => (
                    <ChecklistPhaseComponent
                        key={phase.id}
                        phase={phase}
                        allTasks={getAllTasks([data.find(p => p.id === phase.id)!])}
                        isExpanded={expandedPhaseId === phase.id}
                        onToggle={() => setExpandedPhaseId(expandedPhaseId === phase.id ? null : phase.id)}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskStatusChange={handleStatusChange}
                    />
                ))}
            </div>
        </div>
    );
}
