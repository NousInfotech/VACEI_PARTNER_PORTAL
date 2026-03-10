import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  CheckCircle2,
  Search,
  Briefcase,
  Building,
  Check,
  Info,
  Calendar
} from 'lucide-react';
import { Button } from '../../../../ui/Button';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { apiGet, apiPost } from '../../../../config/base';
import { endPoints } from '../../../../config/endPoint';
import {type Organization } from '@/lib/types';
import { Services } from '../../../../types/service-request-template';
import type { Company } from '../../../../types/company';
import { smoothScrollToTop } from '../../../../lib/utils';
import { StatusSuccessModal } from './components/StatusUpdateModals';


const USE_MOCK_DATA = false;

const CreateEngagementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCompanyId = queryParams.get('companyId');
  const initialService = queryParams.get('service');
  const initialCompanyName = queryParams.get('companyName');
  const initialClientId = queryParams.get('clientId');

  const [step, setStep] = useState(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId || '');
  const [companyName, setCompanyName] = useState(initialCompanyName || 'Unknown Company');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedService, setSelectedService] = useState(initialService || '');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOrg, setSearchOrg] = useState('');
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Period states
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'RANGE' | 'YEAR_END'>('MONTHLY');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>(['1']);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [yearEndDate, setYearEndDate] = useState('');


  useEffect(() => {
    const fetchOrgs = async () => {
      setLoading(true);
      try {
        const res = await apiGet<{ data: Organization[] }>(endPoints.ORGANIZATION.GET_ALL);
        setOrganizations(res.data);
      } catch (err) {
        console.error('Failed to fetch orgs', err);
      } finally {
        setLoading(false);
      }
    };
    if (!USE_MOCK_DATA) fetchOrgs();
    else {
      setOrganizations([
        {
          id: 'org_1',
          name: 'VACEI HQ',
          availableServices: ['ACCOUNTING', 'VAT', 'INCORPORATION'],
          status: 'ACTIVE',
          type: 'FIRM'
        },
        {
          id: 'org_2',
          name: 'Malta Business Pros',
          availableServices: ['LEGAL', 'VAT'],
          status: 'ACTIVE',
          type: 'FIRM'
        }
      ]);
    }
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!initialClientId) return;
      try {
        const res = await apiGet<{ data: Company[] }>(endPoints.COMPANY.GET_BY_CLIENT(initialClientId));
        setCompanies(res.data);
      } catch (err) {
        console.error('Failed to fetch companies', err);
      }
    };
    if (!USE_MOCK_DATA) fetchCompanies();
    else {
      setCompanies([
        {
          id: initialCompanyId || 'comp_1',
          name: initialCompanyName || 'Main Entity',
          registrationNumber: 'C12345',
          address: null,
          companyType: null,
          legalType: null,
          summary: null,
          industry: [],
          authorizedShares: 0,
          issuedShares: 0,
          incorporationStatus: true,
          kycStatus: true,
          clientId: '',
          createdAt: '',
          updatedAt: '',
          quickBookStatus: null
        } as Company,
        {
          id: 'comp_2',
          name: 'Alternative Entity Ltd',
          registrationNumber: 'C54321',
          address: null,
          companyType: null,
          legalType: null,
          summary: null,
          industry: [],
          authorizedShares: 0,
          issuedShares: 0,
          incorporationStatus: true,
          kycStatus: true,
          clientId: '',
          createdAt: '',
          updatedAt: '',
          quickBookStatus: null
        } as Company
      ]);
    }
  }, [initialClientId, initialCompanyId, initialCompanyName]);

  useEffect(() => {
    // Delay slightly to allow the transition animations to start
    const timeoutId = setTimeout(smoothScrollToTop, 50);
    return () => clearTimeout(timeoutId);
  }, [step]);

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchOrg.toLowerCase());
    if (selectedService) {
      return matchesSearch && org.availableServices?.includes(selectedService);
    }
    return matchesSearch;
  });

  const handleNext = () => setStep((s: number) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s: number) => Math.max(s - 1, 1));

  const handleCreate = async () => {
    setLoading(true);
    
    const periods: any[] = [];
    const currentYear = parseInt(selectedYear);

    const isRecurring = ['ACCOUNTING', 'VAT', 'PAYROLL', 'MBR', 'TAX', 'AUDITING'].includes(selectedService);

    if (isRecurring) {
      if (periodType === 'MONTHLY') {
        selectedMonths.forEach(m => periods.push({ frequency: 'monthly', year: currentYear, month: parseInt(m) }));
      } else if (periodType === 'QUARTERLY') {
        selectedQuarters.forEach(q => periods.push({ frequency: 'quarterly', year: currentYear, quarter: parseInt(q) }));
      } else if (periodType === 'YEARLY') {
        periods.push({ frequency: 'yearly', year: currentYear });
      } else if (periodType === 'RANGE') {
        periods.push({ startDate, endDate });
      } else if (periodType === 'YEAR_END') {
        periods.push({ yearEndDate });
      }
    } else {
      periods.push({}); // Simple one-off
    }

    if (isRecurring && periods.length === 0) {
      alert('Please select at least one period');
      setLoading(false);
      return;
    }

    try {
      let successCount = 0;
      for (const p of periods) {
        if (!USE_MOCK_DATA) {
          await apiPost(endPoints.ENGAGEMENT.CREATE, {
            companyId: selectedCompanyId,
            organizationId: selectedOrgId,
            serviceCategory: selectedService,
            period: p,
          });
          successCount++;
        } else {
          // Mock logic
          // const newEng: Engagement = {
          //   id: `eng_${Date.now()}_${successCount}`,
          //   companyId: selectedCompanyId,
          //   companyName: companies.find(c => c.id === selectedCompanyId)?.name || companyName,
          //   organizationId: selectedOrgId,
          //   organizationName: organizations.find(o => o.id === selectedOrgId)?.name || 'Mock Org',
          //   serviceCategory: selectedService as keyof typeof Services,
          //   status: 'ASSIGNED',
          //   createdAt: new Date().toISOString(),
          //   updatedAt: new Date().toISOString(),
          // };
          // mockEngagements.push(newEng);
          successCount++;
        }
      }
      setShowSuccessModal(true);
    } catch {
      alert('Failed to create some or all engagements');
    } finally {
      setLoading(false);
    }
  };


  const steps = [
    { id: 1, name: 'Target Entity' },
    { id: 2, name: 'Service Provider' },
    { id: 3, name: 'Service Selection' },
    { id: 4, name: 'Final Review' }
  ];

  return (
    <div className="mx-auto space-y-5 pb-20">
      {/* <PageHeader 
        title="Engagement Launch" 
        icon={ShieldCheck}
        description="Formalize the professional relationship between the entity and the service provider."
        showBack={true}
      /> */}

      {/* Modern Stepper */}
      <div className="px-10 mx-auto">
        <div className="relative flex items-center justify-between w-full">
          {/* Progress Track Background */}
 
          
          {/* Active Progress Track */}
          <div 
            className="absolute top-[18px] left-[18px] h-px bg-primary z-0 transition-all duration-700 ease-in-out" 
            style={{ width: `calc(((100% - 36px) * ${step - 1}) / ${steps.length - 1})` }}
          />
          
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                  step > s.id 
                    ? 'bg-primary text-white scale-90' 
                    : step === s.id 
                      ? 'bg-white text-primary border border-gray-300 scale-105' 
                      : 'bg-white text-gray-300 border border-gray-100'
                }`}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : <span className="font-bold text-[11px]">{s.id}</span>}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-500 whitespace-nowrap ${step >= s.id ? 'text-gray-900' : 'text-gray-300'}`}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="space-y-8">
          <ShadowCard className="p-10 border-none shadow-2xl shadow-gray-200/50 bg-white rounded-[48px] min-h-[500px] flex flex-col relative overflow-hidden">
            <div className="flex-1">
              {step === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-end justify-between gap-4">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-gray-900 tracking-tight">Entity Identification</h2>
                       <p className="text-gray-500 font-medium tracking-tight">The following entity will be the principal for this engagement.</p>
                    </div>
                    {companies.length > 1 && !isChangingCompany && (
                      <Button 
                        variant="outline" 
                        onClick={() => setIsChangingCompany(true)}
                        className="rounded-2xl border-2 border-dashed border-gray-200 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5 hover:border-primary/20 h-12 px-6"
                      >
                        Switch Account / Entity
                      </Button>
                    )}
                  </div>

                  {!isChangingCompany ? (
                    <div className="group relative px-6 py-2 rounded-2xl border border-primary bg-primary/5 shadow-2xl shadow-primary/10 transition-all duration-500 text-left animate-in zoom-in-95">
                      <div className="absolute top-8 right-10 text-primary">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="w-15 h-15 rounded-2xl bg-white text-primary shadow-xl flex items-center justify-center border border-gray-100">
                          <Building size={30} />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Primary Entity</span>
                          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {companies.find(c => c.id === selectedCompanyId)?.name || companyName}
                          </h3>
                          <div className="flex items-center gap-3 pt-1">
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-green-500 uppercase tracking-widest">
                              <CheckCircle2 size={14} />
                              Verified Identity
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar animate-in fade-in slide-in-from-top-4">
                      {companies.map((comp) => (
                        <button 
                          key={comp.id}
                          onClick={() => {
                            setSelectedCompanyId(comp.id);
                            setCompanyName(comp.name);
                            setIsChangingCompany(false);
                          }}
                          className={`group relative p-6 rounded-3xl border-2 text-left transition-all duration-500 ${
                            selectedCompanyId === comp.id 
                              ? 'border-primary bg-primary/5 shadow-xl' 
                              : 'border-gray-100 hover:border-primary/20 bg-gray-50/50 hover:bg-white'
                          }`}
                        >
                          {selectedCompanyId === comp.id && (
                            <div className="absolute top-4 right-4 text-primary animate-in zoom-in duration-300">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 ${
                              selectedCompanyId === comp.id ? 'bg-primary text-white shadow-lg' : 'bg-white text-primary border border-gray-100 group-hover:scale-110'
                            }`}>
                              <Building size={20} />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Select Entity</span>
                              <h4 className="text-lg font-bold text-gray-900 leading-tight">{comp.name}</h4>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-4 items-center">
                    <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm h-fit">
                      <Info size={18} />
                    </div>
                    <p className="text-sm text-blue-800/80 font-medium leading-relaxed">
                      {isChangingCompany 
                        ? "Select the correct entity from the list above. Each entity represents a distinct legal registration within your portfolio." 
                        : "This information is automatically populated from the service request. If you have multiple entities, you can switch them using the balance account option."}
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Select Provider</h2>
                    <p className="text-gray-500 font-medium tracking-tight">Choose the professional firm that will fulfill the <b>{selectedService.toLowerCase().replace(/_/g, ' ')}</b> service.</p>
                  </div>
                  
                  <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors duration-300" />
                    <input 
                      type="text" 
                      value={searchOrg}
                      onChange={(e) => setSearchOrg(e.target.value)}
                      placeholder="Search organizations by name..."
                      className="w-full pl-16 pr-8 py-5 rounded-3xl bg-gray-50 border border-gray-400 focus:border-primary/20 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all duration-300 font-bold text-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                    {filteredOrgs.length > 0 ? filteredOrgs.map((org) => (
                      <button 
                        key={org.id}
                        onClick={() => setSelectedOrgId(org.id)}
                        className={`group p-6 rounded-[32px] border-2 text-left transition-all duration-500 relative overflow-hidden ${
                          selectedOrgId === org.id 
                            ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' 
                            : 'border-gray-300 hover:border-primary/30 bg-gray-50/50 hover:bg-white'
                        }`}
                      >
                        {selectedOrgId === org.id && (
                          <div className="absolute top-4 right-4 text-primary animate-in zoom-in duration-300">
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                        )}
                        <div className="flex items-center gap-5">
                          <div className={`p-4 rounded-[22px] transition-all duration-500 ${
                            selectedOrgId === org.id ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                          }`}>
                            <Building2 className="h-7 w-7" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-lg truncate">{org.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {org.availableServices?.map(s => (
                                <span key={s} className="text-[9px] px-2 py-1 bg-primary text-white rounded-lg font-bold uppercase tracking-wider">{s.replace(/_/g, ' ')}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    )) : (
                      <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                          <Search size={32} />
                        </div>
                        <p className="text-gray-400 font-bold">No eligible providers found for your search.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Engagement Scope</h2>
                    <p className="text-gray-500 font-medium tracking-tight">Select the primary service line for this engagement.</p>
                  </div>
                  <div className="grid grid-cols-4 gap-6">
                    {Object.keys(Services).map((svc) => (
                      <button 
                        key={svc}
                        onClick={() => {
                          setSelectedService(svc);
                          // Set default period types
                          if (svc === 'AUDITING') setPeriodType('YEAR_END');
                          else if (svc === 'VAT') setPeriodType('QUARTERLY');
                          else if (svc === 'ACCOUNTING' || svc === 'PAYROLL') setPeriodType('RANGE');
                          else if (['MBR', 'TAX'].includes(svc)) setPeriodType('YEARLY');
                        }}
                        className={`group px-5 py-3 rounded-2xl border-2 text-left transition-all duration-500 ${
                          selectedService === svc 
                            ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-102 z-10' 
                            : 'border-gray-200 hover:border-primary/20 bg-gray-50/50 hover:bg-white hover:shadow-lg'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-500 ${
                          selectedService === svc ? 'bg-primary text-white shadow-lg rotate-6' : 'bg-white text-gray-300 group-hover:text-primary group-hover:scale-110'
                        }`}>
                          <Briefcase className="h-7 w-7" />
                        </div>
                        <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs leading-relaxed">{svc.replace(/_/g, ' ')}</h4>

                      </button>
                    ))}
                  </div>

                  {/* Period Selection for Recurring Services */}
                  {['ACCOUNTING', 'VAT', 'PAYROLL', 'MBR', 'TAX', 'AUDITING'].includes(selectedService) && (
                    <div className="mt-8 p-8 bg-gray-50/50 rounded-[32px] border border-gray-100 space-y-8 animate-in fade-in slide-in-from-top-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="text-primary h-5 w-5" />
                        <h3 className="font-bold text-gray-900 uppercase tracking-widest text-[10px]">Engagement Period Configuration</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {selectedService === 'VAT' && (
                          <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Frequency</label>
                            <div className="flex gap-2">
                              {['YEARLY', 'QUARTERLY', 'MONTHLY'].map(f => (
                                <button
                                  key={f}
                                  onClick={() => setPeriodType(f as any)}
                                  className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                                    periodType === f ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                                  }`}
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedService === 'AUDITING' && (
                          <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Year End Date</label>
                            <input type="date" value={yearEndDate} onChange={(e) => setYearEndDate(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-gray-200 font-bold" />
                          </div>
                        )}

                        {['ACCOUNTING', 'PAYROLL'].includes(selectedService) && (
                          <>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Start Date</label>
                              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-gray-200 font-bold" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">End Date</label>
                              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-gray-200 font-bold" />
                            </div>
                          </>
                        )}

                        {['VAT', 'MBR', 'TAX'].includes(selectedService) && (
                          <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Year</label>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-gray-200 font-bold">
                              {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
                            </select>
                          </div>
                        )}
                      </div>

                      {selectedService === 'VAT' && periodType === 'MONTHLY' && (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                            <button
                              key={m}
                              onClick={() => {
                                const val = String(i + 1);
                                setSelectedMonths(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
                              }}
                              className={`py-2 rounded-xl border font-bold text-xs ${selectedMonths.includes(String(i+1)) ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedService === 'VAT' && periodType === 'QUARTERLY' && (
                        <div className="grid grid-cols-2 gap-4">
                          {[1, 2, 3, 4].map(q => (
                            <button
                              key={q}
                              onClick={() => {
                                const val = String(q);
                                setSelectedQuarters(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
                              }}
                              className={`p-4 rounded-2xl border font-bold text-sm flex items-center justify-between ${selectedQuarters.includes(String(q)) ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}
                            >
                              Q{q}: {['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'][q-1]}
                              {selectedQuarters.includes(String(q)) && <CheckCircle2 size={16} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[32px] flex items-center justify-center mx-auto border border-green-100 shadow-2xl shadow-green-500/20 scale-110 animate-bounce-subtle">
                      <ShieldCheck className="h-12 w-12" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Review & Activate</h2>
                      <p className="text-gray-500 font-medium">Verify the engagement structure before final activation.</p>
                    </div>
                  </div>

                  <div className="relative p-1 border border-gray-300 rounded-[48px] overflow-hidden">
                    <div className="bg-white p-10 rounded-[44px] space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Client Entity</span>
                            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-4">
                              <Building className="text-primary/40 h-6 w-6" />
                              <span className="font-bold text-gray-900 truncate">{companyName}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Service Provider</span>
                            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-4">
                              <Building2 className="text-primary/40 h-6 w-6" />
                              <span className="font-bold text-gray-900 truncate">{organizations.find(o => o.id === selectedOrgId)?.name || 'Not Selected'}</span>
                            </div>
                          </div>
                       </div>
                       
                       <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl text-primary shadow-sm border border-primary/5">
                              <Briefcase size={24} />
                            </div>
                             <div>
                                <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none">Planned Engagements</span>
                                <h4 className="text-xl font-bold text-gray-900 leading-tight pt-1">
                                  {selectedService.replace(/_/g, ' ')}
                                </h4>
                                <div className="mt-4 space-y-2">
                                  {(() => {
                                    const periods: string[] = [];
                                    const currentYear = selectedYear;
                                    if (periodType === 'MONTHLY') {
                                      const monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                      selectedMonths.sort((a,b) => parseInt(a)-parseInt(b)).forEach(m => periods.push(`${monthsArr[parseInt(m)-1]} ${currentYear}`));
                                    } else if (periodType === 'QUARTERLY') {
                                      selectedQuarters.sort().forEach(q => periods.push(`Q${q} ${currentYear}`));
                                    } else if (periodType === 'YEARLY') {
                                      periods.push(`Annual ${currentYear}`);
                                    } else if (periodType === 'RANGE') {
                                      periods.push(`${startDate} - ${endDate}`);
                                    } else if (periodType === 'YEAR_END') {
                                      periods.push(`Year End: ${yearEndDate}`);
                                    } else {
                                      periods.push('One-time mandate');
                                    }

                                    return periods.map((p, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                        {p}
                                      </div>
                                    ));
                                  })()}
                                </div>
                             </div>
                          </div>
                          <div className="px-5 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                             Official Mandate
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 pt-10 border-t border-gray-100 flex items-center justify-between gap-4">
              {step === 1 ? (
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)} 
                  className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-xs border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 hover:bg-white transition-all duration-300"
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleBack} 
                  className="rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-xs border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 hover:bg-white transition-all duration-300"
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Previous Step
                </Button>
              )}

              {step < 4 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={(step === 1 && !selectedCompanyId) || (step === 2 && !selectedOrgId) || (step === 3 && !selectedService)}
                  className="rounded-2xl px-12 h-14 font-black uppercase tracking-widest text-xs bg-gray-900 hover:bg-black shadow-2xl shadow-gray-400/20"
                >
                  Continue
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCreate}
                  disabled={loading}
                  className="rounded-2xl px-16 h-14 font-black uppercase tracking-widest text-xs bg-primary hover:bg-primary-dark shadow-2xl shadow-primary/30"
                >
                  {loading ? 'Activating...' : 'Confirm & Launch Engagement'}
                  <CheckCircle2 className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          </ShadowCard>
        </div>

 
      </div>

      <StatusSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => navigate('/dashboard/engagements')}
        title="Engagement Created Successfully"
        message="The professional engagement has been successfully formalized and activated."
      />
    </div>
  );
};


export default CreateEngagementPage;
