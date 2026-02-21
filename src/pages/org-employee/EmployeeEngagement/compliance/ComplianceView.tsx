import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ShieldCheck, 
    Plus, 
    Edit2, 
    Trash2, 
    Loader2, 
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { Button } from '../../../../ui/Button';
import { Input } from '../../../../ui/input';
import { Textarea } from '../../../../ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../../ui/Dialog';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../../config/base';
import { endPoints } from '../../../../config/endPoint';
import { cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/auth-context-core';
import type { ComplianceCalendarItem } from '../../../../lib/types';

type ComplianceStatus = 'ACTION_REQUIRED' | 'ACTION_TAKEN' | 'COMPLETED';
type ComplianceType = 'DOCUMENT_REQUEST' | 'CHAT' | 'REQUESTED_DOCUMENT' | 'CUSTOM';

interface ComplianceItem {
    id: string;
    title: string;
    description: string | null;
    customerComment: string | null;
    startDate: string;
    deadline: string;
    status: ComplianceStatus;
    type: ComplianceType;
    cta: string;
    service: string;
    moduleId: string | null;
}

interface ApiResponse<T> {
    data: T;
    message?: string;
}

export default function ComplianceView({ engagementId }: { engagementId?: string }) {
    const queryClient = useQueryClient();
    const { selectedService } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        deadline: '',
        service: selectedService || 'AUDITING',
        type: 'CUSTOM' as ComplianceType
    });

    // Get engagement to extract companyId
    const { data: engagementData } = useQuery({
        queryKey: ['engagement', engagementId],
        enabled: !!engagementId,
        queryFn: async () => {
            if (!engagementId) return null;
            const res = await apiGet<any>(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId));
            return res?.data || res;
        },
    });

    const companyId = engagementData?.companyId || engagementData?.company?.id;

    // Use Compliance Calendar API filtered by companyId instead of non-existent /engagements/{id}/compliances
    const { data: compliances = [], isLoading } = useQuery({
        queryKey: ['engagement-compliances', engagementId, companyId],
        enabled: !!engagementId && !!companyId,
        queryFn: async () => {
            if (!companyId) return [];
            const res = await apiGet<{ success: boolean; data?: ComplianceCalendarItem[] }>(
                `${endPoints.COMPLIANCE_CALENDAR.BASE}?type=COMPANY&companyId=${companyId}`
            );
            // Map ComplianceCalendarItem to ComplianceItem format expected by UI
            return (res?.data || []).map((item: any) => {
                const dueDate = new Date(item.dueDate);
                const now = new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                // Calculate status based on dueDate
                let status: ComplianceStatus = 'ACTION_REQUIRED';
                if (daysUntilDue < 0) {
                    status = 'ACTION_REQUIRED'; // Overdue
                } else if (daysUntilDue <= 7) {
                    status = 'ACTION_REQUIRED'; // Due soon
                } else {
                    status = 'ACTION_TAKEN'; // Upcoming (not urgent yet)
                }
                
                return {
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    customerComment: null,
                    startDate: item.startDate,
                    deadline: item.dueDate,
                    status,
                    type: 'CUSTOM' as ComplianceType,
                    cta: '',
                    service: item.serviceCategory,
                    moduleId: null,
                };
            });
        },
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            // Use Compliance Calendar API - create COMPANY type entry
            return apiPost(endPoints.COMPLIANCE_CALENDAR.BASE, {
                type: 'COMPANY',
                companyId: companyId,
                title: payload.title,
                description: payload.description || null,
                startDate: payload.startDate,
                dueDate: payload.deadline,
                frequency: 'YEARLY', // Default, can be made configurable
                serviceCategory: payload.service,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-compliances', engagementId] });
            setIsAddModalOpen(false);
            resetForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
            // Use Compliance Calendar API
            return apiPatch(endPoints.COMPLIANCE_CALENDAR.GET_BY_ID(id), {
                title: payload.title,
                description: payload.description || null,
                startDate: payload.startDate,
                dueDate: payload.deadline,
                serviceCategory: payload.service,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-compliances', engagementId] });
            setEditingItem(null);
            resetForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // Use Compliance Calendar API
            return apiDelete(endPoints.COMPLIANCE_CALENDAR.GET_BY_ID(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-compliances', engagementId] });
            setDeletingItemId(null);
        },
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            startDate: '',
            deadline: '',
            service: selectedService || 'AUDITING',
            type: 'CUSTOM'
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            startDate: new Date(formData.startDate).toISOString(),
            deadline: new Date(formData.deadline).toISOString()
        };
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const getStatusColor = (status: ComplianceStatus) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'ACTION_TAKEN': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'ACTION_REQUIRED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: ComplianceStatus) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 size={14} />;
            case 'ACTION_TAKEN': return <Clock size={14} />;
            case 'ACTION_REQUIRED': return <AlertCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <ShieldCheck className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Compliance & Regulatory</h2>
                        <p className="text-sm text-gray-500">Track and manage regulatory requirements</p>
                    </div>
                </div>
                <Button onClick={() => { setEditingItem(null); resetForm(); setIsAddModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Requirement
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : compliances.length === 0 ? (
                <ShadowCard className="p-12 text-center bg-gray-50/30 border-dashed">
                    <ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No compliance items yet</h3>
                    <p className="text-gray-500 mt-2">Add your first regulatory requirement to start tracking.</p>
                </ShadowCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {compliances.map((item) => (
                        <ShadowCard key={item.id} className="flex flex-col h-full border-t-4 border-t-indigo-500/50">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1",
                                        getStatusColor(item.status)
                                    )}>
                                        {getStatusIcon(item.status)}
                                        {item.status.replace('_', ' ')}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                            setEditingItem(item);
                                            setFormData({
                                                title: item.title,
                                                description: item.description || '',
                                                startDate: item.startDate.split('T')[0],
                                                deadline: item.deadline.split('T')[0],
                                                service: item.service,
                                                type: item.type
                                            });
                                            setIsAddModalOpen(true);
                                        }}>
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setDeletingItemId(item.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                                <div className="space-y-2 mb-4">
                                    <p className="text-xs text-gray-500 line-clamp-2">{item.description || 'No description provided.'}</p>
                                    {item.customerComment && (
                                        <div className="p-2 bg-amber-50 rounded border border-amber-100 italic text-[10px] text-amber-700">
                                            <strong>Note:</strong> {item.customerComment}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-2 mt-auto">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400 flex items-center gap-1">
                                            <Calendar size={12} /> Deadline
                                        </span>
                                        <span className="font-medium text-gray-700">{new Date(item.deadline).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between mt-auto rounded-b-xl">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{item.service}</span>
                            </div>
                        </ShadowCard>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={isAddModalOpen || !!editingItem} onOpenChange={() => { setIsAddModalOpen(false); setEditingItem(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Requirement' : 'Add Compliance Requirement'}</DialogTitle>
                        <DialogDescription>
                            Define a new regulatory or compliance milestone.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Service Category</label>
                                {selectedService ? (
                                    <div className="w-full h-10 px-3 flex items-center rounded-md border border-gray-100 bg-gray-50 text-sm font-medium text-gray-700">
                                        {selectedService}
                                    </div>
                                ) : (
                                    <select 
                                        className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.service}
                                        onChange={(e) => setFormData({...formData, service: e.target.value})}
                                    >
                                        <option value="ACCOUNTING">Accounting</option>
                                        <option value="AUDITING">Auditing</option>
                                        <option value="VAT">VAT</option>
                                        <option value="CFO">CFO</option>
                                        <option value="CSP">CSP</option>
                                        <option value="LEGAL">Legal</option>
                                        <option value="PAYROLL">Payroll</option>
                                        <option value="PROJECTS_TRANSACTIONS">Projects & Transactions</option>
                                        <option value="TECHNOLOGY">Technology</option>
                                        <option value="GRANTS_AND_INCENTIVES">Grants & Incentives</option>
                                        <option value="INCORPORATION">Incorporation</option>
                                        <option value="MBR">MBR</option>
                                        <option value="TAX">Tax</option>
                                        <option value="CUSTOM">Custom</option>
                                    </select>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Title</label>
                                <Input 
                                    placeholder="Requirement title" 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Description</label>
                                <Textarea 
                                    placeholder="Add details about this requirement..." 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="min-h-[60px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Start Date</label>
                                    <Input 
                                        type="date" 
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Deadline</label>
                                    <Input 
                                        type="date" 
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setEditingItem(null); }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                {editingItem ? 'Update' : 'Add Item'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Requirement</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this compliance requirement?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingItemId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deletingItemId && deleteMutation.mutate(deletingItemId)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
