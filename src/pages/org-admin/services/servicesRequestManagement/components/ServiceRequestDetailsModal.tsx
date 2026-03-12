import { 
  Building2, 
  Calendar, 
  Inbox, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Eye, 
  Download,
  X
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogClose 
} from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import type { ServiceRequest, DetailEntry } from '@/types/service-request-template';
import { downloadFile } from '@/utils/downloadUtils';

interface ServiceRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
}

export const ServiceRequestDetailsModal: React.FC<ServiceRequestDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  request 
}) => {
  if (!request) return null;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-50 text-gray-600 border-gray-100';
      case 'SUBMITTED':
      case 'IN_REVIEW': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'APPROVED': return 'bg-green-50 text-green-600 border-green-100';
      case 'REJECTED': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'IN_REVIEW': return <Clock className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle2 className="h-4 w-4" />;
      case 'REJECTED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const allDetails = [
    ...(request.generalDetails || []),
    ...(request.serviceDetails || [])
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-[32px] border-none shadow-2xl">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Service Request Details
              </DialogTitle>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                Ref: {request.id.split('-')[0]}
              </p>
            </div>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-400" />
            </Button>
          </DialogClose>
        </div>

        <div className="p-8 space-y-8">
          {/* Summary Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-50 rounded-[32px] space-y-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Company</p>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-bold text-gray-900">{request.company?.name}</span>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-[32px] space-y-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Status</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(request.status)}`}>
                  {getStatusIcon(request.status)}
                  {request.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-[32px] space-y-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Date</p>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="font-bold text-gray-900">{new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {request.client?.user && (
              <div className="p-6 bg-gray-50 rounded-[32px] space-y-2 col-md-3">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Submitted By</p>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">
                    {request.client.user.firstName} {request.client.user.lastName}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-primary rounded-full" />
              <h4 className="text-lg font-bold text-gray-900">Form Responses</h4>
            </div>

            <div className="space-y-8 divide-y divide-gray-100">
              {allDetails.length > 0 ? allDetails.map((detail: DetailEntry, idx) => (
                <div key={idx} className="flex items-start gap-5 pt-8 first:pt-0 group">
                  <div className="shrink-0 pt-1">
                    <span className="text-xl font-bold text-gray-300 tabular-nums">
                      {(idx + 1).toString().padStart(2, '0')}.
                    </span>
                  </div>
                  <div className="space-y-3 flex-1">
                    <h5 className="text-lg font-bold text-gray-900 leading-tight">
                      {detail.question}
                    </h5>
                    <p className="text-[16px] text-gray-500 font-medium leading-relaxed">
                      {(() => {
                        if (detail.answer === undefined || detail.answer === null || detail.answer === '') {
                          return <span className="text-gray-300 italic">No response provided</span>;
                        }
                        if (Array.isArray(detail.answer)) return detail.answer.join(', ');
                        if (typeof detail.answer === 'object' && detail.answer !== null) {
                            return JSON.stringify(detail.answer);
                        }
                        return String(detail.answer);
                      })()}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center opacity-40">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-sm font-medium text-gray-500">No form responses available.</p>
                </div>
              )}
            </div>
          </div>

          {/* Supporting Documents */}
          {request.submittedDocuments && request.submittedDocuments.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 bg-primary rounded-full" />
                <h4 className="text-lg font-bold text-gray-900">Supporting Documents</h4>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {request.submittedDocuments.map((doc:any) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-primary/20 hover:bg-white transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-3 bg-white rounded-xl text-primary shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{doc.file_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Attachment</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:text-primary transition-all"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </a>
                      <Button 
                        size="sm"
                        className="flex items-center gap-2 px-4 py-2"
                        onClick={() => downloadFile(doc.url, doc.file_name || 'document')}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
