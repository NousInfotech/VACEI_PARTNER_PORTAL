import { 
  File as FileIcon, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../../../../../lib/utils";
import { Button } from "../../../../../ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../../ui/Dialog";
import { FilingStatus, type FilingItem } from "../../../../../api/filingService";

interface FilingItemRowProps {
  filing: FilingItem;
  currentUserId: string | undefined;
  onUpdateStatus: (filingId: string, status: FilingStatus) => void;
  onDelete: (filingId: string) => void;
  onOpenDetails: (filing: FilingItem) => void;
  onToggleSignOff: (filingId: string, currentStatus: boolean) => void;
}

export default function FilingItemRow({ 
  filing, 
  currentUserId,
  onUpdateStatus, 
  onDelete,
  onOpenDetails,
  onToggleSignOff
}: FilingItemRowProps) {
  const [isSignOffHistoryOpen, setIsSignOffHistoryOpen] = useState(false);

  const getStatusConfig = (status: FilingStatus) => {
    switch (status) {
      case FilingStatus.FILED:
        return { 
          label: "Filed", 
          icon: <CheckCircle2 size={14} />, 
          className: "bg-emerald-50 text-emerald-600 border-emerald-100" 
        };
      case FilingStatus.CLIENT_REVIEW:
        return { 
          label: "In Review", 
          icon: <Clock size={14} />, 
          className: "bg-indigo-50 text-indigo-600 border-indigo-100" 
        };
      case FilingStatus.CANCELLED:
        return { 
          label: "Cancelled", 
          icon: <AlertCircle size={14} />, 
          className: "bg-red-50 text-red-600 border-red-100" 
        };
      default:
        return { 
          label: "Draft", 
          icon: <Clock size={14} />, 
          className: "bg-amber-50 text-amber-600 border-amber-100" 
        };
    }
  };

  const statusCfg = getStatusConfig(filing.status);
  const userSignOff = filing.signOffs?.find(s => s.userId === currentUserId);
  const hasSignedOff = !!userSignOff?.signOffStatus;

  return (
    <div className="group bg-white rounded-[24px] border border-gray-100 overflow-hidden transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:border-primary/10">
      <div className="p-5 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="h-12 w-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-colors shrink-0">
            <FileIcon size={20} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-gray-900 tracking-tight truncate">{filing.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Updated {new Date(filing.updatedAt).toLocaleDateString()}
              </span>
              <div className="w-1 h-1 rounded-full bg-gray-200" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                {filing.files.length} {filing.files.length === 1 ? 'File' : 'Files'}
              </span>
              {filing.signOffs && filing.signOffs.length > 0 && (
                <>
                  <div className="w-1 h-1 rounded-full bg-gray-200" />
                  <button 
                    onClick={() => setIsSignOffHistoryOpen(true)}
                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1 transition-colors group/signoff cursor-pointer focus:outline-none"
                  >
                    <CheckCircle2 size={10} className="group-hover/signoff:scale-110 transition-transform" /> 
                    {filing.signOffs.filter(s => s.signOffStatus).length} Sign-offs
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Status: dropdown when editable, static badge when Filed */}
          {filing.status === FilingStatus.FILED ? (
            <div className={cn(
              "h-9 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest shrink-0",
              statusCfg.className
            )}>
              {statusCfg.icon}
              {statusCfg.label}
            </div>
          ) : (
            <div className="relative shrink-0">
              <select
                value={filing.status}
                onChange={(e) => onUpdateStatus(filing.id, e.target.value as FilingStatus)}
                className={cn(
                  "h-9 flex items-center gap-2 px-3 pr-8 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none",
                  statusCfg.className
                )}
              >
                <option value={FilingStatus.DRAFT}>Draft</option>
                <option value={FilingStatus.CLIENT_REVIEW}>Client Review</option>
                <option value={FilingStatus.FILED}>Filed</option>
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60"
              />
            </div>
          )}

          <div className="h-6 w-px bg-gray-100 hidden md:block" />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={hasSignedOff ? "default" : "outline"}
              className={cn(
                "h-9 px-4 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                hasSignedOff 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20" 
                  : "bg-white text-gray-400 hover:text-emerald-600 hover:border-emerald-200"
              )}
              onClick={() => onToggleSignOff(filing.id, hasSignedOff)}
            >
              <CheckCircle2 size={16} />
              {hasSignedOff ? "Signed Off" : "Sign Off"}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-4 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 gap-2 text-[10px] font-black uppercase tracking-widest"
              onClick={() => onOpenDetails(filing)}
            >
              <Eye size={16} />
              View
            </Button>

            <Button 
              size="icon" 
              variant="ghost" 
              disabled={filing.status === FilingStatus.FILED}
              className="h-9 w-9 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
              onClick={() => onDelete(filing.id)}
              title="Delete"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isSignOffHistoryOpen} onOpenChange={setIsSignOffHistoryOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-6 border-b border-gray-100 bg-gray-50/50">
            <DialogTitle className="text-sm font-black text-gray-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              Sign-off History
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {!filing.signOffs || filing.signOffs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-xs font-bold text-gray-900">No sign-offs yet</p>
                <p className="text-[10px] font-medium text-gray-500 mt-1 max-w-[200px]">
                  When stakeholders approve this filing, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filing.signOffs.map((signOff: any) => (
                  <div key={signOff.id} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-white hover:border-emerald-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex shrink-0 items-center justify-center h-10 w-10 text-emerald-600 bg-emerald-50 rounded-xl overflow-hidden">
                        <span className="text-xs font-bold">
                          {signOff.user?.firstName?.[0]}{signOff.user?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 leading-none">
                          {signOff.user?.firstName} {signOff.user?.lastName}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-widest">
                          {new Date(signOff.createdAt).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {signOff.signOffStatus && (
                      <div className="h-6 px-2 rounded-lg bg-emerald-50 text-emerald-600 flex items-center text-[10px] font-bold uppercase tracking-widest">
                        Approved
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
