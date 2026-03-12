import React, { useState, useMemo } from 'react';
import { X, Building2, MapPin, Globe, FileText, PieChart, BarChart3, Hash, Search, Lock, ChevronDown } from 'lucide-react';
import { Button } from '../../../../../ui/Button';
 import { apiGet, apiPost, apiPut } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import type { Company } from '../../../../../types/company';
import NumericInput from '@/ui/NumericInput';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
}

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Energy', 'Construction', 'Education', 'Transportation', 'Real Estate',
  'Consulting', 'Other',
];

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientId,
}) => {
  const [industrySelection, setIndustrySelection] = useState<string>('');
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [nonPrimaryCompanies, setNonPrimaryCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    industry: [''],
    summary: '',
    authorizedShares: 0,
    issuedShares: 0,
    registrationNumber: '',
    legalType: '',
  });

  const [shareClasses, setShareClasses] = useState({
    A: { issued: 0, perShareValue: 0 },
    B: { issued: 0, perShareValue: 0 },
    C: { issued: 0, perShareValue: 0 },
    ORDINARY: { perShareValue: 0 },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-calculate Ordinary = Issued - (A + B + C)
  const ordinaryShares = useMemo(() => {
    const named = shareClasses.A.issued + shareClasses.B.issued + shareClasses.C.issued;
    const result = formData.issuedShares - named;
    return result >= 0 ? result : 0;
  }, [formData.issuedShares, shareClasses]);

  // Real-time validation errors
  const shareErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    const namedSum = shareClasses.A.issued + shareClasses.B.issued + shareClasses.C.issued;

    if (formData.issuedShares > formData.authorizedShares && formData.authorizedShares > 0) {
      errors.issuedShares = `Issued shares (${formData.issuedShares}) cannot exceed authorized shares (${formData.authorizedShares})`;
    }
    if (namedSum > formData.issuedShares && formData.issuedShares > 0) {
      errors.shareClasses = `Sum of share classes (${namedSum}) exceeds issued shares (${formData.issuedShares}). Reduce Class A, B, or C.`;
    }
    return errors;
  }, [formData.authorizedShares, formData.issuedShares, shareClasses]);

  const hasErrors = Object.keys(shareErrors).length > 0;

  React.useEffect(() => {
    if (isOpen && mode === 'existing') {
      fetchNonPrimaryCompanies();
    }
  }, [isOpen, mode]);

  const fetchNonPrimaryCompanies = async () => {
    try {
      const res = await apiGet<{ data: Company[] }>(endPoints.COMPANY.GET_ALL);
      const filtered = res.data.filter(c => c.companyType === 'NON_PRIMARY');
      setNonPrimaryCompanies(filtered);
    } catch (err) {
      console.error('Failed to fetch non-primary companies:', err);
    }
  };

  const handleSelectExisting = (companyId: string) => {
    const company = nonPrimaryCompanies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompanyId(companyId);
      const existingA = company.shareClasses?.find(s => s.class === 'A' || s.class === 'CLASS_A');
      const existingB = company.shareClasses?.find(s => s.class === 'B' || s.class === 'CLASS_B');
      const existingC = company.shareClasses?.find(s => s.class === 'C' || s.class === 'CLASS_C');
      const existingOrd = company.shareClasses?.find(s => s.class === 'ORDINARY');
      setFormData({
        ...formData,
        name: company.name || '',
        registrationNumber: company.registrationNumber || '',
        address: company.address || '',
        industry: company.industry || [''],
        summary: company.summary || '',
        authorizedShares: company.authorizedShares || 0,
        issuedShares: company.issuedShares || 0,
        legalType: company.legalType || '',
      });
      setShareClasses({
        A: { issued: existingA?.issued || 0, perShareValue: existingA?.perShareValue ? Number(existingA.perShareValue) : 0 },
        B: { issued: existingB?.issued || 0, perShareValue: existingB?.perShareValue ? Number(existingB.perShareValue) : 0 },
        C: { issued: existingC?.issued || 0, perShareValue: existingC?.perShareValue ? Number(existingC.perShareValue) : 0 },
        ORDINARY: { perShareValue: existingOrd?.perShareValue ? Number(existingOrd.perShareValue) : 0 },
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (mode === 'existing' && !selectedCompanyId) {
      errors.selectedCompanyId = 'Please select a company';
    }
    
    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    }
    
    if (!formData.registrationNumber.trim()) {
      errors.registrationNumber = 'Registration number is required';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.legalType) {
      errors.legalType = 'Legal type is required';
    }
    
    if (!industrySelection) {
      errors.industry = 'Industry selection is required';
    } else if (industrySelection === 'Other' && !formData.industry[0]?.trim()) {
      errors.industry = 'Please specify the industry';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    const isFormValid = validateForm();
    if (!isFormValid || hasErrors) {
      if (hasErrors && !isFormValid) {
        setSubmitError('Please fix the errors in the form before submitting.');
      }
      return;
    }
    
    setIsSubmitting(true);
    try {
      const shareDetails = [
        { class: 'A', issued: shareClasses.A.issued, perShareValue: shareClasses.A.perShareValue > 0 ? shareClasses.A.perShareValue : null },
        { class: 'B', issued: shareClasses.B.issued, perShareValue: shareClasses.B.perShareValue > 0 ? shareClasses.B.perShareValue : null },
        { class: 'C', issued: shareClasses.C.issued, perShareValue: shareClasses.C.perShareValue > 0 ? shareClasses.C.perShareValue : null },
        { class: 'ORDINARY', issued: ordinaryShares, perShareValue: shareClasses.ORDINARY.perShareValue > 0 ? shareClasses.ORDINARY.perShareValue : null },
      ].filter(s => s.issued > 0 || (s.class === 'ORDINARY' && ordinaryShares > 0));

      if (mode === 'new') {
        await apiPost(endPoints.COMPANY.CREATE, {
          ...formData,
          clientId,
          companyType: 'PRIMARY',
          incorporationStatus: true,
          industry: Array.isArray(formData.industry) ? formData.industry : [formData.industry],
          shareDetails,
        });
      } else {
        await apiPut(endPoints.COMPANY.UPDATE(selectedCompanyId), {
          ...formData,
          clientId,
          companyType: 'PRIMARY',
          incorporationStatus: true,
          industry: Array.isArray(formData.industry) ? formData.industry : [formData.industry],
          shareDetails,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create company:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to create company';
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 bg-gray-50/30">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-green-50 rounded-xl text-green-600">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Add Company</h3>
              <p className="text-xs text-gray-500 font-medium">Create a new company or onboard an existing one</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-100 bg-gray-50/50 px-8 py-2 gap-4">
          <button
            type="button"
            onClick={() => { setMode('new'); setSelectedCompanyId(''); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${mode === 'new' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            New Company
          </button>
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${mode === 'existing' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Existing (Non-Primary)
          </button>
        </div>

        <form id="create-company-form" onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {mode === 'existing' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Search size={14} /> Select Non-Primary Company
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => handleSelectExisting(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-medium"
                required={mode === 'existing'}
              >
                <option value="">-- Choose a company --</option>
                {nonPrimaryCompanies.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.registrationNumber || 'No Reg.'})</option>
                ))}
              </select>
              {fieldErrors.selectedCompanyId && (
                <p className="text-[10px] text-red-500 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                  {fieldErrors.selectedCompanyId}
                </p>
              )}
              <p className="text-[10px] text-gray-400 font-medium italic">Selecting a company will pre-fill its basic details.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={14} /> Company Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                }}
                className={`w-full px-4 py-3 bg-gray-50 border ${fieldErrors.name ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'} rounded-xl transition-all outline-none text-sm font-medium disabled:opacity-60 disabled:bg-gray-100`}
                disabled={mode === 'existing' && !!selectedCompanyId}
              />
              {fieldErrors.name && (
                <p className="text-[10px] text-red-500 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Hash size={14} /> Registration Number
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => {
                  setFormData({ ...formData, registrationNumber: e.target.value });
                  if (fieldErrors.registrationNumber) setFieldErrors({ ...fieldErrors, registrationNumber: '' });
                }}
                className={`w-full px-4 py-3 bg-gray-50 border ${fieldErrors.registrationNumber ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'} rounded-xl transition-all outline-none text-sm font-medium disabled:opacity-60 disabled:bg-gray-100`}
                disabled={mode === 'existing' && !!selectedCompanyId}
              />
              {fieldErrors.registrationNumber && (
                <p className="text-[10px] text-red-500 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                  {fieldErrors.registrationNumber}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> Legal Type
              </label>
              <div className="relative">
                <select
                  value={formData.legalType}
                  onChange={(e) => {
                    setFormData({ ...formData, legalType: e.target.value });
                    if (fieldErrors.legalType) setFieldErrors({ ...fieldErrors, legalType: '' });
                  }}
                  className={`w-full appearance-none px-4 py-3 pr-10 bg-gray-50 border ${fieldErrors.legalType ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'} rounded-xl transition-all outline-none text-sm font-medium text-gray-700 cursor-pointer disabled:opacity-60 disabled:bg-gray-100`}
                  disabled={mode === 'existing' && !!selectedCompanyId}
                >
                  <option value="">Select Legal Type</option>
                  <option value="PLC">PLC (Public Limited Company)</option>
                  <option value="LTD">LTD (Private Limited Company)</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {fieldErrors.legalType && (
                <p className="text-[10px] text-red-500 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                  {fieldErrors.legalType}
                </p>
              )}
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={14} /> Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: '' });
                }}
                className={`w-full px-4 py-3 bg-gray-50 border ${fieldErrors.address ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'} rounded-xl transition-all outline-none text-sm font-medium disabled:opacity-60 disabled:bg-gray-100`}
                disabled={mode === 'existing' && !!selectedCompanyId}
              />
              {fieldErrors.address && (
                <p className="text-[10px] text-red-500 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                  {fieldErrors.address}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Globe size={14} /> Industry
              </label>
              <div className="relative">
                <select
                  value={industrySelection}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIndustrySelection(val);
                    if (val !== 'Other') setFormData({ ...formData, industry: [val] });
                    else setFormData({ ...formData, industry: [''] });
                    if (fieldErrors.industry) setFieldErrors({ ...fieldErrors, industry: '' });
                  }}
                  className={`w-full appearance-none px-4 py-3 pr-10 bg-gray-50 border ${fieldErrors.industry ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'} rounded-xl transition-all outline-none text-sm font-medium text-gray-700 cursor-pointer`}
                >
                  <option value="">-- Select Industry --</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {industrySelection === 'Other' && (
                <input
                  type="text"
                  value={formData.industry[0] || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, industry: [e.target.value] });
                    if (fieldErrors.industry) setFieldErrors({ ...fieldErrors, industry: '' });
                  }}
                  placeholder="Enter your industry..."
                  className={`w-full px-4 py-3 bg-gray-50 border ${fieldErrors.industry ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'} rounded-xl transition-all outline-none text-sm font-medium mt-2`}
                />
              )}
              {fieldErrors.industry && (
                <p className="text-[10px] text-red-500 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                  {fieldErrors.industry}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <PieChart size={14} /> Authorized Shares
              </label>
              <NumericInput
                value={formData.authorizedShares}
                onChange={(val) => setFormData({ ...formData, authorizedShares: val })}
                step={1}
                min={0}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={14} /> Issued Shares
              </label>
              <NumericInput
                value={formData.issuedShares}
                onChange={(val) => setFormData({ ...formData, issuedShares: val })}
                step={1}
                min={0}
              />
              {shareErrors.issuedShares && (
                <p className="text-xs text-red-500 font-medium mt-1">{shareErrors.issuedShares}</p>
              )}
            </div>

            {/* Share Classes Breakdown */}
            <div className="md:col-span-2 p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 border-b-2 border-primary pb-1 uppercase tracking-widest inline-block">Share Class Breakdown</h4>
                <p className="text-[10px] text-gray-400 font-medium italic">Ordinary = Issued − (A + B + C)</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class A</label>
                  <NumericInput
                    value={shareClasses.A.issued}
                    onChange={(val) => setShareClasses({ ...shareClasses, A: { ...shareClasses.A, issued: val } })}
                    step={1}
                    min={0}
                  />
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mt-3 mb-1">Per Share Value</label>
                  <NumericInput
                    value={shareClasses.A.perShareValue}
                    onChange={(val) => setShareClasses({ ...shareClasses, A: { ...shareClasses.A, perShareValue: val } })}
                    step={0.01}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class B</label>
                  <NumericInput
                    value={shareClasses.B.issued}
                    onChange={(val) => setShareClasses({ ...shareClasses, B: { ...shareClasses.B, issued: val } })}
                    step={1}
                    min={0}
                  />
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mt-3 mb-1">Per Share Value</label>
                  <NumericInput
                    value={shareClasses.B.perShareValue}
                    onChange={(val) => setShareClasses({ ...shareClasses, B: { ...shareClasses.B, perShareValue: val } })}
                    step={0.01}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class C</label>
                  <NumericInput
                    value={shareClasses.C.issued}
                    onChange={(val) => setShareClasses({ ...shareClasses, C: { ...shareClasses.C, issued: val } })}
                    step={1}
                    min={0}
                  />
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mt-3 mb-1">Per Share Value</label>
                  <NumericInput
                    value={shareClasses.C.perShareValue}
                    onChange={(val) => setShareClasses({ ...shareClasses, C: { ...shareClasses.C, perShareValue: val } })}
                    step={0.01}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    Ordinary <Lock size={10} className="text-gray-400" />
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 cursor-not-allowed select-none mb-3">
                    {ordinaryShares.toLocaleString()}
                  </div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mt-2 mb-1">Per Share Value</label>
                  <NumericInput
                    value={shareClasses.ORDINARY.perShareValue}
                    onChange={(val) => setShareClasses({ ...shareClasses, ORDINARY: { ...shareClasses.ORDINARY, perShareValue: val } })}
                    step={0.01}
                    min={0}
                  />
                </div>
              </div>
              {shareErrors.shareClasses && (
                <p className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  ⚠️ {shareErrors.shareClasses}
                </p>
              )}
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} /> Description
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-medium resize-none"
              />
            </div>
          </div>

          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
              ⚠️ {submitError}
            </div>
          )}
        </form>

        <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 rounded-xl border-gray-200 text-gray-500 hover:bg-white"
          >
            Cancel
          </Button>
          <Button
            form="create-company-form"
            type="submit"
            disabled={isSubmitting || hasErrors}
            className="px-8 py-2 rounded-xl bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : mode === 'new' ? 'Create Company' : 'Onboard Company'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCompanyModal;
