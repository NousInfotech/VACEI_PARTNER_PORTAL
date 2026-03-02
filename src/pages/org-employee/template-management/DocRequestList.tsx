import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, Search, Plus, FileText, Globe, Building } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/Table';
import { Skeleton } from '../../../ui/Skeleton';
import { ShadowCard } from '../../../ui/ShadowCard';
import AlertMessage from '../../common/AlertMessage';
import { DeleteConfirmModal } from '../../org-admin/components/DeleteConfirmModal';
import { apiGet, apiDelete } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import type { Template, TemplateListResponse, TemplateModuleType, Services } from '../../../types/template';
import { ALL_SERVICES, SERVICES_LABELS } from '../../../types/template';
import { useAuth } from '../../../context/auth-context-core';

interface Props {
  moduleType: TemplateModuleType;
  showServiceFilter?: boolean;
}

const DocRequestList: React.FC<Props> = ({ moduleType, showServiceFilter }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organizationMember } = useAuth();
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<Services | ''>('');
  const [alert, setAlert] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false, id: '', name: '',
  });

  const queryParams: Record<string, string> = {
    type: 'DOCUMENT_REQUEST',
    moduleType,
    limit: '100',
  };
  if (serviceFilter) queryParams.serviceCategory = serviceFilter;
  if (organizationMember?.organizationId) {
    queryParams.organizationId = organizationMember.organizationId;
  }

  const { data: response, isLoading } = useQuery({
    queryKey: ['templates', 'DOCUMENT_REQUEST', moduleType, serviceFilter, organizationMember?.organizationId],
    queryFn: () => apiGet<TemplateListResponse>(endPoints.TEMPLATE.GET_ALL, queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(endPoints.TEMPLATE.DELETE(id)),
    onSuccess: () => {
      setAlert({ message: 'Template deleted successfully', variant: 'success' });
      setDeleteModal({ isOpen: false, id: '', name: '' });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: () => {
      setAlert({ message: 'Failed to delete template', variant: 'danger' });
      setDeleteModal({ ...deleteModal, isOpen: false });
    },
  });

  const templates = response?.data || [];
  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.name}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => deleteMutation.mutate(deleteModal.id)}
        title="Delete Template"
        description={<>Are you sure you want to delete <span className="font-bold text-gray-900">"{deleteModal.name}"</span>? This action cannot be undone.</>}
      />

      {alert && <AlertMessage message={alert.message} variant={alert.variant} onClose={() => setAlert(null)} />}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative group flex-1 min-w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary/20 rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium text-gray-700"
          />
        </div>

        {showServiceFilter && (
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value as Services | '')}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all"
          >
            <option value="">All Services</option>
            {ALL_SERVICES.map(s => (
              <option key={s} value={s}>{SERVICES_LABELS[s]}</option>
            ))}
          </select>
        )}

        <Button
          variant="header"
          onClick={() => navigate(
            `/dashboard/templates/create?type=DOCUMENT_REQUEST&moduleType=${moduleType}`
          )}
        >
          <Plus className="h-4 w-4" />
          Add Template
        </Button>
      </div>

      <ShadowCard className="overflow-hidden border border-gray-100 shadow-sm rounded-3xl bg-white">
        <Table>
          <TableHeader className="bg-gray-50/60">
            <TableRow>
              <TableHead className="py-4 px-6 w-14">S.No</TableHead>
              <TableHead>Template</TableHead>
              {moduleType === 'ENGAGEMENT' && <TableHead>Service</TableHead>}
              <TableHead>Scope</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6"><Skeleton className="h-4 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-72" /></TableCell>
                  {moduleType === 'ENGAGEMENT' && <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>}
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="px-6"><Skeleton className="h-8 w-24 ml-auto rounded-xl" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((template: Template, index: number) => {
                const ScopeIcon = template.organizationId ? Building : Globe;
                const scopeLabel = template.organizationId ? 'LOCAL' : 'GLOBAL';
                const scopeStyle = template.organizationId
                  ? 'bg-purple-50 text-purple-600 border-purple-100'
                  : 'bg-blue-50 text-blue-600 border-blue-100';
                return (
                  <TableRow key={template.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-4 px-6 font-bold text-gray-400 text-xs">
                      {(index + 1).toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-xl bg-primary/5 text-primary shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight truncate">
                            {template.name}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                            {template.description || 'No description'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    {moduleType === 'ENGAGEMENT' && (
                      <TableCell>
                        {template.serviceCategory ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-green-50 text-green-700 border-green-100">
                            {SERVICES_LABELS[template.serviceCategory]}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${scopeStyle}`}>
                        <ScopeIcon className="h-3 w-3" />
                        {scopeLabel}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
                          onClick={() => navigate(`/dashboard/templates/${template.id}/view`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => navigate(`/dashboard/templates/${template.id}/edit`)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteModal({ isOpen: true, id: template.id, name: template.name })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={moduleType === 'ENGAGEMENT' ? 5 : 4} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <FileText className="h-10 w-10 opacity-30" />
                    <p className="font-medium">No templates found</p>
                    <p className="text-xs">Create your first template using the button above</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ShadowCard>
    </div>
  );
};

export default DocRequestList;
