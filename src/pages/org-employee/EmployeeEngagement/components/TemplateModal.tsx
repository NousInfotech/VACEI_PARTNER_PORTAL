import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/ui/Dialog";

import { Button } from "@/ui/Button";
import { 
  FileJson, 
  Check, 
  Loader2, 
  ChevronRight,
  FileText,
  ListChecks,
  Flag
} from "lucide-react";
import { apiGet, apiPost, apiPostFormData } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { checklistService } from "../checklist/checklistService";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context-core";
import { type TemplateListResponse } from "@/types/template";

type TemplateType = 'DOC_REQUEST' | 'CHECKLIST' | 'MILESTONE';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: TemplateType;
  engagementId: string;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
  engagementId
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const { organizationMember } = useAuth();
  const organizationId = organizationMember?.organizationId;

  // Map internal types to actual backend TemplateType enum
  const getBackendType = (t: TemplateType) => {
    switch (t) {
      case 'DOC_REQUEST': return 'DOCUMENT_REQUEST';
      case 'MILESTONE': return 'MILESTONES';
      case 'CHECKLIST': return 'CHECKLIST';
      default: return t;
    }
  };

  const { data: engagementRes } = useQuery({
    queryKey: ['engagement-details', engagementId],
    enabled: !!engagementId && isOpen,
    queryFn: () => apiGet<any>(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId))
  });

  const engagement = engagementRes?.data;

  const { data: fetchRes, isLoading } = useQuery({
    queryKey: ['org-templates', type, organizationId, engagement?.serviceType, engagement?.customServiceCycleId],
    enabled: !!organizationId && isOpen && !!engagement,
    queryFn: () => apiGet<TemplateListResponse>(endPoints.TEMPLATE.GET_ALL, {
      type: getBackendType(type),
      moduleType: 'ENGAGEMENT',
      organizationId,
      includeGlobal: true,
      serviceCategory: engagement?.serviceType,
      customServiceCycleId: engagement?.customServiceCycleId
    })
  });

  const availableTemplates = fetchRes?.data || [];

  const deployMilestones = async (data: any[]) => {
    for (const item of data) {
      const payload: any = { title: item.title };
      if (item.description) payload.description = item.description;
      await apiPost(endPoints.ENGAGEMENTS.MILESTONES(engagementId), payload);
    }
  };

  const deployDocRequest = async (data: any) => {
    const fd = new FormData();
    fd.append("title", data.title || "Document Request");
    fd.append("description", data.description || "");
    fd.append("engagementId", engagementId);
    
    // The Template interface stores them as 'documents', but the backend expects 'requestedDocuments'
    const docs = data.documents || data.requestedDocuments || [];

    // Map the documents to the schema expected by the Engagement DocumentRequest endpoint
    const formattedDocs = docs.map((doc: any) => {
      const formattedDoc: any = {
        documentName: doc.documentName,
        type: doc.type,
        count: doc.count,
        isMandatory: doc.isMandatory || true,
        description: doc.description || null,
        templateInstructions: doc.templateInstructions || null,
      };

      // The backend Engagement endpoint expects 'children' with 'documentName' instead of 'label'
      if (doc.count === 'MULTIPLE') {
        const items = doc.multipleItems || doc.children || [];
        formattedDoc.children = items.map((item: any) => ({
          documentName: item.label || item.documentName || `Document`,
          templateInstructions: item.instruction || null,
        }));
      }

      return formattedDoc;
    });

    fd.append("requestedDocuments", JSON.stringify(formattedDocs));
    
    // Auto-generate dummy files for TEMPLATE tasks to satisfy backend validation
    const dummyFile = new File(
      ["This is a system-generated template placeholder."], 
      "template-placeholder.pdf", 
      { type: "application/pdf" }
    );

    formattedDocs.forEach((rd: any) => {
      if (rd.type === 'TEMPLATE') {
        if (rd.count === 'SINGLE') {
          fd.append("templates", dummyFile);
        } else if (rd.count === 'MULTIPLE' && rd.children) {
          rd.children.forEach(() => {
            fd.append("templates", dummyFile);
          });
        }
      }
    });

    await apiPostFormData(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId) + '/document-request', fd);
  };

  const deployChecklist = async (data: any[]) => {
    // data is a flattened array from the template builder
    const idMap: Record<string, string> = {}; // maps template UUIDs to backend DB IDs
    for (const item of data) {
      const payload = {
        title: item.title,
        parentId: item.parentId ? idMap[item.parentId] : null,
      };
      // The API returns the strictly generated ID that must be used for children
      const res = await checklistService.create(engagementId, payload as any);
      idMap[item.id] = res.id;
    }
  };

  const handleDeploy = async () => {
    if (!selectedTemplate) return;
    setIsDeploying(true);
    try {
      const templateContent = selectedTemplate.content as any;
      if (type === 'MILESTONE') {
        const steps = Array.isArray(templateContent) ? templateContent : (templateContent?.steps || [templateContent]);
        await deployMilestones(steps);
      } else if (type === 'DOC_REQUEST') {
        await deployDocRequest(templateContent);
      } else if (type === 'CHECKLIST') {
        const items = Array.isArray(templateContent) ? templateContent : (templateContent?.items || []);
        await deployChecklist(items);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Template deployment failed:", error);
      alert("Failed to deploy template. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'DOC_REQUEST': return <FileText className="h-5 w-5" />;
      case 'CHECKLIST': return <ListChecks className="h-5 w-5" />;
      case 'MILESTONE': return <Flag className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 bg-primary/20 rounded-full blur-2xl" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-xl">
                 <FileJson className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-white">Select Template</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              Choose a predefined structure for your {type.replace('_', ' ')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-bold text-gray-400">Loading templates...</p>
            </div>
          ) : availableTemplates.map((tpl: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setSelectedTemplate(tpl)}
              className={cn(
                "w-full p-4 rounded-2xl border transition-all duration-300 text-left flex items-center justify-between group",
                selectedTemplate === tpl 
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" 
                  : "border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl transition-colors",
                  selectedTemplate === tpl ? "bg-primary text-white" : "bg-white text-gray-400 group-hover:text-primary"
                )}>
                  {getIcon()}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 tracking-tight">{tpl.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {type === 'CHECKLIST' ? 'Hierarchical Setup' : 
                     type === 'MILESTONE' ? `${Array.isArray(tpl.content) ? tpl.content.length : 1} Markers` : 
                     'Document Request Group'}
                  </p>
                </div>
              </div>
              <ChevronRight className={cn(
                "h-5 w-5 transition-transform",
                selectedTemplate === tpl ? "text-primary translate-x-1" : "text-gray-300"
              )} />
            </button>
          ))}

          {!isLoading && availableTemplates.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto text-gray-300">
                <FileJson size={32} />
              </div>
              <p className="text-gray-500 font-bold text-sm">No templates available for this category.</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 pt-0 flex gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-12 rounded-2xl font-bold text-gray-400"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeploy} 
            disabled={!selectedTemplate || isDeploying}
            className="flex-2 h-12 rounded-2xl font-black bg-slate-900 text-white shadow-xl hover:bg-black transition-all"
          >
            {isDeploying ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {isDeploying ? 'Deploying...' : 'Use Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
