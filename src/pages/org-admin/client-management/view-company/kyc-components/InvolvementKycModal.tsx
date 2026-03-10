import React, { useState, useEffect } from 'react';
import { X, UserPlus, Plus, Loader2, Info, Trash2, LayoutGrid, CheckCircle2, User, FileText, ArrowLeft, CheckSquare, Square, Check } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from 'sonner';
import { Button } from '../../../../../ui/Button';
import { apiGet, apiPost, apiPostFormData } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import { cn } from '../../../../../lib/utils';
import type { CompanyInvolvement } from '../../../../../types/company';
import type { KycWorkflow } from './types';
import type { Template, TemplateListResponse, DocumentRequestContent } from '../../../../../types/template';

interface InvolvementKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  kycId: string;
  type?: 'Shareholder' | 'Representative' | 'Director';
  workflows: KycWorkflow[];
  onSuccess: () => void;
  // For adding to existing
  existingInvolvementKycId?: string;
  existingDocumentRequestId?: string;
}

const InvolvementKycModal: React.FC<InvolvementKycModalProps> = ({
  isOpen,
  onClose,
  companyId,
  kycId,
  type: initialType,
  workflows,
  onSuccess,
  existingInvolvementKycId: initialExistingInvolvementKycId,
  existingDocumentRequestId: initialExistingDocumentRequestId,
}) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: Select Involvement, 2: Configure Docs (if creating new)
  const [selectedInvolvementId, setSelectedInvolvementId] = useState<string>('');
  const [activeRoleTab, setActiveRoleTab] = useState<'Shareholder' | 'Representative'>(initialType === 'Representative' ? 'Representative' : 'Shareholder');

  const [existingInvolvementKycId, setExistingInvolvementKycId] = useState<string | undefined>(initialExistingInvolvementKycId);
  const [existingDocumentRequestId, setExistingDocumentRequestId] = useState<string | undefined>(initialExistingDocumentRequestId);
  
  const [viewingExistingKycId, setViewingExistingKycId] = useState<string | null>(null);

  const [creationMode, setCreationMode] = useState<'MANUAL' | 'TEMPLATE'>('TEMPLATE');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    documentName: "",
    isMandatory: true,
    count: 'SINGLE' as 'SINGLE' | 'MULTIPLE',
    type: 'DIRECT' as 'DIRECT' | 'TEMPLATE',
    templateInstructions: "",
    templateFile: null as File | null,
    multipleItems: [{ label: "", instruction: "", isMandatory: true, templateFile: null as File | null }] as any[],
  });

  const [templateStep, setTemplateStep] = useState<'LIST' | 'DETAILS'>('LIST');
  const [selectedTemplateDocs, setSelectedTemplateDocs] = useState<any[]>([]);

  const { data: templatesResponse, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ['templates', 'DOCUMENT_REQUEST', 'KYC'],
    queryFn: () => apiGet<TemplateListResponse>(`${endPoints.TEMPLATE.GET_ALL}?moduleType=KYC&type=DOCUMENT_REQUEST`),
    enabled: isOpen,
  });
  const kycTemplates = templatesResponse?.data || [];

  useEffect(() => {
    if (initialExistingInvolvementKycId) {
      setStep(2);
      setExistingInvolvementKycId(initialExistingInvolvementKycId);
      setExistingDocumentRequestId(initialExistingDocumentRequestId);
    } else {
      setExistingInvolvementKycId(undefined);
      setExistingDocumentRequestId(initialExistingDocumentRequestId);
      setViewingExistingKycId(null);
    }
  }, [initialExistingInvolvementKycId, initialExistingDocumentRequestId, isOpen]);

  const { data: allInvolvements, isLoading: isInvolvementsLoading } = useQuery<CompanyInvolvement[]>({
    queryKey: ['involvements', companyId],
    queryFn: () => apiGet<{ data: CompanyInvolvement[] }>(endPoints.INVOLVEMENT.GET_BY_COMPANY(companyId)).then(res => res.data),
    enabled: isOpen && !existingInvolvementKycId,
  });

  const availableInvolvements = allInvolvements?.filter(inv => {
    const roleToMatch = activeRoleTab === 'Shareholder' ? 'SHAREHOLDER' : 'LEGAL_REPRESENTATIVE';
    return inv.role?.includes(roleToMatch as any);
  }) || [];

  const checkExistingKyc = (inv: CompanyInvolvement) => {
    const personId = inv.person?.id || inv.holderCompany?.id;
    if (!personId) return { exists: false };

    // Check if this person already has a KYC workflow (any type)
    const existingWorkflow = workflows.find(w => 
      w.documentRequests.some(dr => dr.person?._id === personId)
    );
    
    if (existingWorkflow) {
      const isCurrentRoleLinked = existingWorkflow.workflowType === activeRoleTab;
      return {
        exists: true,
        isCurrentRoleLinked,
        workflowId: existingWorkflow._id,
        documentRequestId: existingWorkflow.documentRequests[0]._id
      };
    }
    return { exists: false };
  };

  const createInvolvementKycMutation = useMutation({
    mutationFn: async () => {
        // 1. Link Involvement
        const res = await apiPost<any>(endPoints.COMPANY.KYC(companyId) + `/${kycId}/involvement-kyc`, { 
            involvementId: selectedInvolvementId 
        });
        const drId = res.data.documentRequestId;
        
        // 2. Add Requested Document(s)
        if (creationMode === 'TEMPLATE') {
            await submitTemplateDocs(drId, selectedTemplateDocs);
        } else {
            await submitDocRequest(drId);
        }
        return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-cycle', companyId] });
      toast.success('Involvement KYC linked successfully!', {
        description: 'The document requests have been created.',
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error('Failed to link involvement', {
        description: error?.response?.data?.message || error?.message || 'An unexpected error occurred.',
      });
    }
  });

  const addDocRequestOnlyMutation = useMutation({
    mutationFn: () => {
        if (creationMode === 'TEMPLATE') {
            return submitTemplateDocs(existingDocumentRequestId!, selectedTemplateDocs);
        } else {
            return submitDocRequest(existingDocumentRequestId!);
        }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-cycle', companyId] });
      toast.success('Document request added successfully!', {
        description: 'The new document request has been added to this involvement.',
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error('Failed to add document request', {
        description: error?.response?.data?.message || error?.message || 'An unexpected error occurred.',
      });
    }
  });

  const submitTemplateDocs = async (documentRequestId: string, docs?: any[]) => {
    if (!selectedTemplate) return;
    const content = selectedTemplate.content as DocumentRequestContent;
    const documentsToCreate = docs || content.documents;

    for (const rd of documentsToCreate) {
        const fd = new FormData();
        fd.append("documentName", rd.documentName);
        fd.append("description", rd.description || "");
        fd.append("type", rd.type);
        fd.append("count", rd.count);
        fd.append("isMandatory", String(rd.isMandatory));
        if (rd.type === 'TEMPLATE' && rd.count === 'SINGLE' && rd.templateFileId) {
          fd.append("templateFileId", rd.templateFileId);
        }
        
        const res = await apiPostFormData<any>(
            endPoints.DOCUMENT_REQUESTS.DOCUMENTS(documentRequestId), 
            fd
        );

        if (rd.count === 'MULTIPLE' && rd.multipleItems && rd.multipleItems.length > 0) {
            const parentId = res.data.id;
            for (const child of rd.multipleItems) {
                const childFd = new FormData();
                childFd.append("documentName", child.label || rd.documentName);
                childFd.append("description", child.instruction || "");
                childFd.append("type", rd.type);
                childFd.append("count", 'SINGLE');
                childFd.append("isMandatory", String(child.templateFileId ? true : true)); // defaulting to true since it's not strictly typed in multipleItems for templates yet
                childFd.append("parentId", parentId);
                if (rd.type === 'TEMPLATE' && child.templateFileId) {
                  childFd.append("templateFileId", child.templateFileId);
                }
                await apiPostFormData(endPoints.DOCUMENT_REQUESTS.DOCUMENTS(documentRequestId), childFd);
            }
        }
    }
  };

  const submitDocRequest = async (documentRequestId: string) => {
    const parentFd = new FormData();
    parentFd.append("documentName", formData.documentName);
    parentFd.append("description", "");
    parentFd.append("type", formData.type);
    parentFd.append("count", formData.count);
    parentFd.append("isMandatory", String(formData.isMandatory));
    
    if (formData.type === 'TEMPLATE' && formData.count === 'SINGLE' && formData.templateFile) {
      parentFd.append("template", formData.templateFile);
    }
    
    const parentRes = await apiPostFormData<any>(
      endPoints.DOCUMENT_REQUESTS.DOCUMENTS(documentRequestId), 
      parentFd
    );
    
    const parentId = parentRes.data.id;
    
    if (formData.count === 'MULTIPLE' && formData.multipleItems.length > 0) {
      for (const item of formData.multipleItems) {
        if (!item.label) continue;
        const childFd = new FormData();
        childFd.append("documentName", item.label);
        childFd.append("description", item.instruction || "");
        childFd.append("type", formData.type);
        childFd.append("count", 'SINGLE');
        childFd.append("isMandatory", String(item.isMandatory ?? true));
        childFd.append("parentId", parentId);
        if (formData.type === 'TEMPLATE' && item.templateFile) {
          childFd.append("template", item.templateFile);
        }
        await apiPostFormData(endPoints.DOCUMENT_REQUESTS.DOCUMENTS(documentRequestId), childFd);
      }
    }
  };

  const handleScrollToView = (personId: string) => {
    onClose();
    setTimeout(() => {
        const element = document.getElementById(`kyc-card-${personId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
            setTimeout(() => element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 3000);
        }
    }, 100);
  };



  const isPending = createInvolvementKycMutation.isPending || addDocRequestOnlyMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-hidden">
      <div 
        className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 bg-gray-50/30">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
              <UserPlus size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {existingInvolvementKycId ? "Add Document Request" : `Link Involvement`}
              </h3>
              <p className="text-xs text-gray-500 font-medium">Configure documentation requirements</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isPending} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed">
            <X size={20} />
          </button>
        </div>

        <div className="flex px-8 py-2 border-b border-gray-50 bg-gray-50/10">
            <button 
                disabled={isPending}
                onClick={() => { setActiveRoleTab('Shareholder'); setViewingExistingKycId(null); }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 disabled:opacity-40 disabled:cursor-not-allowed ${activeRoleTab === 'Shareholder' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
                Shareholder
            </button>
            <button 
                disabled={isPending}
                onClick={() => { setActiveRoleTab('Representative'); setViewingExistingKycId(null); }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 disabled:opacity-40 disabled:cursor-not-allowed ${activeRoleTab === 'Representative' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
                Representative
            </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {!existingInvolvementKycId && step === 1 && (
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <User size={14} /> Select {activeRoleTab}
              </label>
              <div className="grid grid-cols-1 gap-3">
                {isInvolvementsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                    <Loader2 size={28} className="animate-spin text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-widest">Loading involvements...</p>
                  </div>
                ) : availableInvolvements.length > 0 ? (
                  availableInvolvements.map(inv => {
                    const kycStatus = checkExistingKyc(inv);
                    const personId = inv.person?.id || inv.holderCompany?.id || '';
                    
                    return (
                      <div key={inv.id} className="space-y-2">
                        <button
                          disabled={isPending}
                          onClick={() => {
                            if (kycStatus.exists) {
                                setViewingExistingKycId(viewingExistingKycId === inv.id ? null : inv.id);
                            } else {
                                setSelectedInvolvementId(inv.id);
                                setStep(2);
                            }
                          }}
                          className={`w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between transition-all text-left group disabled:opacity-40 disabled:cursor-not-allowed ${kycStatus.exists && viewingExistingKycId !== inv.id ? 'hover:border-amber-200 hover:bg-amber-50/50' : 'hover:border-primary hover:bg-primary/5'} ${viewingExistingKycId === inv.id ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-400/20' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-white border rounded-xl flex items-center justify-center transition-all font-bold ${viewingExistingKycId === inv.id ? 'border-amber-200 text-amber-600' : 'border-gray-200 text-gray-400 group-hover:text-primary'}`}>
                              {(inv.person?.name || inv.holderCompany?.name || '?').charAt(0)}
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${viewingExistingKycId === inv.id ? 'text-amber-900' : 'text-gray-900'}`}>{inv.person?.name || inv.holderCompany?.name}</p>
                              <p className={`text-[10px] uppercase font-bold tracking-tight ${viewingExistingKycId === inv.id ? 'text-amber-600' : 'text-gray-400'}`}>{inv.partyType}</p>
                            </div>
                          </div>
                          {!kycStatus.exists && <Plus size={18} className="text-gray-300 group-hover:text-primary" />}
                          {kycStatus.exists && <CheckCircle2 size={18} className={viewingExistingKycId === inv.id ? "text-amber-500" : "text-emerald-500"} />}
                        </button>
                        
                        {kycStatus.exists && viewingExistingKycId === inv.id && (
                          <div className="px-4 py-3 bg-amber-50/50 rounded-xl border border-amber-100 flex flex-col gap-2">
                            <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1.5 leading-tight">
                              <Info size={12} className="shrink-0" />
                              This person already has a KYC. If you want to create a document for the {activeRoleTab} role, please use the ‘Add Document’ button.
                            </p>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    disabled={isPending}
                                    className="h-7 text-[9px] uppercase font-bold text-amber-700 hover:bg-amber-100"
                                    onClick={() => handleScrollToView(personId)}
                                >
                                    View
                                </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-400 italic text-sm border-2 border-dashed rounded-3xl border-gray-100">
                    No additional {activeRoleTab.toLowerCase()}s available to link.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              {(selectedInvolvementId || existingInvolvementKycId) && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/10 mb-4">
                   <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary font-bold shadow-sm">
                      {(allInvolvements?.find(i => i.id === selectedInvolvementId)?.person?.name || 
                        workflows.find(w => w._id === existingInvolvementKycId)?.documentRequests[0].person?.name || '?').charAt(0)}
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">
                        Target: {allInvolvements?.find(i => i.id === selectedInvolvementId)?.person?.name || 
                                allInvolvements?.find(i => i.id === selectedInvolvementId)?.holderCompany?.name ||
                                workflows.find(w => w._id === existingInvolvementKycId)?.documentRequests[0].person?.name}
                      </p>
                   </div>
                   {!initialExistingInvolvementKycId && (
                     <Button size="sm" variant="ghost" disabled={isPending} onClick={() => { setStep(1); setExistingInvolvementKycId(undefined); }} className="text-[10px] uppercase font-bold text-primary">Change</Button>
                   )}
                </div>
              )}

              <div className="flex bg-gray-100 p-1 rounded-2xl mb-2">
                <button 
                  disabled={isPending}
                  onClick={() => setCreationMode('TEMPLATE')}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${creationMode === 'TEMPLATE' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Template Mode
                </button>
                <button 
                  disabled={isPending}
                  onClick={() => setCreationMode('MANUAL')}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${creationMode === 'MANUAL' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Manual Entry
                </button>
              </div>

              {creationMode === 'TEMPLATE' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  {templateStep === 'LIST' ? (
                    <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 space-y-4">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <LayoutGrid size={16} /> Select a Template
                      </div>
                      
                      {isTemplatesLoading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
                      ) : kycTemplates.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {kycTemplates.map(template => (
                            <div 
                              key={template.id}
                              onClick={() => {
                                setSelectedTemplate(template);
                                setSelectedTemplateDocs((template.content as DocumentRequestContent)?.documents || []);
                                setTemplateStep('DETAILS');
                              }}
                              className="p-4 bg-white border border-gray-100 rounded-2xl transition-all cursor-pointer group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                  <FileText size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{template.name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium line-clamp-1">{template.description || 'Standard KYC requirements'}</p>
                                </div>
                              </div>
                              <div className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest">Configure &rarr;</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 p-4 bg-white rounded-xl border border-dashed text-center">No KYC templates found.</div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pl-1">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-primary font-bold text-sm">
                             <button onClick={() => setTemplateStep('LIST')} className="p-1 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-primary"><ArrowLeft size={16} /></button>
                             Docs from: {selectedTemplate?.name}
                          </div>
                          <button 
                            onClick={() => {
                                const allDocs = (selectedTemplate?.content as DocumentRequestContent)?.documents || [];
                                if (selectedTemplateDocs.length === allDocs.length) {
                                  setSelectedTemplateDocs([]);
                                } else {
                                  setSelectedTemplateDocs(allDocs);
                                }
                            }}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary mt-1 hover:opacity-80 transition-opacity ml-8"
                          >
                            {selectedTemplateDocs.length === ((selectedTemplate?.content as DocumentRequestContent)?.documents || []).length && selectedTemplateDocs.length > 0 ? (
                              <><CheckSquare size={12} /> Deselect All</>
                            ) : (
                              <><Square size={12} /> Select All</>
                            )}
                          </button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedTemplate(null); setSelectedTemplateDocs([]); setTemplateStep('LIST'); }} className="h-7 text-[9px] font-black uppercase tracking-widest text-primary">Back</Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
                        {((selectedTemplate?.content as DocumentRequestContent)?.documents || []).map((doc, idx) => {
                          const isSelected = selectedTemplateDocs.some(d => d.documentName === doc.documentName);
                          return (
                            <div 
                              key={idx} 
                              onClick={() => {
                                setSelectedTemplateDocs(prev => {
                                    const exists = prev.find(d => d.documentName === doc.documentName);
                                    if (exists) {
                                      return prev.filter(d => d.documentName !== doc.documentName);
                                    }
                                    return [...prev, doc];
                                  });
                              }}
                              className={cn(
                                "p-4 border rounded-2xl transition-all cursor-pointer group flex items-center justify-between",
                                isSelected 
                                  ? "bg-primary/5 border-primary/30 shadow-md shadow-primary/5" 
                                  : "bg-gray-50 border-transparent hover:border-primary/20 hover:bg-white"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm",
                                  isSelected ? "bg-primary text-white" : "bg-white text-gray-400 group-hover:text-primary"
                                )}>
                                  {isSelected ? <Check size={16} /> : <FileText size={16} />}
                                </div>
                                <div>
                                    <p className={cn(
                                    "text-sm font-bold transition-colors",
                                    isSelected ? "text-primary" : "text-gray-700 group-hover:text-gray-900"
                                    )}>{doc.documentName}</p>
                                    <p className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{doc.description}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 items-center">
                                {doc.isMandatory && <span className="text-[8px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded uppercase">Mandatory</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Document Name</label>
                      <input 
                        value={formData.documentName} 
                        onChange={e => setFormData({...formData, documentName: e.target.value})} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                        placeholder="e.g. Passport Copy" 
                        required 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type</label>
                      <select 
                        className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium outline-none" 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                      >
                        <option value="DIRECT">Direct Upload</option>
                        <option value="TEMPLATE">Template Based</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Copy Mode</label>
                      <select 
                        className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium outline-none" 
                        value={formData.count} 
                        onChange={e => setFormData({...formData, count: e.target.value as any})}
                      >
                        <option value="SINGLE">Single Copy</option>
                        <option value="MULTIPLE">Multiple Copies (Group)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <div className="flex items-center h-5">
                        <input 
                          type="checkbox" 
                          id="modal-isMandatory" 
                          className="h-5 w-5 rounded-lg border-gray-200 text-primary focus:ring-primary/20 transition-all cursor-pointer" 
                          checked={formData.isMandatory} 
                          onChange={e => setFormData({...formData, isMandatory: e.target.checked})} 
                        />
                      </div>
                      <label htmlFor="modal-isMandatory" className="text-sm font-bold text-gray-600 cursor-pointer">Mark as Mandatory</label>
                    </div>
                  </div>

                  {formData.type === 'TEMPLATE' && formData.count === 'SINGLE' && (
                    <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                      <div className="flex items-center gap-2 text-blue-800 font-bold text-sm"><Info size={16} /> Template Configuration</div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Template File</label>
                        <input 
                            type="file" 
                            className="w-full text-xs text-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-all" 
                            onChange={(e) => setFormData({...formData, templateFile: e.target.files?.[0] || null})} 
                        />
                      </div>
                    </div>
                  )}

                  {formData.count === 'MULTIPLE' && (
                    <div className="p-6 bg-purple-50/50 rounded-[32px] border border-purple-100 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                          <LayoutGrid size={16} /> Multiple Copy Labels
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          disabled={isPending}
                          onClick={() => setFormData({...formData, multipleItems: [...formData.multipleItems, { label: "", instruction: "", isMandatory: true, templateFile: null }]})} 
                          className="bg-white rounded-xl h-8 text-[10px] font-black uppercase tracking-widest border-purple-200 text-purple-600 hover:bg-purple-100"
                        >
                          <Plus size={14} className="mr-1" /> Add Label
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {formData.multipleItems.map((item, idx) => (
                          <div key={idx} className="p-5 bg-white rounded-2xl border border-purple-100 shadow-sm space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Label {idx + 1}</label>
                                <input 
                                    value={item.label} 
                                    onChange={e => { const newItems = [...formData.multipleItems]; newItems[idx].label = e.target.value; setFormData({...formData, multipleItems: newItems}); }} 
                                    placeholder="e.g. Page 1" 
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium focus:ring-1 focus:ring-purple-200" 
                                />
                              </div>
                              {formData.multipleItems.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" disabled={isPending} onClick={() => { const newItems = formData.multipleItems.filter((_, i) => i !== idx); setFormData({...formData, multipleItems: newItems}); }} className="mt-6 text-red-500 hover:bg-red-50 rounded-xl">
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instruction</label>
                                <input 
                                    value={item.instruction} 
                                    onChange={e => { const newItems = [...formData.multipleItems]; newItems[idx].instruction = e.target.value; setFormData({...formData, multipleItems: newItems}); }} 
                                    placeholder="Specific to this item..." 
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-medium" 
                                />
                              </div>
                              {formData.type === 'TEMPLATE' && (
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Template File</label>
                                  <input 
                                    type="file" 
                                    className="w-full text-[10px] text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200" 
                                    onChange={e => { const newItems = [...formData.multipleItems]; newItems[idx].templateFile = e.target.files?.[0] || null; setFormData({...formData, multipleItems: newItems}); }} 
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-2 rounded-xl border-gray-200 text-gray-500 hover:bg-white h-11 font-bold uppercase tracking-widest text-[10px]"
          >
            Cancel
          </Button>
          {(existingInvolvementKycId || step === 2) && (
            <Button
              onClick={() => {
                if (existingInvolvementKycId) addDocRequestOnlyMutation.mutate();
                else createInvolvementKycMutation.mutate();
              }}
              disabled={isPending || (creationMode === 'TEMPLATE' && (templateStep === 'LIST' || selectedTemplateDocs.length === 0)) || (creationMode === 'MANUAL' && !formData.documentName) || (step === 2 && !existingInvolvementKycId && !selectedInvolvementId)}
              className="px-8 py-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all h-11 font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {existingInvolvementKycId ? "Add Request" : "Link & Create"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvolvementKycModal;
