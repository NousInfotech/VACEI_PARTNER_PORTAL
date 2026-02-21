import React, { createContext, useContext, useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPostFormData, apiPatch, apiDelete } from "../../../../config/base";
import { endPoints } from "../../../../config/endPoint";
import { useAuth } from "../../../../context/auth-context-core";
import { todoService } from "../../../../api/todoService";
import type { 
  RequestedDocumentItem, 
  DocumentRequestItem,
  FormDataMultipleItem, 
  ApiResponse 
} from "./types";

interface DocumentRequestsContextType {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  addingToContainerId: string | null;
  setAddingToContainerId: (id: string | null) => void;
  editingDoc: RequestedDocumentItem | null;
  setEditingDoc: (doc: RequestedDocumentItem | null) => void;
  editingGroup: DocumentRequestItem | null;
  setEditingGroup: (group: DocumentRequestItem | null) => void;
  isGroupModalOpen: boolean;
  setIsGroupModalOpen: (open: boolean) => void;
  resetModal: () => void;
  handleFileUpload: (documentRequestId: string, docId: string, files: FileList | null) => void;
  handleSubmit: (e: React.FormEvent) => void;
  uploadMutation: any;
  createRequestedDocMutation: any;
  createContainerMutation: any;
  updateGroupMutation: any;
  updateRequestedDocMutation: any;
  deleteContainerMutation: any;
  clearMutation: any;
  hardDeleteMutation: any;
  engagementId?: string;
  isTodoModalOpen: boolean;
  setIsTodoModalOpen: (open: boolean) => void;
  todoInitialData: any;
  setTodoInitialData: (data: any) => void;
  todoSourceId: string | undefined;
  setTodoSourceId: (id: string | undefined) => void;
  todoMode: "from-doc-req" | "from-req-doc" | "create" | "edit";
  setTodoMode: (mode: "from-doc-req" | "from-req-doc" | "create" | "edit") => void;
}

const DocumentRequestsContext = createContext<DocumentRequestsContextType | undefined>(undefined);

export const useDocumentRequests = () => {
  const context = useContext(DocumentRequestsContext);
  if (!context) {
    throw new Error("useDocumentRequests must be used within a DocumentRequestsProvider");
  }
  return context;
};

