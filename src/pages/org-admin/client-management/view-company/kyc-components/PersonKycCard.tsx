import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Globe, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Button } from '../../../../../ui/Button';
import type { KycRequestFull } from './types';
import DocumentRequestSingle from './SingleDocumentRequest';
import DocumentRequestDouble from './DoubleDocumentRequest';
import { apiPatch, apiDelete } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import InvolvementKycModal from './InvolvementKycModal';
import AddRequestedDocumentModal from './AddRequestedDocumentModal';
import { ConfirmModal } from '../../../../messages/components/ConfirmModal';
import UnassignedFiles from './UnassignedFiles';


interface PersonKycCardProps {
  personKyc: KycRequestFull;
  companyId: string;
  kycId?: string;
  workflowId: string;
  workflowStatus: string;
  isReadOnly?: boolean;
}

const PersonKycCard: React.FC<PersonKycCardProps> = ({ personKyc, companyId, kycId, workflowId, workflowStatus, isReadOnly }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const queryClient = useQueryClient();
  const { person, documentRequest: request } = personKyc;

  const patchInvolvementStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string; requestId?: string }) => 
      apiPatch(endPoints.COMPANY.KYC(companyId) + `/${kycId}/involvement-kyc/${workflowId}`, { status }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['kyc-cycle', companyId] });
      toast.success('Status updated.');
      // When involvement KYC moves into review, automatically activate its document request
      if (variables.status === 'IN_REVIEW' && variables.requestId) {
        await updateDocRequestStatusMutation.mutateAsync({ requestId: variables.requestId, status: 'ACTIVE' });
      }
    },
    onError: (error: any) => {
      toast.error('Failed to update status', {
        description: error?.response?.data?.message || error?.message || 'Unexpected error'
      });
    }
  });

  const deleteInvolvementMutation = useMutation({
    mutationFn: () => apiDelete(endPoints.COMPANY.KYC(companyId) + `/${kycId}/involvement-kyc/${workflowId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-cycle', companyId] });
    }
  });

  const isAnyActionLoading = patchInvolvementStatusMutation.isPending || deleteInvolvementMutation.isPending;

  const updateDocRequestStatusMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: string }) =>
      apiPatch(endPoints.DOCUMENT_REQUESTS.UPDATE_STATUS(requestId), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-cycle', companyId] });
      toast.success('Document status updated.');
    },
    onError: (error: any) => {
      toast.error('Failed', { description: error?.response?.data?.message || error?.message });
    }
  });

  const docRequestStatuses = ['DRAFT', 'ACTIVE', 'COMPLETED'];
  const docStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  if (!person) return null;

  const totalDocuments = (request.documents?.length || 0) + 
    (request.multipleDocuments?.reduce((acc, md) => acc + (md.multiple?.length || 0), 0) || 0);
  
  const uploadedCount = (request.documents?.filter(d => d.url).length || 0) + 
    (request.multipleDocuments?.reduce((acc, md) => acc + (md.multiple?.filter(item => item.url).length || 0), 0) || 0);

  return (
    <div 
      id={`kyc-card-${personKyc.person?._id}`}
      className="bg-white/80 border border-gray-300 rounded-xl shadow-sm hover:bg-white/70 transition-all overflow-hidden mb-4"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
              {person.name.charAt(0)}
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">{person.name}</h4>
              {person.address && (
                <p className="text-xs font-medium text-gray-500 leading-tight mt-0.5">{person.address}</p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 rounded-lg px-2 py-0.5 text-[11px] font-semibold">
                   {uploadedCount}/{totalDocuments} Documents
                </Badge>
                {/* Document Request Status */}
                <select
                  value={request.status || 'DRAFT'}
                  disabled={isReadOnly}
                  onChange={(e) => updateDocRequestStatusMutation.mutate({ requestId: request._id, status: e.target.value })}
                  className={`appearance-none px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer transition-all ${docStatusBadgeClass(request.status || 'DRAFT')} ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {docRequestStatuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={workflowStatus}
                  disabled={isAnyActionLoading || isReadOnly}
                  onChange={e => {
                    const newStatus = e.target.value;
                    patchInvolvementStatusMutation.mutate({ status: newStatus, requestId: request._id });
                  }}
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-bold border outline-none cursor-pointer transition-all appearance-none pr-5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    workflowStatus === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : workflowStatus === 'IN_REVIEW'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : workflowStatus === 'REJECTED'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  } ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_REVIEW">IN REVIEW</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isReadOnly && (
              <div className="flex items-center gap-2">
                  <Button 
                      size="sm" 
                      variant="ghost"
                      className="rounded-xl h-8 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setConfirmConfig({
                          isOpen: true,
                          title: "Remove Person",
                          message: `Are you sure you want to remove "${person.name}" from the KYC cycle? This action cannot be undone.`,
                          onConfirm: () => {
                              deleteInvolvementMutation.mutate();
                              setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                          },
                          variant: 'danger'
                      })}
                      disabled={isAnyActionLoading}
                  >
                      <Trash2 size={14} />
                  </Button>
              </div>
            )}
            
            <div className="w-px h-6 bg-gray-100 mx-1" />

            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-xl border-gray-100 text-gray-500 hover:text-primary hover:bg-primary/5 h-10 px-4 font-bold uppercase tracking-wider text-[10px]"
            >
                {isExpanded ? <ChevronUp size={16} className="mr-2" /> : <ChevronDown size={16} className="mr-2" />}
                {isExpanded ? 'Hide' : 'View'}
            </Button>
          </div>
        </div>

        {(person.nationality) && (
          <div className="mt-4 flex flex-wrap gap-4 pt-4 border-t border-gray-50">
            {person.nationality && (
              <div className="flex items-center gap-2 text-gray-400">
                <Globe className="h-4 w-4 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{person.nationality}</span>
              </div>
            )}
          </div>
        )}

        {totalDocuments > 0 && (
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Document Progress</span>
              <span className={`text-[10px] font-black ${
                uploadedCount === totalDocuments ? 'text-emerald-600' : 'text-amber-500'
              }`}>{Math.round((uploadedCount / totalDocuments) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-emerald-500"
                style={{ width: `${Math.round((uploadedCount / totalDocuments) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="bg-gray-50/50 border-t border-gray-100 p-6 animate-in slide-in-from-top-2 duration-300 space-y-4">
           
           {(request.documents?.length || 0) + (request.multipleDocuments?.length || 0) > 0 ? (
             <div className="bg-white rounded-[24px] border border-indigo-50/50 p-6 shadow-sm mb-4">
               {(request.unassignedFiles?.length || 0) > 0 && (
                 <div className="mb-4">
                    <UnassignedFiles 
                      requestId={request._id}
                      unassignedFiles={request.unassignedFiles || []}
                      documentRequest={request}
                    />
                 </div>
               )}
               <DocumentRequestSingle 
                 requestId={request._id}
                 documents={request.documents || []}
                 isDisabled={isReadOnly}
               />

               <DocumentRequestDouble 
                 requestId={request._id}
                 multipleDocuments={request.multipleDocuments || []}
                 isDisabled={isReadOnly}
               />
             </div>
           ) : (
             <div className="text-center py-12 bg-white/50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center gap-4">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">No documents requested</p>
                {!isReadOnly && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all text-[10px] uppercase font-bold tracking-widest px-6"
                    onClick={() => setIsAddDocModalOpen(true)}
                  >
                    <Plus className="mr-2 w-3 h-3" />
                    Add First Document
                  </Button>
                )}
             </div>
           )}

            {!isReadOnly && request.status !== 'VERIFIED' && (request.documents?.length || 0) + (request.multipleDocuments?.length || 0) > 0 && (
               <div className="pt-4 flex justify-center">
                   <Button 
                       variant="ghost"
                       size="sm"
                       className="rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all text-[10px] uppercase font-bold tracking-widest px-6"
                       onClick={() => setIsAddDocModalOpen(true)}
                   >
                       <Plus className="mr-2 w-3 h-3" />
                       Add Additional Document
                   </Button>
               </div>
            )}
        </div>
      )}

      {isModalOpen && (
        <InvolvementKycModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          companyId={companyId}
          kycId={kycId || ''}
          type="Shareholder" // Type doesn't matter much for editing, but required by prop
          workflows={[]} // Not used for editing
          onSuccess={() => setIsModalOpen(false)}
          existingInvolvementKycId={workflowId}
          existingDocumentRequestId={request._id}
        />
      )}

      <AddRequestedDocumentModal 
        isOpen={isAddDocModalOpen}
        onClose={() => setIsAddDocModalOpen(false)}
        documentRequestId={request._id}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        variant={confirmConfig.variant}
        confirmLabel="Proceed"
      />
    </div>
  );
};

export default PersonKycCard;
