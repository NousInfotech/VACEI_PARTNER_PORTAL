import { useState, useEffect } from 'react';
import { Plus, Clock, Calendar, FileText, AlertCircle, X, Activity } from 'lucide-react';
import { Button } from '../../../../ui/Button';
import { useAuth } from '../../../../context/auth-context-core';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../../../../ui/Dialog';

interface Cycle {
  id: string;
  status: string;
  periodStart: string;
  periodEnd?: string;
  nextDueDate?: string;
  notes?: string;
  [key: string]: any;
}

interface CreateCycleComponentProps {
  serviceName: string;
  engagementId: string;
  companyId: string;
  service: {
    getAll: (engagementId: string) => Promise<Cycle[]>;
    create: (data: any) => Promise<Cycle>;
    update: (id: string, data: any) => Promise<Cycle>;
    updateStatus: (id: string, status: any, reason?: string) => Promise<any>;
  };
  statuses: Record<string, string>;
}

interface CreateCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  onSubmit: (data: any) => void;
  isPending: boolean;
  statuses: Record<string, string>;
  initialData?: any;
  isEdit?: boolean;
}

function CreateCycleModal({ open, onOpenChange, serviceName, onSubmit, isPending, statuses, initialData, isEdit }: CreateCycleModalProps) {
  const [formData, setFormData] = useState({
    periodStart: initialData?.periodStart?.split('T')[0] || new Date().toISOString().split('T')[0],
    periodEnd: initialData?.periodEnd?.split('T')[0] || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    status: initialData?.status || statuses.ACTIVE || Object.values(statuses)[0] || 'ACTIVE',
    nextDueDate: initialData?.nextDueDate?.split('T')[0] || '',
    notes: initialData?.notes || '',
    // Dynamic fields
    frequency: initialData?.frequency || 'MONTHLY', // For VAT
    taxYear: initialData?.taxYear || new Date().getFullYear(), // For TAX
    periodType: initialData?.periodType || 'MONTHLY', // For Payroll
    reportingFrequency: initialData?.reportingFrequency || 'MONTHLY', // For CFO
  });

  // Re-initialize if initialData changes or modal opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          periodStart: initialData.periodStart?.split('T')[0] || '',
          periodEnd: initialData.periodEnd?.split('T')[0] || '',
          status: initialData.status || statuses.ACTIVE || Object.values(statuses)[0] || 'ACTIVE',
          nextDueDate: initialData.nextDueDate?.split('T')[0] || '',
          notes: initialData.notes || '',
          frequency: initialData.frequency || 'MONTHLY',
          taxYear: initialData.taxYear || new Date().getFullYear(),
          periodType: initialData.periodType || 'MONTHLY',
          reportingFrequency: initialData.reportingFrequency || 'MONTHLY',
        });
      } else {
        // Reset for Create mode
        setFormData({
          periodStart: new Date().toISOString().split('T')[0],
          periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
          status: statuses.ACTIVE || Object.values(statuses)[0] || 'ACTIVE',
          nextDueDate: '',
          notes: '',
          frequency: 'MONTHLY',
          taxYear: new Date().getFullYear(),
          periodType: 'MONTHLY',
          reportingFrequency: 'MONTHLY',
        });
      }
    }
  }, [open, initialData, statuses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-primary p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/10 rounded-[20px] backdrop-blur-xl border border-white/20 shadow-inner">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-white">{isEdit ? 'Edit' : 'Create'} {serviceName} Cycle</DialogTitle>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Lifecycle Parameters</p>
              </div>
            </div>
            <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors group">
              <X className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        <div className="bg-white h-[500px] overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-10 pb-12 space-y-8 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Period Start
              </label>
              <input
                type="date"
                required
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Period End
              </label>
              <input
                type="date"
                required
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" /> Initial Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
            >
              {Object.entries(statuses).map(([key, value]) => (
                <option key={key} value={value}>{value.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
              <Clock className="h-3 w-3" /> Next Due Date <span className="text-[9px] lowercase text-gray-300">(Optional)</span>
            </label>
            <input
              type="date"
              value={formData.nextDueDate}
              onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {serviceName === 'VAT' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
                <Activity className="h-3 w-3" /> Filing Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>
          )}

          {serviceName === 'TAX' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Tax Year
              </label>
              <input
                type="number"
                required
                min={2000}
                max={2100}
                value={formData.taxYear}
                onChange={(e) => setFormData({ ...formData, taxYear: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          {serviceName === 'Payroll' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
                <Clock className="h-3 w-3" /> Period Type
              </label>
              <select
                value={formData.periodType}
                onChange={(e) => setFormData({ ...formData, periodType: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Bi-Weekly</option>
              </select>
            </div>
          )}

          {serviceName === 'CFO' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
                <Activity className="h-3 w-3" /> Reporting Frequency
              </label>
              <select
                value={formData.reportingFrequency}
                onChange={(e) => setFormData({ ...formData, reportingFrequency: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="ADHOC">Ad-hoc</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 flex items-center gap-2">
              <FileText className="h-3 w-3" /> Additional Notes <span className="text-[9px] lowercase text-gray-300">(Optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any specific details for this cycle..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-2xl font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all text-xs uppercase tracking-widest"
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              {isPending ? (isEdit ? 'Syncing...' : 'Launching...') : (isEdit ? 'Update Cycle' : `Launch Cycle`)}
            </Button>
          </div>
        </form>
      </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreateCycleComponent({ serviceName, engagementId, companyId, service, statuses }: CreateCycleComponentProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);

  // Fetch cycles
  const { data: cycles = [] } = useQuery({
    queryKey: ['service-cycles', serviceName, engagementId],
    queryFn: () => service.getAll(engagementId),
    enabled: !!engagementId,
  });


  // Create Cycle Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-cycles', serviceName, engagementId] });
      toast.success(`${serviceName} cycle created successfully`);
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || `Failed to create ${serviceName} cycle`);
    },
  });

  // Update Cycle Mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => service.update(editingCycle!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-cycles', serviceName, engagementId] });
      toast.success(`${serviceName} cycle updated successfully`);
      setEditingCycle(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || `Failed to update ${serviceName} cycle`);
    },
  });

  // Update Status Mutation


  const handleCreateSubmit = (formData: any) => {
    if (editingCycle) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate({
        engagementId,
        companyId,
        ...formData,
        ...(serviceName === 'PAYROLL' ? { employeeCount: 0 } : {}),
        ...(serviceName === 'CFO' ? { reportingFrequency: formData.reportingFrequency } : {}),
      });
    }
  };



  const isAdmin = user?.role === 'ORG_ADMIN' || user?.role === 'ORG_EMPLOYEE';

  if (cycles.length > 0) {
    return (
      <CreateCycleModal
        open={showCreateModal || !!editingCycle}
        onOpenChange={(open) => {
           if (!open) {
             setShowCreateModal(false);
             setEditingCycle(null);
           } else {
             setShowCreateModal(true);
           }
        }}
        serviceName={serviceName}
        statuses={statuses}
        onSubmit={handleCreateSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        initialData={editingCycle}
        isEdit={!!editingCycle}
      />
    );
  }

  return (
    <>
      <div className="space-y-6 relative z-10">
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 bg-white rounded-[32px] border border-dashed border-gray-200">
          <div className="p-4 bg-primary/5 rounded-full text-primary border border-primary/10">
            {isAdmin ? <Plus size={32} /> : <Clock size={32} />}
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-black text-gray-900 tracking-tight">
              {isAdmin ? `No ${serviceName} Cycle Started` : `Waiting for Admin`}
            </h4>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-[280px]">
              {isAdmin 
                ? `Begin tracking your ${serviceName} operations by initiating the first cycle.`
                : `An administrator needs to launch the ${serviceName} cycle before you can begin tracking operations.`
              }
            </p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transform transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Start {serviceName} Cycle
            </Button>
          )}
        </div>
      </div>

      <CreateCycleModal
        open={showCreateModal || !!editingCycle}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setEditingCycle(null);
          } else {
            setShowCreateModal(true);
          }
        }}
        serviceName={serviceName}
        statuses={statuses}
        onSubmit={handleCreateSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        initialData={editingCycle}
        isEdit={!!editingCycle}
      />
    </>
  );
}