export const DocumentRequestsProvider: React.FC<{ engagementId?: string; children: React.ReactNode }> = ({ 
  engagementId, 
  children 
}) => {
  const { selectedService } = useAuth();
  const queryClient = useQueryClient();
  const serviceName = selectedService?.replace(/_/g, " ") || "Engagement";

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingToContainerId, setAddingToContainerId] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<RequestedDocumentItem | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentRequestItem | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [todoInitialData, setTodoInitialData] = useState<any>(null);
  const [todoSourceId, setTodoSourceId] = useState<string | undefined>(undefined);
  const [todoMode, setTodoMode] = useState<"from-doc-req" | "from-req-doc" | "create" | "edit">("from-doc-req");
  
  const [formData, setFormData] = useState({
    documentName: "",
    isMandatory: true,
    title: "",
    description: "",
    count: 'SINGLE' as 'SINGLE' | 'MULTIPLE',
    type: 'DIRECT' as 'DIRECT' | 'TEMPLATE',
    parentId: null as string | null,
    templateInstructions: "",
    templateFile: null as File | null,
    templateUrl: undefined as string | undefined,
    multipleItems: [{ label: "", instruction: "", isMandatory: true, templateFile: null as File | null, templateUrl: undefined as string | undefined, templateInstructions: "" }] as FormDataMultipleItem[],
  });

  React.useEffect(() => {
    if (editingDoc) {
      setFormData({
        documentName: editingDoc.documentName,
        isMandatory: editingDoc.isMandatory || false,
        title: "",
        description: editingDoc.description || "",
        count: editingDoc.count,
        type: editingDoc.type,
        parentId: editingDoc.parentId,
        templateInstructions: editingDoc.template?.instruction || "",
        templateFile: null,
        templateUrl: editingDoc.template?.url,
        multipleItems: editingDoc.children && editingDoc.children.length > 0
          ? editingDoc.children.map(child => ({
              label: child.documentName,
              instruction: child.description || "",
              templateFile: null,
              templateUrl: child.template?.url,
              templateInstructions: child.template?.instruction || ""
            }))
          : [{ label: "", instruction: "", templateFile: null, templateUrl: undefined, templateInstructions: "" }]
      });
    } else if (editingGroup) {
      setFormData({
        documentName: "",
        isMandatory: true,
        title: editingGroup.title,
        description: editingGroup.description || "",
        count: 'SINGLE',
        type: 'DIRECT',
        parentId: null,
        templateInstructions: "",
        templateFile: null,
        templateUrl: undefined,
        multipleItems: [{ label: "", instruction: "", isMandatory: true, templateFile: null, templateUrl: undefined, templateInstructions: "" }]
      });
    }
  }, [editingDoc, editingGroup]);

  const resetModal = () => {
    setIsAddModalOpen(false);
    setIsGroupModalOpen(false);
    setAddingToContainerId(null);
    setEditingDoc(null);
    setEditingGroup(null);
    setFormData({ 
      documentName: "", 
      isMandatory: true, 
      title: "", 
      description: "",
      count: 'SINGLE',
      type: 'DIRECT',
      parentId: null,
      templateInstructions: "",
      templateFile: null,
      templateUrl: undefined,
      multipleItems: [{ label: "", instruction: "", isMandatory: true, templateFile: null, templateUrl: undefined, templateInstructions: "" }]
    });
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ documentRequestId, docId, file }: { documentRequestId: string; docId: string; file: File }) => {
      const formData = new FormData();
      formData.append("files", file);
      let url = endPoints.REQUESTED_DOCUMENT_UPLOAD(documentRequestId, docId);
      return apiPostFormData(url, formData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
      
      // Auto update linked todo to ACTION_TAKEN
      const todos = queryClient.getQueryData<any[]>(['engagement-todos', engagementId]);
      const docGroups = queryClient.getQueryData<DocumentRequestItem[]>(["document-requests", engagementId]);
      
      if (!todos || !docGroups) return;

      const completionCheck = (d: RequestedDocumentItem): boolean => {
        if (d.id === variables.docId) return true; // Account for the fact that this one is now uploaded
        if (d.count === 'SINGLE') return !!d.file;
        return !!d.children && d.children.length > 0 && d.children.every(completionCheck);
      };

      // 1. Specific Document
      const linkedTodo = todos?.find(t => t.moduleId === variables.docId && (t.type === 'REQUESTED_DOCUMENT' || t.type === 'CUSTOM'));
      if (linkedTodo) {
        todoService.updateStatus(linkedTodo.id, 'ACTION_TAKEN').catch(console.error);
      }

      // 2. Parent Document (if all siblings finished)
      for (const group of docGroups) {
        const findParentAndCheck = (docs: RequestedDocumentItem[]): boolean => {
          for (const d of docs) {
            if (d.children?.some(c => c.id === variables.docId)) {
              // Found the parent
              if (d.children.every(completionCheck)) {
                const parentTodo = todos.find(t => t.moduleId === d.id && (t.type === 'REQUESTED_DOCUMENT' || t.type === 'CUSTOM'));
                if (parentTodo) todoService.updateStatus(parentTodo.id, 'ACTION_TAKEN').catch(console.error);
              }
              return true;
            }
            if (d.children && findParentAndCheck(d.children)) return true;
          }
          return false;
        };
        if (findParentAndCheck(group.requestedDocuments)) break;
      }

      // 3. Document Group (if all documents in group finished)
      for (const group of docGroups) {
        const isTargetGroup = (function search(docs: RequestedDocumentItem[]): boolean {
          return docs.some(d => d.id === variables.docId || (d.children && search(d.children)));
        })(group.requestedDocuments);

        if (isTargetGroup) {
          const allDocsInGroupFinished = group.requestedDocuments.every(completionCheck);
          if (allDocsInGroupFinished) {
            const groupTodo = todos.find(t => t.moduleId === group.id && (t.type === 'DOCUMENT_REQUEST' || t.type === 'CUSTOM'));
            if (groupTodo) todoService.updateStatus(groupTodo.id, 'ACTION_TAKEN').catch(console.error);
          }
          break;
        }
      }
    },
  });
  
  const clearMutation = useMutation({
    mutationFn: async ({ documentRequestId, docId, reason }: { documentRequestId: string; docId: string; reason: string }) => {
      return apiPatch(endPoints.REQUESTED_DOCUMENT_BY_ID(documentRequestId, docId) + '/clear', { reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });

      // Auto update linked todo to ACTION_REQUIRED
      const todos = queryClient.getQueryData<any[]>(['engagement-todos', engagementId]);
      const linkedTodo = todos?.find(t => t.moduleId === variables.docId && (t.type === 'REQUESTED_DOCUMENT' || t.type === 'CUSTOM'));
      if (linkedTodo) {
        todoService.updateStatus(linkedTodo.id, 'ACTION_REQUIRED').catch(console.error);
      }
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: async ({ documentRequestId, docId, reason }: { documentRequestId: string; docId: string; reason: string }) => {
      return apiDelete(endPoints.REQUESTED_DOCUMENT_BY_ID(documentRequestId, docId), { reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });

      // Auto delete linked todo
      const todos = queryClient.getQueryData<any[]>(['engagement-todos', engagementId]);
      const linkedTodo = todos?.find(t => t.moduleId === variables.docId && (t.type === 'REQUESTED_DOCUMENT' || t.type === 'CUSTOM'));
      if (linkedTodo) {
        todoService.delete(linkedTodo.id).catch(console.error);
      }
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string | null }) => {
      return apiPatch(endPoints.DOCUMENT_REQUESTS + `/${id}`, { title, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
      resetModal();
    },
  });

  const updateRequestedDocMutation = useMutation({
    mutationFn: async ({ documentRequestId, docId, payload }: { documentRequestId: string; docId: string; payload: any }) => {
      // Basic patch for requested document
      return apiPatch(endPoints.REQUESTED_DOCUMENT_BY_ID(documentRequestId, docId), {
        documentName: payload.documentName,
        isMandatory: payload.isMandatory,
        description: payload.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
      resetModal();
    },
  });

  const deleteContainerMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiDelete(endPoints.DOCUMENT_REQUESTS + `/${id}`, { reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });

      // Auto delete linked todo
      const todos = queryClient.getQueryData<any[]>(['engagement-todos', engagementId]);
      const linkedTodo = todos?.find(t => t.moduleId === variables.id && (t.type === 'DOCUMENT_REQUEST' || t.type === 'CUSTOM'));
      if (linkedTodo) {
        todoService.delete(linkedTodo.id).catch(console.error);
      }
    },
  });


  const createRequestedDocMutation = useMutation({
    mutationFn: async ({ documentRequestId, payload }: { documentRequestId: string; payload: typeof formData }) => {
      // 1. Create parent or SINGLE doc
      const parentFd = new FormData();
      parentFd.append("documentName", payload.documentName);
      parentFd.append("description", payload.description);
      parentFd.append("type", payload.type);
      parentFd.append("count", payload.count);
      parentFd.append("isMandatory", String(payload.isMandatory));
      if (payload.parentId) parentFd.append("parentId", payload.parentId);
      
      if (payload.type === 'TEMPLATE' && payload.count === 'SINGLE' && payload.templateFile) {
        parentFd.append("template", payload.templateFile);
      }
      
      const parentRes = await apiPostFormData<ApiResponse<{ id: string }>>(
        endPoints.REQUESTED_DOCUMENTS(documentRequestId), 
        parentFd
      );
      
      const parentId = parentRes.data.id;
      
      // 2. Create children (if MULTIPLE)
      if (payload.count === 'MULTIPLE' && payload.multipleItems.length > 0) {
        for (const item of payload.multipleItems) {
          const childFd = new FormData();
          childFd.append("documentName", item.label);
          childFd.append("description", item.instruction);
          childFd.append("type", payload.type);
          childFd.append("count", 'SINGLE');
          childFd.append("isMandatory", String(item.isMandatory ?? true));
          childFd.append("parentId", parentId);
          if (payload.type === 'TEMPLATE' && item.templateFile) {
            childFd.append("template", item.templateFile);
          }
          await apiPostFormData(endPoints.REQUESTED_DOCUMENTS(documentRequestId), childFd);
        }
      }
      return parentRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
      resetModal();
    },
  });

  const createContainerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const fd = new FormData();
      fd.append("title", data.title || `${serviceName} Document Requests`);
      fd.append("description", data.description || `Standard documents required for ${serviceName} engagement.`);
      fd.append("engagementId", engagementId!);
      
      const requestedDocsPayload = [
        {
          documentName: data.documentName,
          isMandatory: data.isMandatory,
          count: data.count,
          type: data.type,
          description: data.description,
          children: data.count === 'MULTIPLE' ? data.multipleItems.map(item => ({
             documentName: item.label,
             description: item.instruction,
             isMandatory: item.isMandatory ?? true,
          })) : []
        }
      ];
      
      fd.append("requestedDocuments", JSON.stringify(requestedDocsPayload));
      
      // Append templates in order: parent (if single) then children
      if (data.type === 'TEMPLATE') {
        if (data.count === 'SINGLE' && data.templateFile) {
          fd.append("templates", data.templateFile);
        } else if (data.count === 'MULTIPLE') {
          for (const item of data.multipleItems) {
            if (item.templateFile) {
              fd.append("templates", item.templateFile);
            }
          }
        }
      }
      
      return apiPostFormData(endPoints.ENGAGEMENTS.GET_BY_ID(engagementId!) + '/document-request', fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-requests", engagementId] });
      resetModal();
    },
  });

  const handleFileUpload = (documentRequestId: string, docId: string, files: FileList | null) => {
    if (files && files.length > 0) {
      uploadMutation.mutate({ documentRequestId, docId, file: files[0] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, title: formData.title, description: formData.description });
    } else if (editingDoc) {
      updateRequestedDocMutation.mutate({ 
        documentRequestId: editingDoc.documentRequestId, 
        docId: editingDoc.id, 
        payload: formData 
      });
    } else if (addingToContainerId) {
      createRequestedDocMutation.mutate({ documentRequestId: addingToContainerId!, payload: formData });
    } else {
      createContainerMutation.mutate(formData);
    }
  };

  const value = useMemo(() => ({
    formData,
    setFormData,
    isAddModalOpen,
    setIsAddModalOpen,
    addingToContainerId,
    setAddingToContainerId,
    editingDoc,
    setEditingDoc,
    editingGroup,
    setEditingGroup,
    isGroupModalOpen,
    setIsGroupModalOpen,
    resetModal,
    handleFileUpload,
    handleSubmit,
    uploadMutation,
    createRequestedDocMutation,
    createContainerMutation,
    updateGroupMutation,
    updateRequestedDocMutation,
    deleteContainerMutation,
    clearMutation,
    hardDeleteMutation,
    engagementId,
    isTodoModalOpen,
    setIsTodoModalOpen,
    todoInitialData,
    setTodoInitialData,
    todoSourceId,
    setTodoSourceId,
    todoMode,
    setTodoMode,
  }), [
    formData, 
    isAddModalOpen, 
    isGroupModalOpen,
    isTodoModalOpen,
    todoInitialData,
    todoSourceId,
    todoMode,
    addingToContainerId, 
    editingDoc, 
    editingGroup,
    uploadMutation.isPending, 
    createRequestedDocMutation.isPending, 
    createContainerMutation.isPending,
    updateGroupMutation.isPending,
    updateRequestedDocMutation.isPending,
    deleteContainerMutation.isPending,
    clearMutation.isPending,
    hardDeleteMutation.isPending,
    engagementId
  ]);

  return (
    <DocumentRequestsContext.Provider value={value}>
      {children}
    </DocumentRequestsContext.Provider>
  );
};
