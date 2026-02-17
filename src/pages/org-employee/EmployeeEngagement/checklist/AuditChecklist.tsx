import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Filter, PieChart, Plus, X } from 'lucide-react';
import { 
    ChecklistStatus, 
    type ChecklistItem,
    type CreateChecklistDto,
    type UpdateChecklistDto 
} from './types';
import ChecklistPhaseComponent from './components/ChecklistPhase';
import ChecklistProgressBar from './components/ChecklistProgressBar';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { checklistService } from './checklistService';
import CreateEditChecklistModal from './components/CreateEditChecklistModal';

export default function AuditChecklist({ engagementId }: { engagementId?: string }) {
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);
    
    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ChecklistItem | undefined>(undefined);
    const [parentItem, setParentItem] = useState<ChecklistItem | undefined>(undefined);

    const queryClient = useQueryClient();

    const { data: rawChecklists, isLoading } = useQuery({
        queryKey: ['engagement-checklists', engagementId],
        enabled: !!engagementId,
        queryFn: () => checklistService.list(engagementId!),
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-checklists', engagementId] });
            setIsCreateModalOpen(false);
            setSelectedItem(undefined);
            setParentItem(undefined);
        },
        onError: (err: Error) => {
            console.error(err.message || 'Operation failed');
        }
    };

    const createMutation = useMutation({
        mutationFn: (data: CreateChecklistDto) => checklistService.create(engagementId!, data),
        ...mutationOptions
    });

    const statusMutation = useMutation({
        mutationFn: (args: { id: string, status: ChecklistStatus, reason?: string }) => 
            checklistService.patchStatus(engagementId!, args.id, { status: args.status, reason: args.reason }),
        onMutate: async (newStatusObj) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['engagement-checklists', engagementId] });

            // Snapshot the previous value
            const previousChecklists = queryClient.getQueryData(['engagement-checklists', engagementId]);

            // Optimistically update to the new value
            queryClient.setQueryData(['engagement-checklists', engagementId], (old: ChecklistItem[] | undefined) => {
                if (!old) return [];
                return old.map(item => item.id === newStatusObj.id ? { ...item, status: newStatusObj.status } : item);
            });

            // Return a context object with the snapshotted value
            return { previousChecklists };
        },
        onError: (err: Error, _newStatus, context) => {
            // Rollback if error
            if (context?.previousChecklists) {
                queryClient.setQueryData(['engagement-checklists', engagementId], context.previousChecklists);
            }
            console.error(err.message || 'Status update failed');
        },
        onSettled: () => {
             // Always refetch after error or success to ensure we are in sync with server
             queryClient.invalidateQueries({ queryKey: ['engagement-checklists', engagementId] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (args: { id: string, data: UpdateChecklistDto }) => 
            checklistService.update(engagementId!, args.id, args.data),
        ...mutationOptions
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => checklistService.delete(engagementId!, id),
        ...mutationOptions
    });

    const isWorking = createMutation.isPending || statusMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    // Hierarchical transformation: The backend returns items with .children if fetched correctly, 
    // but the service list returns a flat list (with level info). 
    // Let's build a tree from the flat list if children aren't already nested.
    const { checklistTree, flatList } = useMemo(() => {
        if (!rawChecklists) return { checklistTree: [], flatList: [] };
        
        const items = [...rawChecklists];
        const map: Record<string, ChecklistItem> = {};
        const roots: ChecklistItem[] = [];

        items.forEach(item => {
            map[item.id] = { ...item, children: [] };
        });

        items.forEach(item => {
            if (item.parentId && map[item.parentId]) {
                map[item.parentId].children!.push(map[item.id]);
            } else if (item.level === 1) {
                roots.push(map[item.id]);
            }
        });

        return { checklistTree: roots, flatList: Object.values(map) };
    }, [rawChecklists]);

    // Available parents for dropdown (level 1 or 2)
    const availableParents = useMemo(() => 
        flatList.filter(item => item.level < 3),
    [flatList]);

    // Filter Logic
    const filteredTree = useMemo(() => {
        if (filter === 'all') return checklistTree;
        
        const filterItem = (item: ChecklistItem): boolean => {
            const matches = filter === 'completed' 
                ? (item.status === ChecklistStatus.COMPLETED || item.status === ChecklistStatus.IGNORED)
                : (item.status === ChecklistStatus.TO_DO || item.status === ChecklistStatus.IN_PROGRESS);
            
            if (item.children && item.children.length > 0) {
                const filteredChildren = item.children.filter(filterItem);
                return matches || filteredChildren.length > 0;
            }
            return matches;
        };

        return checklistTree.filter(filterItem);
    }, [checklistTree, filter]);

    // Progress Stats
    const allTasks = useMemo(() => 
        flatList.filter(item => item.level === 3),
    [flatList]);

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === ChecklistStatus.COMPLETED || t.status === ChecklistStatus.IGNORED).length;

    const handleCreateSubmit = (data: CreateChecklistDto | UpdateChecklistDto) => {
        if (selectedItem) {
            updateMutation.mutate({ id: selectedItem.id, data });
        } else {
            createMutation.mutate(data as CreateChecklistDto);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this checklist item? All sub-items will also be deleted.')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading checklists...</div>;
    }

    return (
        <div className="space-y-6 pb-20 font-inter">
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
            <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
                <div className="flex items-center gap-2">
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
                
                <button 
                    disabled={isWorking}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                        setSelectedItem(undefined);
                        setParentItem(undefined);
                        setIsCreateModalOpen(true);
                    }}
                >
                    <Plus size={16} />
                    Add Phase
                </button>
            </div>

            {/* Content Accordion */}
            <div className={`space-y-4 ${isWorking ? 'pointer-events-none opacity-80' : ''}`}>
                {filteredTree.length > 0 ? (
                    filteredTree.map(phase => (
                        <div key={phase.id} className="group relative">
                            <ChecklistPhaseComponent
                                phase={phase}
                                isExpanded={expandedPhaseId === phase.id}
                                onToggle={() => setExpandedPhaseId(expandedPhaseId === phase.id ? null : phase.id)}
                                onTaskUpdate={(taskId, updates) => updateMutation.mutate({ id: taskId, data: updates })}
                                onTaskStatusChange={(taskId, status) => {
                                    statusMutation.mutate({ id: taskId, status });
                                }}
                                onAddSubItem={(parent) => { setParentItem(parent); setIsCreateModalOpen(true); }}
                                onEditItem={(item) => { setSelectedItem(item); setIsCreateModalOpen(true); }}
                                onDeleteItem={handleDelete}
                                isDisabled={isWorking}
                            />
                            
                            {/* Action Buttons Overlay for Phase */}
                            <div className="absolute top-4 right-14 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    disabled={isWorking}
                                    onClick={() => { setSelectedItem(phase); setIsCreateModalOpen(true); }}
                                    className="p-1.5 bg-white shadow-sm border border-gray-100 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                                    title="Edit Phase"
                                >
                                    <Plus size={14} className="rotate-45" />
                                </button>
                                <button 
                                    disabled={isWorking}
                                    onClick={() => { setParentItem(phase); setIsCreateModalOpen(true); }}
                                    className="p-1.5 bg-white shadow-sm border border-gray-100 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 disabled:opacity-50"
                                    title="Add Section"
                                >
                                    <Plus size={14} />
                                </button>
                                <button 
                                    disabled={isWorking}
                                    onClick={() => handleDelete(phase.id)}
                                    className="p-1.5 bg-white shadow-sm border border-gray-100 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    title="Delete Phase"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <ShadowCard className="p-12 text-center">
                        <p className="text-gray-500">No checklists found for this engagement.</p>
                        <button 
                            disabled={isWorking}
                            className="mt-4 text-indigo-600 font-bold hover:underline disabled:opacity-50"
                            onClick={() => { setIsCreateModalOpen(true); }}
                        >
                            Create your first checklist phase
                        </button>
                    </ShadowCard>
                )}
            </div>

            {/* Modals */}
            <CreateEditChecklistModal 
                key={`${selectedItem?.id || 'new'}-${parentItem?.id || 'none'}-${isCreateModalOpen}`}
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setSelectedItem(undefined); setParentItem(undefined); }}
                onSubmit={handleCreateSubmit}
                initialData={selectedItem}
                parentItem={parentItem}
                availableParents={availableParents}
                isLoading={isWorking}
            />
        </div>
    );
}
