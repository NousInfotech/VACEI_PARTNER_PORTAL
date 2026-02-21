import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  FileText,
  Calendar,
  CheckCircle2,
  Loader2,
  Edit2,
  Trash2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ShadowCard } from "../../ui/ShadowCard";
import { Button } from "../../ui/Button";
import { Skeleton } from "../../ui/Skeleton";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/Textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/Dialog';
import { cn } from "../../lib/utils";
import { useAuth } from '../../context/auth-context-core';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../config/base';
import { endPoints } from '../../config/endPoint';
import { AVAILABLE_SERVICES } from '../../lib/types';
import type { ComplianceCalendarItem } from '../../lib/types';

// Partner (ORG_ADMIN, ORG_EMPLOYEE): list by role; create COMPANY only; update/delete creator only
const PARTNER_ROLES = ['ORG_ADMIN', 'ORG_EMPLOYEE'];
const SERVICE_OPTIONS = [...AVAILABLE_SERVICES, { id: 'CUSTOM', label: 'Custom' }];

// Components

interface ComplianceFormData {
  companyId: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  customFrequencyPeriodUnit: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS' | '';
  customFrequencyPeriodValue: number | '';
  serviceCategory: string;
  type: 'COMPANY' | 'GLOBAL';
}

const initialFormData: ComplianceFormData = {
  companyId: '',
  title: '',
  description: '',
  startDate: '',
  dueDate: '',
  frequency: 'YEARLY',
  customFrequencyPeriodUnit: '',
  customFrequencyPeriodValue: '',
  serviceCategory: 'CUSTOM',
  type: 'COMPANY'
};


