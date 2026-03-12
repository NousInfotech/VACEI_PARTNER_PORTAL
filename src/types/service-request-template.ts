export type InputType = 'text' | 'number' | 'select' | 'radio' | 'text_area' | 'checklist' | 'date' | 'month' | 'year' | 'month_year';

export interface OptionWithQuestions {
  value: string;
  label?: string;
  questions?: FormField[];
}

export type FormFieldOption = string | OptionWithQuestions;

export interface FormField {
  question: string;
  input_type: InputType;
  options?: FormFieldOption[];
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  minYear?: number;
  maxYear?: number;
  minMonth?: string;
  maxMonth?: string;
  isRange?: boolean;
}

export function isOptionWithQuestions(opt: FormFieldOption): opt is OptionWithQuestions {
  return typeof opt === 'object' && opt !== null && 'value' in opt;
}

export function getOptionLabel(opt: FormFieldOption): string {
  if (typeof opt === 'string') return opt;
  return opt.label || opt.value;
}

export type TemplateType = 'GENERAL' | 'SERVICE';

export const Services = {
  ACCOUNTING: 'ACCOUNTING',
  AUDITING: 'AUDITING',
  VAT: 'VAT',
  CFO: 'CFO',
  CSP: 'CSP',
  LEGAL: 'LEGAL',
  PAYROLL: 'PAYROLL',
  PROJECTS_TRANSACTIONS: 'PROJECTS_TRANSACTIONS',
  TECHNOLOGY: 'TECHNOLOGY',
  GRANTS_AND_INCENTIVES: 'GRANTS_AND_INCENTIVES',
  INCORPORATION: 'INCORPORATION',
  MBR: 'MBR',
  TAX: 'TAX',
  LIQUIDATION: 'LIQUIDATION',
  CUSTOM: 'CUSTOM',
} as const;

export type Services = typeof Services[keyof typeof Services];

export interface ServiceRequestTemplate {
  id: string;
  service: string | null;
  customServiceCycleId?: string | null;
  type: TemplateType;
  formFields: FormField[];
  version: number;
  isActive: boolean;
  createdBy: string;
  organizationId?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTemplateDto {
  service: string | null;
  customServiceCycleId?: string | null;
  type: TemplateType;
  formFields: FormField[];
  isActive?: boolean;
  organizationId?: string | null;
}

export interface UpdateTemplateDto {
  service?: string | null;
  customServiceCycleId?: string | null;
  type?: TemplateType;
  formFields?: FormField[];
  isActive?: boolean;
}

export type ServiceRequestStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface DetailEntry {
  question: string;
  answer: unknown;
  attachedFiles?: string[];
}

export interface CustomService {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateCustomServiceDto {
  title: string;
  description?: string;
}

export interface UpdateCustomServiceDto {
  title?: string;
  description?: string | null;
}

export interface ServiceRequest {
  id: string;
  companyId: string;
  clientId: string;
  service: string;
  status: ServiceRequestStatus;
  templateId: string;
  customServiceCycleId?: string | null;
  generalDetails?: DetailEntry[];
  serviceDetails?: DetailEntry[];
  statusHistory: unknown;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  submittedBy?: string;
  company?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    user?: { firstName?: string; lastName?: string };
  };
  template?: {
    id: string;
    type: string;
    customServiceCycleId?: string | null;
    formFields: FormField[];
  };
  submittedDocuments?: { id: string; file_name: string; url: string }[];
  engagements: { id: string; name: string | null }[];
  reason?: string;
}

