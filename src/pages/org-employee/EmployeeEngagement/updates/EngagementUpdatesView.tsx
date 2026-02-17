import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    MessageSquare, 
    Plus, 
    Edit2, 
    Trash2, 
    Loader2, 
    Send,
    Clock
} from 'lucide-react';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { Button } from '../../../../ui/Button';
import { Input } from '../../../../ui/input';
import { Textarea } from '../../../../ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../../ui/Dialog';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../../config/base';
import { useAuth } from '../../../../context/auth-context-core';

interface UpdateItem {
    id: string;
    message: string;
    title?: string | null;
    createdAt: string;
    updatedAt: string;
    createdById: string;
    creator?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

interface ApiResponse<T> {
    data: T;
    message?: string;
}

export default function EngagementUpdatesView({ engagementId }: { engagementId?: string }) {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<UpdateItem | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        message: ''
    });

    const { data: updates = [], isLoading } = useQuery({
        queryKey: ['engagement-updates', engagementId],
        enabled: !!engagementId,
        queryFn: async () => {
            if (!engagementId) return [];
            const res = await apiGet<ApiResponse<UpdateItem[]>>(
                `/engagements/${engagementId}/updates`
            );
            return res?.data ?? [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (payload: { title: string; message: string }) => {
            return apiPost(`/engagements/${engagementId}/updates`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-updates', engagementId] });
            setIsAddModalOpen(false);
            setFormData({ title: '', message: '' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: { title: string; message: string } }) => {
            return apiPatch(`/engagements/${engagementId}/updates/${id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-updates', engagementId] });
            setEditingItem(null);
            setFormData({ title: '', message: '' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiDelete(`/engagements/${engagementId}/updates/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-updates', engagementId] });
            setDeletingItemId(null);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, payload: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Engagement Updates</h2>
                <Button onClick={() => { setEditingItem(null); setFormData({ title: '', message: '' }); setIsAddModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Update
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : updates.length === 0 ? (
                <ShadowCard className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No updates yet</h3>
                    <p className="text-gray-500 mt-2">Post an update to keep the team informed.</p>
                </ShadowCard>
            ) : (
                <div className="space-y-4">
                    {updates.map((update) => (
                        <ShadowCard key={update.id} className="p-4 border-l-4 border-l-primary/30 group transition-all duration-300 hover:shadow-md">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Clock className="h-3 w-3" />
                                            <span className="font-medium">{new Date(update.createdAt).toLocaleString(undefined, { 
                                                month: 'short', 
                                                day: 'numeric', 
                                                year: 'numeric', 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}</span>
                                        </div>
                                    </div>
                                    {update.title && (
                                        <h4 className="text-base font-bold text-slate-900 mt-1">{update.title}</h4>
                                    )}
                                    <p className="text-gray-600 mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed">{update.message}</p>
                                </div>
                                
                                {update.createdById === currentUser?.id && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            setEditingItem(update);
                                            setFormData({
                                                title: update.title || '',
                                                message: update.message
                                            });
                                            setIsAddModalOpen(true);
                                        }}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => setDeletingItemId(update.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </ShadowCard>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={isAddModalOpen || !!editingItem} onOpenChange={() => { setIsAddModalOpen(false); setEditingItem(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Update' : 'New Update'}</DialogTitle>
                        <DialogDescription>
                            Share an update with the engagement team.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Update Title</label>
                            <Input 
                                placeholder="Short summary of the update..." 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Detailed Message</label>
                            <Textarea 
                                placeholder="Provide more context here..." 
                                value={formData.message}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, message: e.target.value})}
                                className="min-h-[120px]"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setEditingItem(null); }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                {editingItem ? 'Update' : 'Post Update'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Update</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this update? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center">
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
