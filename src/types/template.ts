// ---- Enums (mirror backend Prisma enums) ----

export type TemplateType = 'DOCUMENT_REQUEST' | 'MILESTONES' | 'CHECKLIST';

export type TemplateModuleType = 'ENGAGEMENT' | 'KYC' | 'INCORPORATION';

export type TemplateScope = 'GLOBAL' | 'LOCAL';

export type Services =
  | 'ACCOUNTING'
  | 'AUDITING'
  | 'VAT'
  | 'CFO'
  | 'CSP'
  | 'LEGAL'
  | 'PAYROLL'
  | 'PROJECTS_TRANSACTIONS'
  | 'TECHNOLOGY'
  | 'GRANTS_AND_INCENTIVES'
  | 'INCORPORATION'
  | 'LIQUIDATION'
  | 'MBR'
  | 'TAX'
  | 'CUSTOM';

export const SERVICES_LABELS: Record<Services, string> = {
  ACCOUNTING: 'Accounting',
  AUDITING: 'Auditing',
  VAT: 'VAT',
  CFO: 'CFO',
  CSP: 'CSP',
  LEGAL: 'Legal',
  PAYROLL: 'Payroll',
  PROJECTS_TRANSACTIONS: 'Projects & Transactions',
  TECHNOLOGY: 'Technology',
  GRANTS_AND_INCENTIVES: 'Grants & Incentives',
  INCORPORATION: 'Incorporation',
  LIQUIDATION: 'Liquidation',
  MBR: 'MBR',
  TAX: 'Tax',
  CUSTOM: 'Custom',
};

export const ALL_SERVICES: Services[] = [
  'ACCOUNTING', 'AUDITING', 'VAT', 'CFO', 'CSP', 'LEGAL', 'PAYROLL',
  'PROJECTS_TRANSACTIONS', 'TECHNOLOGY', 'GRANTS_AND_INCENTIVES',
  'INCORPORATION', 'LIQUIDATION', 'MBR', 'TAX', 'CUSTOM',
];

// ---- Content shapes (must match backend domain schemas) ----

// MILESTONES content: single object (backend wraps per item)
export interface MilestoneContentItem {
  title: string;
  description?: string | null;
}

// CHECKLIST content: flat list with parentId / level
export interface ChecklistContentItem {
  id: string;
  title: string;
  parentId: string | null;
  level: 1 | 2 | 3;
}

export interface ChecklistContent {
  items: ChecklistContentItem[];
}

// DOCUMENT_REQUEST content
export type RequestedDocumentType = 'DIRECT' | 'TEMPLATE';
export type RequestedDocumentCount = 'SINGLE' | 'MULTIPLE';

export interface DocumentItem {
  documentName: string;
  type: RequestedDocumentType;
  count: RequestedDocumentCount;
  isMandatory: boolean;
  templateFileId?: string | null;
  description?: string;
  templateInstructions?: string | null;
  multipleItems?: { label: string; instruction?: string | null; templateFileId?: string | null }[];
}

export interface DocumentRequestContent {
  title: string;
  description?: string | null;
  documents: DocumentItem[];
}

// ---- Full Template response ----

export interface Template {
  id: string;
  name: string;
  description: string | null;
  type: TemplateType;
  content: unknown;
  organizationId: string | null;
  moduleType: TemplateModuleType;
  serviceCategory: Services | null;
  customServiceCycleId: string | null;
  scope?: TemplateScope;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TemplateListResponse {
  success: boolean;
  data: Template[];
  message: string;
  meta: TemplateMeta;
}

export interface TemplateApiResponse {
  success: boolean;
  data: Template;
  message: string;
}

// ---- Create / Update DTOs ----

export interface CreateTemplateDto {
  name?: string;
  description?: string | null;
  type: TemplateType;
  content?: unknown;
  moduleType: TemplateModuleType;
  serviceCategory?: Services | null;
  customServiceCycleId?: string | null;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string | null;
  type?: TemplateType;
  content?: unknown;
}

// ---- UI helper: flat-tree for checklist builder ----
export interface ChecklistUINode {
  id: string;
  title: string;
  children: ChecklistUINode[];
}
