import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Flag, 
    Plus, 
    Edit2, 
    Trash2, 
    Loader2, 
    CheckCircle2,
    Calendar,
    Target
} from 'lucide-react';
import { Button } from '../../../../ui/Button';
import { Input } from '../../../../ui/input';
import { Textarea } from '../../../../ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/Dialog';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../../config/base';
import { endPoints } from '../../../../config/endPoint';
import { cn } from '../../../../lib/utils';
import { TemplateModal } from '../components/TemplateModal';
import { ActionConfirmModal } from '../components/ActionConfirmModal';

type MilestoneStatus = 'PENDING' | 'ACHIEVED' | 'CANCELLED';

interface MilestoneItem {
    id: string;
    title: string;
    description: string | null;
    status: MilestoneStatus;
    order: number;
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse<T> {
    data: T;
    message?: string;
}

export default function MilestonesView({ engagementId }: { engagementId?: string }) {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MilestoneItem | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    const { data: milestones = [], isLoading } = useQuery({
        queryKey: ['engagement-milestones', engagementId],
        enabled: !!engagementId,
        queryFn: async () => {
            if (!engagementId) return [];
            const res = await apiGet<ApiResponse<MilestoneItem[]>>(
                endPoints.ENGAGEMENTS.MILESTONES(engagementId)
            );
            return res?.data ?? [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (payload: { title: string; description: string }) => {
            return apiPost(endPoints.ENGAGEMENTS.MILESTONES(engagementId!), payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-milestones', engagementId] });
            setIsAddModalOpen(false);
            resetForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: { title: string; description: string } }) => {
            return apiPatch(`${endPoints.ENGAGEMENTS.MILESTONES(engagementId!)}/${id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-milestones', engagementId] });
            setEditingItem(null);
            resetForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiDelete(`${endPoints.ENGAGEMENTS.MILESTONES(engagementId!)}/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-milestones', engagementId] });
            setDeletingItemId(null);
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: MilestoneStatus }) => {
            return apiPatch(`${endPoints.ENGAGEMENTS.MILESTONES(engagementId!)}/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-milestones', engagementId] });
        },
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: ''
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, payload: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const getStatusIcon = (status: MilestoneStatus) => {
        switch (status) {
            case 'ACHIEVED':
                return (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200 ring-4 ring-emerald-50">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                );
            case 'PENDING':
                return (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                        <Target className="w-4 h-4" />
                    </div>
                );
            case 'CANCELLED':
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-400 border-2 border-dashed border-red-300">
                        <Flag className="w-4 h-4" />
                    </div>
                );
        }
    };

    return (
        <div className="mx-auto py-3">
            <div className="mb-8 flex justify-between items-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full -z-10" />
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight font-primary">Project Milestones</h2>
                    <p className="text-gray-400 mt-1 text-sm font-medium">Tracking our journey towards completion</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button 
                        variant="default" 
                        onClick={() => setIsTemplateModalOpen(true)} 
                        className="rounded-xl h-10 px-5 font-bold text-sm border border-slate-100"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Template
                    </Button>
                    <Button 
                        onClick={() => { setEditingItem(null); resetForm(); setIsAddModalOpen(true); }}
                        className="rounded-xl h-10 px-5 bg-slate-900 hover:bg-black text-white shadow-lg transition-all text-sm"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Define Marker
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                </div>
            ) : milestones.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No markers defined for this engagement yet.</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Vertical Line on the left */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-100 -translate-x-1/2 z-0" />

                    <div className="space-y-8 relative z-10">
                        {(Array.isArray(milestones) ? [...milestones] : []).sort((a, b) => a.order - b.order).map((milestone, index) => (
                            <div key={milestone.id} className="flex items-center w-full relative group">
                                {/* Left aligned Icon */}
                                <div className="absolute left-8 -translate-x-1/2 flex items-center justify-center">
                                    <div className="transition-transform duration-300 group-hover:scale-110">
                                        {getStatusIcon(milestone.status)}
                                    </div>
                                </div>

                                {/* Content Card on the right side */}
                                <div className="w-full pl-16 pr-0">
                                    <div className={cn(
                                        "p-5 rounded-3xl transition-all duration-300 border-l-[5px] shadow-sm",
                                        milestone.status === 'ACHIEVED' 
                                            ? "border-l-emerald-500 bg-white/80 backdrop-blur-sm grayscale-[0.3] opacity-80" 
                                            : "border-l-slate-200 bg-white hover:shadow-xl hover:-translate-y-0.5"
                                    )}>
                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg tracking-widest uppercase">
                                                            Marker {index + 1}
                                                        </span>
                                                        {milestone.status === 'PENDING' && index === milestones.filter(m => m.status === 'ACHIEVED').length && (
                                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                                                Focus
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className={cn(
                                                        "text-xl font-bold tracking-tight font-primary",
                                                        milestone.status === 'ACHIEVED' ? "text-gray-400 line-through" : "text-gray-900"
                                                    )}>
                                                        {milestone.title}
                                                    </h4>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100 gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            className={cn(
                                                                "h-8 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                                milestone.status === 'PENDING' ? "bg-white text-amber-600 shadow-sm ring-1 ring-amber-100" : "text-slate-400 hover:text-amber-500"
                                                            )}
                                                            onClick={() => updateStatusMutation.mutate({ id: milestone.id, status: 'PENDING' })}
                                                            disabled={updateStatusMutation.isPending}
                                                        >
                                                            Wait
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            className={cn(
                                                                "h-8 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                                milestone.status === 'ACHIEVED' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "text-slate-400 hover:text-emerald-500"
                                                            )}
                                                            onClick={() => updateStatusMutation.mutate({ id: milestone.id, status: 'ACHIEVED' })}
                                                            disabled={updateStatusMutation.isPending}
                                                        >
                                                            Done
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            className={cn(
                                                                "h-8 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                                milestone.status === 'CANCELLED' ? "bg-red-500 text-white shadow-lg shadow-red-200" : "text-slate-400 hover:text-red-500"
                                                            )}
                                                            onClick={() => updateStatusMutation.mutate({ id: milestone.id, status: 'CANCELLED' })}
                                                            disabled={updateStatusMutation.isPending}
                                                        >
                                                            Skip
                                                        </Button>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>{new Date(milestone.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl" onClick={() => {
                                                                setEditingItem(milestone);
                                                                setFormData({
                                                                    title: milestone.title,
                                                                    description: milestone.description || ''
                                                                });
                                                                setIsAddModalOpen(true);
                                                            }}>
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:bg-red-50 rounded-xl" onClick={() => setDeletingItemId(milestone.id)}>
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-3xl">
                                                {milestone.description || 'No detailed briefing provided for this marker.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA Section */}
            {/* <div className="mt-16 p-10 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full transition-transform duration-1000 group-hover:scale-150" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-1 w-8 bg-emerald-400 rounded-full" />
                            <h3 className="text-3xl font-bold font-primary tracking-tight">On track for success?</h3>
                        </div>
                        <p className="text-slate-400 font-medium text-lg">Push forward by completing your active requirements and checklist items.</p>
                    </div>
                    <Button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-10 h-14 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all shadow-2xl hover:shadow-[0_20px_40px_rgba(255,255,255,0.1)] scale-105 active:scale-95"
                    >
                        View Active Checklist
                    </Button>
                </div>
            </div> */}

            {/* Add/Edit Modal */}
            <Dialog open={isAddModalOpen || !!editingItem} onOpenChange={() => { setIsAddModalOpen(false); setEditingItem(null); }}>
                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
                    <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 bg-white/5 rounded-full blur-2xl" />
                        <DialogHeader className="relative">
                            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                                {editingItem ? 'Modify Marker' : 'New Strategic Marker'}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium mt-1">
                                Define a key achievement point for this engagement lifecycle.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marker Title</label>
                            <Input 
                                placeholder="e.g. Initial Audit Draft" 
                                className="rounded-xl border-slate-100 bg-slate-50/50 h-12 focus:bg-white transition-all text-sm font-bold"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description & Scope</label>
                            <Textarea 
                                placeholder="Detailed breakdown of what defines this milestone..." 
                                className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[120px] focus:bg-white transition-all text-sm font-medium"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className="grow rounded-2xl h-12 text-slate-400 font-bold" 
                                onClick={() => { setIsAddModalOpen(false); setEditingItem(null); }}
                            >
                                Discard
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="grow-2 rounded-2xl h-12 font-black bg-slate-900 text-white shadow-xl hover:bg-black transition-all"
                            >
                                {createMutation.isPending || updateMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : editingItem ? (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                )}
                                {editingItem ? 'Update Marker' : 'Deploy Marker'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ActionConfirmModal 
                isOpen={!!deletingItemId}
                onClose={() => setDeletingItemId(null)}
                onConfirm={() => deletingItemId && deleteMutation.mutate(deletingItemId)}
                title="Discard Marker?"
                message="Are you sure you want to remove this milestone from the project timeline? This action is permanent."
                confirmLabel="Confirm Deletion"
                variant="danger"
                loading={deleteMutation.isPending}
            />

            <TemplateModal 
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['engagement-milestones', engagementId] })}
                type="MILESTONE"
                engagementId={engagementId!}
            />
        </div>
    );
}
