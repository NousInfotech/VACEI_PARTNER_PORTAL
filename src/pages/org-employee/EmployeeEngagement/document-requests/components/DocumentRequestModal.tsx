import { Plus, FileEdit, Check, Loader2, Info, Trash2, LayoutGrid } from "lucide-react";
import { cn } from "../../../../../lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../../ui/Dialog";
import { Button } from "../../../../../ui/Button";
import { Input } from "../../../../../ui/input";
import { Textarea } from "@/ui/Textarea";
import type { FormDataMultipleItem } from "../types";
import { useDocumentRequests } from "../DocumentRequestsContext";
import templates from "@/data/engagementTemplates.json";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/ui/dropdown-menu";

export const DocumentRequestModal = () => {
  const { 
    isAddModalOpen, 
    isGroupModalOpen,
    resetModal, 
    handleSubmit, 
    formData, 
    setFormData, 
    editingDoc, 
    editingGroup,
    addingToContainerId, 
    createRequestedDocMutation, 
    createContainerMutation,
    updateGroupMutation,
    updateRequestedDocMutation
  } = useDocumentRequests();

  const reqDocTemplates = (templates as any).REQ_DOC || [];

  const handleApplyTemplate = (tplData: any, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setFormData((prev: any) => ({
      ...prev,
      documentName: tplData.documentName || prev.documentName,
      description: tplData.description || prev.description,
      type: tplData.type || prev.type,
      count: tplData.count || prev.count,
      isMandatory: tplData.isMandatory !== undefined ? tplData.isMandatory : prev.isMandatory,
      multipleItems: tplData.multipleItems 
        ? tplData.multipleItems.map((item: any) => ({
            ...item,
            isMandatory: item.isMandatory ?? true,
            templateFile: null,
            templateInstructions: item.templateInstructions || ""
          }))
        : prev.multipleItems
    }));
  };

  const isPending = 
    createRequestedDocMutation.isPending || 
    createContainerMutation.isPending ||
    updateGroupMutation.isPending ||
    updateRequestedDocMutation.isPending;

  const showGroupFields = (!editingDoc && !addingToContainerId && !formData.parentId) || editingGroup;
  const showDocFields = !editingGroup;

  return (
    <Dialog open={isAddModalOpen || isGroupModalOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {editingGroup || editingDoc ? <FileEdit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingGroup ? "Edit Request Group" : 
             editingDoc ? "Edit Requirement" : 
             (addingToContainerId || formData.parentId ? "Add Document to Request" : "New Document Request Group")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {showGroupFields && (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 pb-6", showDocFields && "border-b")}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">Group Title</label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Legal Documents" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">Group Description</label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Generic info about this group..." />
              </div>
            </div>
          )}

          {showDocFields && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">Document Name</label>
                  
                  {reqDocTemplates.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                          <LayoutGrid className="h-3 w-3" /> Use Template
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[240px] rounded-2xl border-none shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                        <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                          Standard Requirements
                        </div>
                        {reqDocTemplates.map((tpl: any, i: number) => (
                          <DropdownMenuItem 
                            key={i} 
                            onClick={(e) => handleApplyTemplate(tpl.data, e)}
                            className="rounded-xl focus:bg-primary/5 cursor-pointer py-2 px-3 group"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{tpl.name}</span>
                              <span className="text-[9px] text-slate-400 font-medium truncate max-w-[180px]">
                                {tpl.data.count === 'MULTIPLE' ? `${tpl.data.multipleItems.length} nested items` : 'Single requirement'}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <Input value={formData.documentName} onChange={e => setFormData({...formData, documentName: e.target.value})} placeholder="e.g. Passport Copy" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">Type</label>
                <select className="w-full h-10 border rounded-md px-3 bg-white text-sm" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                  <option value="DIRECT">Direct Upload</option>
                  <option value="TEMPLATE">Template Based</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">Copy Mode</label>
                <select className="w-full h-10 border rounded-md px-3 bg-white text-sm" value={formData.count} onChange={e => setFormData({...formData, count: e.target.value as any})}>
                  <option value="SINGLE">Single Copy</option>
                  <option value="MULTIPLE">Multiple Copies (Group)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input type="checkbox" id="modal-isMandatory" className="h-4 w-4 rounded border-gray-300 text-primary" checked={formData.isMandatory} onChange={e => setFormData({...formData, isMandatory: e.target.checked})} />
                <label htmlFor="modal-isMandatory" className="text-sm font-medium text-gray-700">Mark as Mandatory</label>
              </div>
            </div>

            {formData.type === 'TEMPLATE' && formData.count === 'SINGLE' && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-sm"><Info className="h-4 w-4" /> Template Configuration</div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-700 uppercase">Template File</label>
                  <Input type="file" onChange={(e) => setFormData({...formData, templateFile: e.target.files?.[0] || null})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-700 uppercase">Instructions</label>
                  <Textarea value={formData.templateInstructions} onChange={e => setFormData({...formData, templateInstructions: e.target.value})} placeholder="How should they fill this?" rows={3} />
                </div>
              </div>
            )}

            {formData.count === 'MULTIPLE' && (
              <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                    <LayoutGrid className="h-4 w-4" /> Multiple Copy Labels
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFormData({...formData, multipleItems: [...formData.multipleItems, { label: "", instruction: "", templateFile: null, templateUrl: undefined, templateInstructions: "" }]})} 
                    className="bg-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Label
                  </Button>
                </div>
                <div className="space-y-4">
                  {formData.multipleItems.map((item: FormDataMultipleItem, idx: number) => (
                    <div key={idx} className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Label {idx + 1}</label>
                          <Input value={item.label} onChange={e => { const newItems = [...formData.multipleItems]; newItems[idx].label = e.target.value; setFormData({...formData, multipleItems: newItems}); }} placeholder="e.g. Page 1" className="h-9 text-sm" />
                        </div>
                        {formData.multipleItems.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => { const newItems = formData.multipleItems.filter((_: any, i: number) => i !== idx); setFormData({...formData, multipleItems: newItems}); }} className="mt-6 text-red-500 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Instruction</label>
                          <Input value={item.instruction} onChange={e => { const newItems = [...formData.multipleItems]; newItems[idx].instruction = e.target.value; setFormData({...formData, multipleItems: newItems}); }} placeholder="Specific to this item..." className="h-9 text-xs" />
                        </div>
                        {formData.type === 'TEMPLATE' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Template File</label>
                            <Input type="file" className="h-9 text-[10px]" onChange={e => { const newItems = [...formData.multipleItems]; newItems[idx].templateFile = e.target.files?.[0] || null; setFormData({...formData, multipleItems: newItems}); }} />
                          </div>
                        )}
                      </div>
                      {formData.type === 'TEMPLATE' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Template Instructions (JSON/Details)</label>
                          <Input value={item.templateInstructions} onChange={e => { const newItems = [...formData.multipleItems]; newItems[idx].templateInstructions = e.target.value; setFormData({...formData, multipleItems: newItems}); }} placeholder="Template specific details..." className="h-9 text-xs" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

          <DialogFooter className="pt-6 border-t">
            <Button type="button" variant="outline" onClick={resetModal}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
               {editingGroup ? "Update Group" : 
                editingDoc ? "Update Requirement" : 
                (addingToContainerId || formData.parentId ? "Add Requirement" : "Create Request Group")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

