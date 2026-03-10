import React, { useState, useEffect, useMemo } from 'react';
import { X, Building2, MapPin, Globe, FileText, PieChart, BarChart3, Hash, Lock, ChevronDown } from 'lucide-react';
import { Button } from '../../../../../ui/Button'; 

import { apiPut } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import type { Company } from '../../../../../types/company';
import NumericInput from '@/ui/NumericInput';

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Energy', 'Construction', 'Education', 'Transportation', 'Real Estate',
  'Consulting', 'Other',
];

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  company: Company;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  company,
}) => {
  const [formData, setFormData] = useState({
    name: company.name || '',
    address: company.address || '',
    industry: Array.isArray(company.industry) ? company.industry : [company.industry || ''],
    summary: company.summary || '',
    authorizedShares: company.authorizedShares || 0,
    issuedShares: company.issuedShares || 0,
    registrationNumber: company.registrationNumber || '',
    legalType: company.legalType || '',
  });

  const [shareClasses, setShareClasses] = useState({
    A: company.shareClasses?.find(s => s.class === 'A' || s.class === 'CLASS_A')?.issued || 0,
    B: company.shareClasses?.find(s => s.class === 'B' || s.class === 'CLASS_B')?.issued || 0,
    C: company.shareClasses?.find(s => s.class === 'C' || s.class === 'CLASS_C')?.issued || 0,
  });

  const existingIndustry = Array.isArray(company.industry) ? (company.industry[0] || '') : (company.industry || '');
  const initialSelection = industries.includes(existingIndustry) ? existingIndustry : (existingIndustry ? 'Other' : '');
  const [industrySelection, setIndustrySelection] = useState<string>(initialSelection);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-calculate Ordinary = Issued - (A + B + C)
  const ordinaryShares = useMemo(() => {
    const named = shareClasses.A + shareClasses.B + shareClasses.C;
    const result = formData.issuedShares - named;
    return result >= 0 ? result : 0;
  }, [formData.issuedShares, shareClasses]);

  // Real-time validation errors
  const shareErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    const namedSum = shareClasses.A + shareClasses.B + shareClasses.C;

    if (formData.issuedShares > formData.authorizedShares && formData.authorizedShares > 0) {
      errors.issuedShares = `Issued shares (${formData.issuedShares}) cannot exceed authorized shares (${formData.authorizedShares})`;
    }
    if (namedSum > formData.issuedShares && formData.issuedShares > 0) {
      errors.shareClasses = `Sum of share classes (${namedSum}) exceeds issued shares (${formData.issuedShares}). Reduce Class A, B, or C.`;
    }
    return errors;
  }, [formData.authorizedShares, formData.issuedShares, shareClasses]);

  const hasErrors = Object.keys(shareErrors).length > 0;

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: company.name || '',
        address: company.address || '',
        industry: Array.isArray(company.industry) ? company.industry : [company.industry || ''],
        summary: company.summary || '',
        authorizedShares: company.authorizedShares || 0,
        issuedShares: company.issuedShares || 0,
        registrationNumber: company.registrationNumber || '',
        legalType: company.legalType || '',
      });
      setShareClasses({
        A: company.shareClasses?.find(s => s.class === 'A' || s.class === 'CLASS_A')?.issued || 0,
        B: company.shareClasses?.find(s => s.class === 'B' || s.class === 'CLASS_B')?.issued || 0,
        C: company.shareClasses?.find(s => s.class === 'C' || s.class === 'CLASS_C')?.issued || 0,
      });
      const ind = Array.isArray(company.industry) ? (company.industry[0] || '') : (company.industry || '');
      setIndustrySelection(industries.includes(ind) ? ind : (ind ? 'Other' : ''));
      setSubmitError('');
    }
  }, [isOpen, company]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
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
        { class: 'A', issued: shareClasses.A },
        { class: 'B', issued: shareClasses.B },
        { class: 'C', issued: shareClasses.C },
        { class: 'ORDINARY', issued: ordinaryShares },
      ].filter(s => s.issued > 0);

      await apiPut(endPoints.COMPANY.UPDATE(company.id), {
        ...formData,
        industry: Array.isArray(formData.industry) ? formData.industry : [formData.industry],
        shareDetails,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update company:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to update company details';
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
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Edit Company Details</h3>
              <p className="text-xs text-gray-500 font-medium">Update the company's core information</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
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
                className={`w-full px-4 py-3 bg-gray-50 border ${fieldErrors.name ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'} rounded-xl transition-all outline-none text-sm font-medium`}
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
                className={`w-full px-4 py-3 bg-gray-50 border ${fieldErrors.registrationNumber ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'} rounded-xl transition-all outline-none text-sm font-medium`}
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
                  className={`w-full appearance-none px-4 py-3 pr-10 bg-gray-50 border ${fieldErrors.legalType ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'} rounded-xl transition-all outline-none text-sm font-medium text-gray-700 cursor-pointer`}
                >
                  <option value="">-- Select Legal Type --</option>
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
                className={`w-full px-4 py-3 bg-gray-50 border ${fieldErrors.address ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'} rounded-xl transition-all outline-none text-sm font-medium`}
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
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class A</label>
                  <NumericInput
                    value={shareClasses.A}
                    onChange={(val) => setShareClasses({ ...shareClasses, A: val })}
                    step={1}
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class B</label>
                  <NumericInput
                    value={shareClasses.B}
                    onChange={(val) => setShareClasses({ ...shareClasses, B: val })}
                    step={1}
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class C</label>
                  <NumericInput
                    value={shareClasses.C}
                    onChange={(val) => setShareClasses({ ...shareClasses, C: val })}
                    step={1}
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    Ordinary <Lock size={10} className="text-gray-400" />
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 cursor-not-allowed select-none">
                    {ordinaryShares.toLocaleString()}
                  </div>
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
            onClick={handleSubmit}
            disabled={isSubmitting || hasErrors}
            className="px-8 py-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditCompanyModal;