export const EmployeeCompliance: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, organizationMember } = useAuth();
  const role = user?.role ?? localStorage.getItem('userRole');
  const companyId = localStorage.getItem('vacei-active-company') || '';

  const isPartner = role && PARTNER_ROLES.includes(role);
  const isOrgEmployee = role === 'ORG_EMPLOYEE';
  const isOrgAdmin = role === 'ORG_ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceCalendarItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComplianceFormData>(initialFormData);

  const { data: companiesResponse } = useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => {
      const res = await apiGet<{ data: { id: string; name: string }[] }>(endPoints.COMPANY.BASE);
      return res;
    },
    enabled: !!isPartner
  });

  const companiesList: { id: string; name: string }[] =
    (companiesResponse as { data?: { id: string; name: string }[] } | undefined)?.data ?? [];

  // Partner list: ORG_EMPLOYEE = GLOBAL only; ORG_ADMIN = GLOBAL + COMPANY (optional companyId filter)
  const listQueryParams = isOrgEmployee
    ? '?type=GLOBAL'
    : isOrgAdmin && companyId && companyId !== 'undefined' && companyId !== 'null'
      ? `?type=COMPANY&companyId=${companyId}`
      : '';

  const { data: response, isLoading: loading } = useQuery({
    queryKey: ['employee-compliance', role, companyId],
    queryFn: async () => {
      return apiGet<{ data: ComplianceCalendarItem[] }>(
        `${endPoints.COMPLIANCE_CALENDAR.BASE}${listQueryParams}`
      );
    },
    enabled: !!role && (isOrgEmployee || isOrgAdmin)
  });

  const compliances = response?.data || [];

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return apiPost(endPoints.COMPLIANCE_CALENDAR.BASE, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-compliance'] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return apiPatch(endPoints.COMPLIANCE_CALENDAR.GET_BY_ID(id), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-compliance'] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiDelete(endPoints.COMPLIANCE_CALENDAR.GET_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-compliance'] });
      setDeleteItemId(null);
    }
  });

  // Calculate stats
  const totalTasks = compliances.length;
  // Let's pretend anything due within 7 days is critical
  const criticalTasks = compliances.filter(c => differenceInDays(new Date(c.dueDate), new Date()) <= 7 && differenceInDays(new Date(c.dueDate), new Date()) >= 0).length;
  const overdueTasks = compliances.filter(c => differenceInDays(new Date(c.dueDate), new Date()) < 0).length;
  const pendingTasks = compliances.filter(c => differenceInDays(new Date(c.dueDate), new Date()) > 7).length;

  const openAddModal = () => {
    setFormData({
      ...initialFormData,
      companyId: companyId || '',
      serviceCategory: 'CUSTOM',
      type: 'COMPANY'
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ComplianceCalendarItem) => {
    setEditingItem(item);
    setFormData({
      companyId: item.companyId || companyId || '',
      title: item.title,
      description: item.description || '',
      startDate: item.startDate.split('T')[0],
      dueDate: item.dueDate.split('T')[0],
      frequency: item.frequency,
      customFrequencyPeriodUnit: item.customFrequencyPeriodUnit || '',
      customFrequencyPeriodValue: item.customFrequencyPeriodValue || '',
      serviceCategory: item.serviceCategory,
      type: item.type
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clean payload
    const payload: any = {
      ...formData,
      type: 'COMPANY',
      startDate: new Date(formData.startDate).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString()
    };

    if (payload.frequency !== 'CUSTOM') {
      payload.customFrequencyPeriodUnit = null;
      payload.customFrequencyPeriodValue = null;
    } else {
      payload.customFrequencyPeriodValue = Number(payload.customFrequencyPeriodValue);
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <ShadowCard key={i} className="p-5 border border-primary/5 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </ShadowCard>
          ))
        ) : (
          [
            { label: "Total Tasks", value: totalTasks, icon: FileText, color: "primary" },
            { label: "Critical", value: criticalTasks, icon: AlertCircle, color: "dark" },
            { label: "Overdue", value: overdueTasks, icon: Clock, color: "rose" },
            { label: "Pending", value: pendingTasks, icon: CheckCircle2, color: "primary" },
          ].map((stat, i) => (
            <ShadowCard key={i} className="p-5 border border-primary/5 flex items-center gap-4 hover:border-primary/20 transition-all">
              <div className={cn(
                "p-2.5 rounded-xl",
                stat.color === 'rose' ? 'bg-rose-50 text-rose-500' : 'bg-primary/5 text-primary/60'
              )}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-dark/44">{stat.label}</p>
                <h3 className={cn(
                  "text-xl mt-0.5",
                  stat.color === 'rose' ? 'text-rose-600' : 'text-primary'
                )}>{stat.value}</h3>
              </div>
            </ShadowCard>
          ))
        )}
      </div>

      <ShadowCard className="overflow-hidden border border-primary/10">
        <div className="p-6 border-b border-primary/5 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl text-primary tracking-tight font-bold">Compliance Calendar</h2>
              <p className="text-sm text-gray-500">Manage and track company regulatory deadlines</p>
            </div>
          </div>
          {isPartner && (
            <div className="flex gap-2">
              <Button onClick={openAddModal} className="shadow-lg shadow-primary/20 font-medium">
                Add Compliance
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-primary/5 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/44 font-bold">Title & Description</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/44 font-bold">Category</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/44 font-bold">Schedule</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/44 font-bold">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-dark/44 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-md" /></td>
                    <td className="px-6 py-4 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-7 w-20 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : compliances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No compliance calendar items found.</p>
                  </td>
                </tr>
              ) : (
                compliances.map((item) => {
                  const isOverdue = differenceInDays(new Date(item.dueDate), new Date()) < 0;
                  const isSoon = differenceInDays(new Date(item.dueDate), new Date()) <= 7 && !isOverdue;

                  return (
                    <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4 max-w-[300px]">
                        <p className="text-sm font-semibold text-gray-900 tracking-tight">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2" title={item.description || ''}>
                          {item.description || "No description provided."}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-indigo-700 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 uppercase tracking-wider">
                          {item.serviceCategory}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {format(new Date(item.dueDate), 'MMM dd, yyyy')}
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold ml-5">
                            {item.frequency.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider border",
                          isOverdue ? "bg-rose-50 text-rose-700 border-rose-200" :
                            isSoon ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}>
                          {isOverdue ? "OVERDUE" : isSoon ? "DUE SOON" : "ON TRACK"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {organizationMember?.id === item.createdById && (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => openEditModal(item)}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => setDeleteItemId(item.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ShadowCard>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-gray-100 shadow-2xl">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {editingItem ? 'Edit Compliance Schedule' : 'Create Compliance Schedule'}
            </DialogTitle>
            <DialogDescription>
              Configure the regulatory deadlines and schedule for this compliance item.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Company *</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    required
                    disabled={!!editingItem}
                  >
                    <option value="" disabled>Select a company...</option>
                    {companiesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Title *</label>
                  <Input
                    placeholder="e.g. Annual Tax Return"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Description</label>
                  <Textarea
                    placeholder="Provide details about what needs to be filed..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[80px] focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Service Category *</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                    required
                  >
                    {SERVICE_OPTIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Frequency *</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    required
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                {formData.frequency === 'CUSTOM' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Every *</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 2"
                        value={formData.customFrequencyPeriodValue}
                        onChange={(e) => setFormData({ ...formData, customFrequencyPeriodValue: e.target.value as any })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Unit *</label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        value={formData.customFrequencyPeriodUnit}
                        onChange={(e) => setFormData({ ...formData, customFrequencyPeriodUnit: e.target.value as any })}
                        required
                      >
                        <option value="" disabled>Select unit...</option>
                        <option value="DAYS">Days</option>
                        <option value="WEEKS">Weeks</option>
                        <option value="MONTHS">Months</option>
                        <option value="YEARS">Years</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Start Date *</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Due Date *</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-gray-100 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal} className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 hidden sm:flex">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : editingItem ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Save Changes</>
                ) : (
                  <>Create Schedule</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center justify-center text-center pt-4 pb-2">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900 mb-2">Delete Schedule</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mb-6">
              Are you sure you want to completely remove this compliance schedule? This action cannot be undone.
            </DialogDescription>
            <div className="flex w-full gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteItemId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                onClick={() => deleteItemId && deleteMutation.mutate(deleteItemId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default EmployeeCompliance;
