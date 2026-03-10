import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, Plus, Loader2, CheckCircle2, LayoutGrid, Trash2, CheckSquare, Square, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../../../ui/Button';
import { apiGet, apiPostFormData, apiPost } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import { cn } from '../../../../../lib/utils';

interface AddRequestedDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentRequestId: string;
  parentId?: string | null;
  onSuccess?: () => void;
  isNewCategory?: boolean;
  cycleId?: string;
  moduleType?: TemplateModuleType;
  defaultCategoryName?: string;
}

import type { TemplateModuleType } from '../../../../../types/template';

const AddRequestedDocumentModal: React.FC<AddRequestedDocumentModalProps> = ({
  isOpen,
  onClose,
  documentRequestId: initialDocumentRequestId,
  parentId = null,
  onSuccess,
  isNewCategory = false,
  cycleId,
  moduleType = 'KYC',
  defaultCategoryName,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    categoryName: "Document Request",
    documentName: "",
    type: "DIRECT" as "DIRECT" | "TEMPLATE",
    count: "SINGLE" as "SINGLE" | "MULTIPLE",
    instruction: "",
    templateFile: null as File | null,
    templateFileId: null as string | null,
    isMandatory: true,
    multipleItems: [{ label: "", instruction: "", isMandatory: true, templateFile: null as File | null, templateFileId: null as string | null }] as any[],
  });

  const [isFromTemplate, setIsFromTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedTemplateDocs, setSelectedTemplateDocs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (isOpen && defaultCategoryName) {
      setFormData(prev => ({ ...prev, categoryName: defaultCategoryName }));
    }
  }, [isOpen, defaultCategoryName]);

  useEffect(() => {
    if (isOpen && isFromTemplate) {
      fetchTemplates();
    }
  }, [isOpen, isFromTemplate, moduleType]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await apiGet<any>(`${endPoints.TEMPLATE.GET_ALL}?moduleType=${moduleType}&type=DOCUMENT_REQUEST`);
      if (res.success) {
        setTemplates(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };



  const createMutation = useMutation({
    mutationFn: async (directData?: any | any[]) => {
      const docsToCreate = Array.isArray(directData) ? directData : [directData || formData];
      let currentRequestId = initialDocumentRequestId;

      // 0. Create Category IF needed (only once)
      if (isNewCategory && cycleId && !currentRequestId) {
        const firstDoc = docsToCreate[0];
        const body = {
          title: firstDoc.categoryName || formData.categoryName,
          description: `Documents for ${firstDoc.categoryName || formData.categoryName}`
        };

        if (moduleType === 'INCORPORATION') {
          const catRes = await apiPost<any>(endPoints.INCORPORATION.CREATE_DOCUMENT_REQUEST(cycleId), body);
          currentRequestId = catRes.data.id;
        } else {
          // Default to KYC
          const catRes = await apiPost<any>(endPoints.COMPANY.KYC_DOCUMENT_REQUEST(cycleId), body);
          currentRequestId = catRes.data.documentRequest?.id || catRes.data.id;
        }
      }

      if (!currentRequestId) throw new Error("Document Request ID missing");

      for (const data of docsToCreate) {
        // 1. Create parent or SINGLE doc
        const parentFd = new FormData();
        parentFd.append("documentName", data.documentName);
        parentFd.append("type", data.type);
        parentFd.append("count", data.count);
        parentFd.append("isMandatory", String(data.isMandatory));
        parentFd.append("description", data.instruction || data.description || ""); 
        
        if (parentId) {
          parentFd.append("parentId", parentId);
        }
        
        if (data.type === "TEMPLATE" && (data.count === 'SINGLE' || !data.count)) {
          if (data.templateFile) {
            parentFd.append("template", data.templateFile);
          } else if (data.templateFileId) {
            parentFd.append("templateFileId", data.templateFileId);
          }
        }

        const parentRes = await apiPostFormData<any>(endPoints.DOCUMENT_REQUESTS.DOCUMENTS(currentRequestId), parentFd);
        const newParentId = parentRes.data.id;

        // 2. Create children (if MULTIPLE)
        const multipleItems = data.multipleItems || [];
        if (data.count === 'MULTIPLE' && multipleItems.length > 0) {
          for (const item of multipleItems) {
            const childFd = new FormData();
            childFd.append("documentName", item.label || data.documentName);
            childFd.append("type", data.type);
            childFd.append("parentId", newParentId);
            childFd.append("count", "SINGLE");
            childFd.append("isMandatory", String(item.isMandatory ?? true));
            childFd.append("description", item.instruction || "");

            if (data.type === 'TEMPLATE') {
              if (item.templateFile) {
                childFd.append("template", item.templateFile);
              } else if (item.templateFileId) {
                childFd.append("templateFileId", item.templateFileId);
              }
            }
            await apiPostFormData(endPoints.DOCUMENT_REQUESTS.DOCUMENTS(currentRequestId), childFd);
          }
        }
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-cycle"] });
      queryClient.invalidateQueries({ queryKey: ["incorporation-cycle"] });
      queryClient.invalidateQueries({ queryKey: ["document-requests"] });
      if (onSuccess) onSuccess();
      onClose();
      // Reset form
      setFormData({
        categoryName: "Document Request",
        documentName: "",
        type: "DIRECT",
        count: "SINGLE",
        instruction: "",
        templateFile: null,
        templateFileId: null,
        isMandatory: true,
        multipleItems: [{ label: "", instruction: "", isMandatory: true, templateFile: null, templateFileId: null }],
      });
      setIsFromTemplate(false);
      setSelectedTemplate(null);
      setSelectedTemplateDocs([]);
    },
  });

  const toggleSelectDoc = (doc: any) => {
    setSelectedTemplateDocs(prev => {
      const exists = prev.find(d => d.documentName === doc.documentName);
      if (exists) {
        return prev.filter(d => d.documentName !== doc.documentName);
      }
      return [...prev, doc];
    });
  };

  const toggleSelectAll = () => {
    const allDocs = (selectedTemplate?.content as any)?.documents || [];
    if (selectedTemplateDocs.length === allDocs.length) {
      setSelectedTemplateDocs([]);
    } else {
      setSelectedTemplateDocs(allDocs);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-2xl flex flex-col rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 bg-gray-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{isNewCategory ? "Create New Category & Request" : "Add Requested Document"}</h3>
              <p className="text-xs text-gray-500 font-medium">{isNewCategory ? "Set up a new category and its first requirement" : "Define a new requirement for this section"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-2">
            <button
              onClick={() => setIsFromTemplate(false)}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                !isFromTemplate ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-500"
              )}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setIsFromTemplate(true)}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                isFromTemplate ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-500"
              )}
            >
              Pick from Template
            </button>
          </div>

          {!isFromTemplate ? (
            <div className="space-y-4">
            {isNewCategory && (
              <div className="space-y-1.5 focus-within:ring-2 focus-within:ring-primary/10 ring-offset-2 rounded-xl transition-all pb-4 border-b border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1 pl-1">
                  <LayoutGrid size={14} /> Category Name
                </label>
                <input 
                  value={formData.categoryName} 
                  onChange={e => setFormData({...formData, categoryName: e.target.value})} 
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-primary/50 outline-none text-sm font-semibold transition-all"
                  placeholder="e.g. Legal Documents" 
                  required 
                />
              </div>
            )}

            <div className="space-y-1.5 focus-within:ring-2 focus-within:ring-primary/10 ring-offset-2 rounded-xl transition-all">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1 pl-1">
                <FileText size={14} /> Document Title
              </label>
              <input 
                value={formData.documentName} 
                onChange={e => setFormData({...formData, documentName: e.target.value})} 
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-primary/50 outline-none text-sm font-semibold transition-all"
                placeholder="e.g. Identity Proof" 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">Type</label>
                <select 
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-semibold outline-none focus:bg-white focus:border-primary/50 transition-all appearance-none cursor-pointer" 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                >
                  <option value="DIRECT">Direct Upload</option>
                  <option value="TEMPLATE">Template Based</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pl-1">Document Count</label>
                <select 
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-semibold outline-none focus:bg-white focus:border-primary/50 transition-all appearance-none cursor-pointer" 
                  value={formData.count} 
                  onChange={e => setFormData({...formData, count: e.target.value as any})}
                >
                  <option value="SINGLE">Single Document</option>
                  <option value="MULTIPLE">Multiple Documents (Group)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-1">
              <div className="flex items-center h-6">
                <input 
                  type="checkbox" 
                  id="modal-isMandatory-new" 
                  className="h-6 w-6 rounded-lg border-gray-200 text-primary focus:ring-primary/20 transition-all cursor-pointer" 
                  checked={formData.isMandatory} 
                  onChange={e => setFormData({...formData, isMandatory: e.target.checked})} 
                />
              </div>
              <label htmlFor="modal-isMandatory-new" className="text-sm font-bold text-gray-600 cursor-pointer select-none">Mark as Mandatory Requirement</label>
            </div>


            {formData.type === 'TEMPLATE' && formData.count === 'SINGLE' && (
              <div className="space-y-5 p-6 bg-primary/5 rounded-[24px] border border-primary/10 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Upload Template File</label>
                  <div className="relative group">
                    <input 
                        type="file" 
                        id="template-file-input"
                        className="hidden" 
                        onChange={(e) => setFormData({...formData, templateFile: e.target.files?.[0] || null})} 
                    />
                    <label 
                      htmlFor="template-file-input"
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-primary/20 rounded-xl cursor-pointer hover:border-primary transition-all group-hover:shadow-sm"
                    >
                      <span className="text-xs font-semibold text-gray-600 truncate max-w-[200px]">
                        {formData.templateFile ? formData.templateFile.name : "Select template file..."}
                      </span>
                      <Upload size={16} className="text-primary" />
                    </label>
                  </div>
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
                            <Button type="button" variant="ghost" size="icon" onClick={() => { const newItems = formData.multipleItems.filter((_, i) => i !== idx); setFormData({...formData, multipleItems: newItems}); }} className="mt-6 text-red-500 hover:bg-red-50 rounded-xl">
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
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
               {loadingTemplates ? (
                 <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-4">
                   <Loader2 className="animate-spin text-primary" size={32} />
                   <p className="text-[10px] font-black uppercase tracking-widest">Fetching templates...</p>
                 </div>
               ) : !selectedTemplate ? (
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Select a Template</h4>
                   <div className="grid grid-cols-1 gap-3">
                     {templates.map(t => (
                       <div 
                         key={t.id} 
                         onClick={() => setSelectedTemplate(t)}
                         className="p-5 bg-white border border-gray-100 rounded-3xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group flex items-center gap-4"
                       >
                         <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                           <FileText size={24} />
                         </div>
                         <div className="flex-1">
                            <h5 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{t.name}</h5>
                            <p className="text-xs text-gray-500 line-clamp-1">{t.description || 'No description'}</p>
                         </div>
                       </div>
                     ))}
                     {templates.length === 0 && <p className="text-center py-10 text-xs font-bold text-gray-400 uppercase tracking-widest">No templates found for {moduleType}</p>}
                   </div>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between pl-1">
                     <div className="flex flex-col">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Docs from: {selectedTemplate.name}</h4>
                       <button 
                         onClick={toggleSelectAll}
                         className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary mt-1 hover:opacity-80 transition-opacity"
                       >
                         {selectedTemplateDocs.length === (selectedTemplate.content as any).documents?.length && selectedTemplateDocs.length > 0 ? (
                           <><CheckSquare size={12} /> Deselect All</>
                         ) : (
                           <><Square size={12} /> Select All</>
                         )}
                       </button>
                     </div>
                     <Button variant="ghost" size="sm" onClick={() => { setSelectedTemplate(null); setSelectedTemplateDocs([]); }} className="h-7 text-[9px] font-black uppercase tracking-widest text-primary">Back to templates</Button>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                     {(selectedTemplate.content as any).documents?.map((doc: any, idx: number) => {
                       const isSelected = selectedTemplateDocs.some(d => d.documentName === doc.documentName);
                       return (
                         <div 
                           key={idx} 
                           onClick={() => toggleSelectDoc(doc)}
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
                             <span className={cn(
                               "text-sm font-bold transition-colors",
                               isSelected ? "text-primary" : "text-gray-700 group-hover:text-gray-900"
                             )}>{doc.documentName}</span>
                           </div>
                           <div className="flex gap-2">
                             <span className="px-2 py-0.5 bg-white border border-gray-100 rounded-md text-[8px] font-black uppercase tracking-tighter text-gray-400">{doc.type}</span>
                             <span className="px-2 py-0.5 bg-white border border-gray-100 rounded-md text-[8px] font-black uppercase tracking-tighter text-gray-400">{doc.count}</span>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   
                   {selectedTemplateDocs.length > 0 && (
                     <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <Button 
                         onClick={() => createMutation.mutate(selectedTemplateDocs)}
                         disabled={createMutation.isPending}
                         className="w-full h-12 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold uppercase tracking-widest text-[10px]"
                       >
                         {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                         Add {selectedTemplateDocs.length} Selected Documents
                       </Button>
                     </div>
                   )}
                 </div>
               )}
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="px-6 h-12 rounded-2xl text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-gray-600 transition-all"
          >
            Cancel
          </Button>
          {!isFromTemplate && (
            <Button
              onClick={() => createMutation.mutate(undefined)}
              disabled={createMutation.isPending || !formData.documentName || (isNewCategory && !formData.categoryName) || (formData.type === 'TEMPLATE' && formData.count === 'SINGLE' && !formData.templateFile && !formData.templateFileId)}
              className="px-10 h-12 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all font-bold uppercase tracking-widest text-[10px] disabled:opacity-50 disabled:scale-100"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {isNewCategory ? "Create Category & Request" : "Create Request"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddRequestedDocumentModal;
