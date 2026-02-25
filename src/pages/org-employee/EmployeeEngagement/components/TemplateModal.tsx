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
import templates from "@/data/engagementTemplates.json";
import { apiPost, apiPostFormData } from "@/config/base";
import { endPoints } from "@/config/endPoint";
import { checklistService } from "../checklist/checklistService";
import { cn } from "@/lib/utils";

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

  const availableTemplates = templates[type] || [];

  const deployMilestones = async (data: any[]) => {
    for (const item of data) {
      await apiPost(endPoints.ENGAGEMENTS.MILESTONES(engagementId), item);
    }
  };

  const deployDocRequest = async (data: any) => {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("description", data.description);
    fd.append("engagementId", engagementId);
    fd.append("requestedDocuments", JSON.stringify(data.requestedDocuments));
    
    // Auto-generate dummy files for TEMPLATE tasks to satisfy backend validation
    const dummyFile = new File(
      ["This is a system-generated template placeholder."], 
      "template-placeholder.pdf", 
      { type: "application/pdf" }
    );

    data.requestedDocuments.forEach((rd: any) => {
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
    const createRecursive = async (items: any[], parentId: string | null = null) => {
      for (const item of items) {
        const payload = {
          title: item.title,
          parentId: parentId,
        };
        const res = await checklistService.create(engagementId, payload as any);
        if (item.children && item.children.length > 0) {
          await createRecursive(item.children, res.id);
        }
      }
    };
    await createRecursive(data);
  };

  const handleDeploy = async () => {
    if (!selectedTemplate) return;
    setIsDeploying(true);
    try {
      if (type === 'MILESTONE') {
        await deployMilestones(selectedTemplate.data);
      } else if (type === 'DOC_REQUEST') {
        await deployDocRequest(selectedTemplate.data);
      } else if (type === 'CHECKLIST') {
        await deployChecklist(selectedTemplate.data);
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
          {availableTemplates.map((tpl: any, idx: number) => (
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
                     type === 'MILESTONE' ? `${tpl.data.length} Markers` : 
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

          {availableTemplates.length === 0 && (
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
