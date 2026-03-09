import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/Dialog";
import { ScrollArea } from "@/ui/scroll-area";
import { Skeleton } from "@/ui/Skeleton";
import { Button } from "@/ui/Button";
import { FileText, Eye } from "lucide-react";

interface ServiceRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  isLoading: boolean;
}

export const ServiceRequestDialog = ({ isOpen, onClose, request, isLoading }: ServiceRequestDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[40px] border-none shadow-2xl">
      <DialogHeader className="px-10 py-8 border-b border-gray-50 bg-gray-50/30 shrink-0">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <FileText size={24} />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">Service Request Details</DialogTitle>
                    <p className="text-sm text-gray-500 font-medium">Review the formal request from the client</p>
                </div>
            </div>
        </div>
      </DialogHeader>

      <ScrollArea className="flex-1 px-10 py-8">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
        ) : request ? (
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</p>
                <p className="text-sm font-bold text-slate-900">{request.service?.replace(/_/g, ' ')}</p>
              </div>
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted Date</p>
                <p className="text-sm font-bold text-slate-900">{new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                <div className="h-6 w-1 bg-primary rounded-full" />
                Form Responses
              </h4>
              <div className="grid gap-8">
                {[...(request.generalDetails || []), ...(request.serviceDetails || [])].map((item: any, idx: number) => (
                  <div key={idx} className="space-y-3 group text-left">
                    <h5 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors flex items-start gap-3">
                      <span className="text-primary/40 font-black tabular-nums">{(idx + 1).toString().padStart(2, '0')}</span>
                      {item.question}
                    </h5>
                    <div className="pl-9">
                      <div className="text-slate-600 leading-relaxed bg-white border border-slate-100 p-4 rounded-2xl shadow-sm min-h-12">
                        {Array.isArray(item.answer) ? item.answer.join(', ') : item.answer || <span className="text-slate-300 italic">No response</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {request.submittedDocuments && request.submittedDocuments.length > 0 && (
              <div className="space-y-6 pb-6">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  Supporting Documents
                </h4>
                <div className="grid gap-3">
                  {request.submittedDocuments.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 border-none hover:bg-white transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-primary shadow-sm group-hover:shadow-md transition-all">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-900">{doc.file_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Attachment</p>
                        </div>
                      </div>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                      >
                        <Eye size={14} />
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center">
             <p className="text-slate-400 font-medium">Request details not available.</p>
          </div>
        )}
      </ScrollArea>
      
      <div className="px-10 py-6 border-t border-gray-50 bg-gray-50/30 flex justify-end shrink-0">
         <Button onClick={onClose} className="px-8 rounded-xl bg-slate-900 text-white font-bold h-11">
           Close
         </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default ServiceRequestDialog;
