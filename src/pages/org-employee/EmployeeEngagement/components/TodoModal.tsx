import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { 
  X, 
  Calendar as CalendarIcon, 
  Type, 
  AlignLeft, 
  MousePointer2,
  CheckSquare
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "../../../../ui/Dialog";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/input";
import { Textarea } from "../../../../ui/Textarea";
import { 
  todoService, 
  TodoListType, 
  TodoListActorRole 
} from "../../../../api/todoService";
import type { 
  CreateTodoDto, 
  Todo 
} from "../../../../api/todoService";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "../../../../lib/utils";

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  engagementId: string;
  companyId?: string;
  service?: string;
  initialData?: Partial<Todo>;
  mode?: "create" | "edit" | "from-chat" | "from-doc-req" | "from-req-doc";
  sourceId?: string; // messageId, docReqId, or reqDocId
}

export default function TodoModal({
  isOpen,
  onClose,
  onSuccess,
  engagementId,
  service,
  initialData,
  mode = "create",
  sourceId
}: TodoModalProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateTodoDto>({
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      deadline: initialData?.deadline ? format(new Date(initialData.deadline), "yyyy-MM-dd") : "",
      service: service || initialData?.service || "AUDITING",
      type: (mode === "from-chat" ? TodoListType.CHAT : 
            mode === "from-doc-req" ? TodoListType.DOCUMENT_REQUEST : 
            mode === "from-req-doc" ? TodoListType.REQUESTED_DOCUMENT : 
            initialData?.type || TodoListType.CUSTOM) as TodoListType,
      cta: initialData?.cta || "Action Required",
      role: initialData?.role || TodoListActorRole.ORG_MEMBER,
    }
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        title: initialData.title || "",
        description: initialData.description || "",
        deadline: initialData.deadline ? format(new Date(initialData.deadline), "yyyy-MM-dd") : "",
        service: service || initialData.service || "AUDITING",
        type: (mode === "from-chat" ? TodoListType.CHAT : 
              mode === "from-doc-req" ? TodoListType.DOCUMENT_REQUEST : 
              mode === "from-req-doc" ? TodoListType.REQUESTED_DOCUMENT : 
              initialData.type || TodoListType.CUSTOM) as TodoListType,
        cta: initialData.cta || "Action Required",
        role: initialData.role || TodoListActorRole.ORG_MEMBER,
      });
    } else if (isOpen) {
      reset({
        title: "",
        description: "",
        deadline: "",
        service: service || "AUDITING",
        type: (mode === "from-chat" ? TodoListType.CHAT : 
              mode === "from-doc-req" ? TodoListType.DOCUMENT_REQUEST : 
              mode === "from-req-doc" ? TodoListType.REQUESTED_DOCUMENT : 
              TodoListType.CUSTOM) as TodoListType,
        cta: mode === "from-chat" ? "REPLY" : mode === "from-doc-req" ? "VIEW" : mode === "from-req-doc" ? "UPLOAD" : "Action Required",
        role: TodoListActorRole.ORG_MEMBER,
      });
    }
  }, [isOpen, initialData, reset, mode, service]);

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
      };

      if (mode === "edit" && initialData?.id) {
        await todoService.update(initialData.id, payload);
        toast.success("Todo updated successfully");
      } else if (mode === "from-chat" && sourceId) {
        await todoService.createFromChat(engagementId, sourceId, payload);
        toast.success("Todo created from chat");
      } else if (mode === "from-doc-req" && sourceId) {
        await todoService.createFromDocumentRequest(engagementId, sourceId, payload);
        toast.success("Todo created from document request");
      } else if (mode === "from-req-doc" && sourceId) {
        await todoService.createFromRequestedDocument(engagementId, sourceId, payload);
        toast.success("Todo created from requested document");
      } else {
        await todoService.create(engagementId, payload);
        toast.success("Todo created successfully");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border-none">
        <DialogHeader className="p-6 bg-gray-50/50 border-b border-gray-100 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <CheckSquare size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {mode === "edit" ? "Edit Todo" : "Create New Todo"}
              </DialogTitle>
              <p className="text-sm text-gray-500 font-medium">
                {mode === "edit" ? "Update todo details" : "Assign a new task to handle"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Type size={14} className="text-gray-400" />
                Title
              </label>
              <Input
                {...register("title", { required: "Title is required" })}
                placeholder="Enter todo title..."
                className={cn("rounded-xl border-gray-200 focus:border-primary/30", errors.title && "border-red-500")}
              />
              {errors.title && <p className="text-[10px] text-red-500 font-bold">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <AlignLeft size={14} className="text-gray-400" />
                Description
              </label>
              <Textarea
                {...register("description")}
                placeholder="Details about this todo..."
                rows={3}
                className="rounded-xl border-gray-200 focus:border-primary/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <CalendarIcon size={14} className="text-gray-400" />
                  Deadline
                </label>
                <Input
                  type="date"
                  {...register("deadline")}
                  className={cn("rounded-xl border-gray-200 focus:border-primary/30", errors.deadline && "border-red-500")}
                />
                {errors.deadline && <p className="text-[10px] text-red-500 font-bold">{errors.deadline.message}</p>}
              </div>

              {/* Service */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <MousePointer2 size={14} className="text-gray-400" />
                  CTA Label
                </label>
                <Input
                  {...register("cta")}
                  placeholder="e.g. REPLY, VIEW"
                  className="rounded-xl border-gray-200 focus:border-primary/30"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-gray-600 font-bold border-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              {isSubmitting ? "Saving..." : mode === "edit" ? "Update Todo" : "Create Todo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

