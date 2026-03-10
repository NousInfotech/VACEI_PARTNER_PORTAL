import React from 'react';
import {
  ChevronDown,
  Settings2,
  PieChart,
  ShieldCheck,
  Receipt,
  BarChart4,
  Users,
  Scale,
  Wallet,
  Layers,
  Cpu,
  Award,
  Building2,
  CheckSquare,
  Archive,
  Star,
} from 'lucide-react';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { Badge } from '@/ui/badge';
import { Dropdown } from '../../../common/Dropdown';
import type {
  CreateTemplateDto,
  ServiceRequestTemplate,
  CustomService,
} from '../../../../types/service-request-template';
import type { DropdownItem } from '../../../common/Dropdown';

const serviceIconMap: Record<string, React.ReactNode> = {
  ACCOUNTING: <PieChart size={14} />,
  AUDITING: <ShieldCheck size={14} />,
  VAT: <Receipt size={14} />,
  CFO: <BarChart4 size={14} />,
  CSP: <Users size={14} />,
  LEGAL: <Scale size={14} />,
  PAYROLL: <Wallet size={14} />,
  PROJECTS_TRANSACTIONS: <Layers size={14} />,
  TECHNOLOGY: <Cpu size={14} />,
  GRANTS_AND_INCENTIVES: <Award size={14} />,
  INCORPORATION: <Building2 size={14} />,
  MBR: <CheckSquare size={14} />,
  TAX: <Receipt size={14} />,
  LIQUIDATION: <Archive size={14} />,
  CUSTOM: <Star size={14} />,
};

interface TemplateSettingsCardProps {
  formData: CreateTemplateDto;
  template?: ServiceRequestTemplate;
  isEdit: boolean;
  onUpdate: (updates: Partial<CreateTemplateDto>) => void;
  serviceOptions: DropdownItem[];
  customServices?: CustomService[];
  hideMetadata?: boolean;
  templatedServices?: { service: string | null; customServiceCycleId?: string | null }[];
}

export const TemplateSettingsCard: React.FC<TemplateSettingsCardProps> = ({
  formData,
  template,
  isEdit,
  onUpdate,
  serviceOptions,
  customServices = [],
  hideMetadata = false,
  templatedServices = [],
}) => {
  const getServiceLabel = () => {
    if (!formData.service) return 'Select Service...';
    if (formData.service === 'CUSTOM' && formData.customServiceCycleId) {
      const custom = customServices.find((cs) => cs.id === formData.customServiceCycleId);
      return custom ? custom.title : 'Custom Service';
    }
    return formData.service.replace(/_/g, ' ');
  };

  const getActiveIcon = () => {
    if (!formData.service) return <Settings2 size={16} className="text-gray-400" />;
    return (
      <div className="p-2 bg-primary/10 text-primary rounded-lg">
        {serviceIconMap[formData.service] || <Settings2 size={16} />}
      </div>
    );
  };

  const renderMetadata = () => {
    if (!template || hideMetadata) return null;
    return (
      <div className="space-y-6 pt-6 border-top border-gray-100 mt-6">
        <div className="flex justify-between items-center py-3 border-b border-gray-50">
          <span className="text-sm font-medium text-gray-500">Version</span>
          <span className="font-bold text-gray-900">v{template.version}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-50">
          <span className="text-sm font-medium text-gray-500">Created By</span>
          <span className="font-bold text-gray-900">
            {template.creator
              ? `${template.creator.firstName} ${template.creator.lastName}`
              : 'System'}
          </span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="text-sm font-medium text-gray-500">Last Updated</span>
          <span className="font-bold text-gray-900">
            {new Date(template.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  if (!isEdit) {
    return (
      <ShadowCard className="p-8 border-none shadow-sm bg-white rounded-[40px]">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Template Info
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between items-center py-3 border-b border-gray-50">
            <span className="text-sm font-medium text-gray-500">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                formData.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
              }`}
            >
              {formData.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-50">
            <span className="text-sm font-medium text-gray-500">Type</span>
            <span className="font-bold text-gray-900">{formData.type}</span>
          </div>
          {formData.type === 'SERVICE' && formData.service && (
            <div className="flex justify-between items-center py-3">
              <span className="text-sm font-medium text-gray-500">Service</span>
              <div className="flex items-center gap-2 font-bold text-gray-900 uppercase">
                {serviceIconMap[formData.service] || null}
                {getServiceLabel()}
              </div>
            </div>
          )}
        </div>
        {renderMetadata()}
      </ShadowCard>
    );
  }

  return (
    <ShadowCard className="p-8 border border-gray-100 relative focus-within:z-40 mb-6 transition-all duration-300 rounded-[40px] shadow-sm bg-white">
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-gray-50 rounded-2xl text-gray-400">
              <Settings2 className="h-5 w-5" />
            </div>
            Template Settings
          </h3>
          <Badge
            variant={formData.isActive ? 'default' : 'outline'}
            className="rounded-full px-4 py-1.5 font-bold uppercase tracking-wider text-[10px]"
          >
            {formData.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Template Type section removed - always SERVICE or as per formData */}

          {formData.type === 'SERVICE' && (
            <div className={`flex flex-col gap-4 items-start flex-1 w-full ${formData.type === 'SERVICE' ? 'lg:col-span-2' : ''}`}>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                  Target Service
                </span>
                <p className="text-sm text-gray-500 px-1 font-medium">
                  Select which service this template will represent
                </p>
              </div>
              <div className="w-full">
                <Dropdown
                  fullWidth
                  className="w-full"
                  items={serviceOptions.map((opt) => {
                    const isTemplated = templatedServices.some(
                      (ts) =>
                        ts.service === opt.id &&
                        ts.customServiceCycleId ===
                          ((opt as DropdownItem & { customServiceCycleId?: string }).customServiceCycleId || null),
                    );
                    return {
                      ...opt,
                      disabled: isTemplated,
                      icon: (
                        <div className={`p-1.5 rounded-lg transition-colors ${
                          isTemplated 
                            ? 'bg-gray-50 text-gray-300' 
                            : 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          {serviceIconMap[opt.id as string] || <Star size={12} />}
                        </div>
                      ),
                      className: `group ${isTemplated ? 'opacity-50 cursor-not-allowed grayscale' : ''}`,
                      label: (
                        <div className="flex items-center justify-between w-full">
                          <span>{opt.label}</span>
                          {isTemplated && (
                            <span className="text-[10px] font-bold text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-md">
                              Already Templated
                            </span>
                          )}
                        </div>
                      ),
                      onClick: isTemplated
                        ? undefined
                        : () =>
                            onUpdate({
                              service: opt.id as string | null,
                              customServiceCycleId:
                                (opt as DropdownItem & { customServiceCycleId?: string })
                                  .customServiceCycleId || null,
                            }),
                    };
                  })}
                  trigger={
                    <button
                      type="button"
                      className="w-full px-6 py-5 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between text-sm font-bold text-gray-900 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 focus:ring-4 focus:ring-primary/5 outline-none shadow-sm group"
                    >
                      <div className="flex items-center gap-4">
                        {getActiveIcon()}
                        <span className="truncate tracking-tight text-lg">
                          {getServiceLabel()}
                        </span>
                      </div>
                      <ChevronDown className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors duration-500 shrink-0 ml-4" />
                    </button>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {renderMetadata()}
    </ShadowCard>
  );
};

