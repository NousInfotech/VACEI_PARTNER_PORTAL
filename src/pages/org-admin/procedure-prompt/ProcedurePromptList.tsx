import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Globe, 
  Building, 
  Layers, 
  Tag, 
  MessageSquare 
} from 'lucide-react';
import { Button } from '../../../ui/Button';
import { PageHeader } from '../../common/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiDelete } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import { Skeleton } from '../../../ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/Table';
import { ShadowCard } from '../../../ui/ShadowCard';
import AlertMessage from '../../common/AlertMessage';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { useAuth } from '../../../context/auth-context-core';
import type { ProcedurePrompt, ProcedurePromptListResponse } from '../../../types/procedure-prompt';

const ProcedurePromptList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organizationMember } = useAuth();
  const orgId = organizationMember?.organizationId;
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['procedure-prompts', orgId],
    queryFn: () => apiGet<ProcedurePromptListResponse>(endPoints.PROCEDURE_PROMPT.GET_ALL, { organizationId: orgId }),
    enabled: !!orgId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(endPoints.PROCEDURE_PROMPT.DELETE(id)),
    onSuccess: () => {
      setAlert({ message: 'Procedure prompt deleted successfully', variant: 'success' });
      setDeleteModal({ isOpen: false, id: '', name: '' });
      queryClient.invalidateQueries({ queryKey: ['procedure-prompts'] });
    },
    onError: (error: any) => {
      setAlert({ message: error?.message || 'Failed to delete procedure prompt', variant: 'danger' });
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  });

  const prompts = response?.data || [];

  const filteredPrompts = prompts.filter(prompt => 
    prompt.title.toLowerCase().includes(search.toLowerCase()) ||
    (prompt.description && prompt.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Procedure Prompt Management" 
        icon={MessageSquare}
        description="Configure and manage AI procedure prompts for audit planning, fieldwork, and completion."
        actions={
          <Button variant="header" onClick={() => navigate('/dashboard/procedure-prompts/create')}>
            <Plus className="h-5 w-5" />
            Create Prompt
          </Button>
        }
      />

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.name}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => deleteMutation.mutate(deleteModal.id)}
        title="Delete Procedure Prompt"
        description={<>Are you sure you want to delete the procedure prompt <span className="font-bold text-gray-900">"{deleteModal.name}"</span>? This action cannot be undone.</>}
      />

      {alert && (
        <AlertMessage 
          message={alert.message} 
          variant={alert.variant} 
          onClose={() => setAlert(null)} 
        />
      )}

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Search prompts by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-300 focus:border-primary/10 rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-gray-700"
        />
      </div>

      <ShadowCard className="overflow-hidden border border-gray-100 shadow-sm rounded-3xl bg-white">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="py-5 px-6">S.No</TableHead>
              <TableHead>Prompt Title</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6"><Skeleton className="h-5 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell className="px-6"><Skeleton className="h-8 w-12 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : filteredPrompts.length > 0 ? (
              filteredPrompts.map((prompt: ProcedurePrompt, index: number) => {
                const ScopeIcon = prompt.scopeType === 'GLOBAL' ? Globe : Building;
                return (
                  <TableRow key={prompt.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-4 px-6 font-bold text-gray-400 text-xs">
                      {(index + 1).toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col max-w-md">
                        <span className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight truncate">
                          {prompt.title}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                          {prompt.description || 'No description provided'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        prompt.scopeType === 'GLOBAL' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                      }`}>
                        <ScopeIcon className="h-3 w-3" />
                        {prompt.scopeType}
                        {prompt.organization && <span className="ml-1 opacity-70">({prompt.organization.name})</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-600 border-amber-100">
                        <Layers className="h-3 w-3" />
                        {prompt.procedureType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-green-50 text-green-600 border-green-100">
                        <Tag className="h-3 w-3" />
                        {prompt.category}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        {/* Only allow editing organizational prompts within the same org */}
                        {(prompt.scopeType === 'ORGANIZATIONAL' && prompt.organizationId === orgId) && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="rounded-xl border-gray-200 text-gray-600"
                              onClick={() => navigate(`/dashboard/procedure-prompts/${prompt.id}/edit`)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="rounded-xl border-gray-200 text-amber-600 hover:bg-amber-50"
                              onClick={() => setDeleteModal({ isOpen: true, id: prompt.id, name: prompt.title })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-32 text-center text-gray-500 font-medium">
                  No procedure prompts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ShadowCard>
    </div>
  );
};

export default ProcedurePromptList;
