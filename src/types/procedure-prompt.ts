export const ProcedurePromptScope = {
  GLOBAL: 'GLOBAL',
  ORGANIZATIONAL: 'ORGANIZATIONAL',
} as const;
export type ProcedurePromptScope = typeof ProcedurePromptScope[keyof typeof ProcedurePromptScope];

export const ProcedurePromptCategory = {
  QUESTIONS: 'QUESTIONS',
  ANSWERS: 'ANSWERS',
  RECOMMENDATIONS: 'RECOMMENDATIONS',
} as const;
export type ProcedurePromptCategory = typeof ProcedurePromptCategory[keyof typeof ProcedurePromptCategory];

export const ProcedureType = {
  PLANNING: 'PLANNING',
  FIELDWORK: 'FIELDWORK',
  COMPLETION: 'COMPLETION',
} as const;
export type ProcedureType = typeof ProcedureType[keyof typeof ProcedureType];

export interface ProcedurePrompt {
  id: string;
  scopeType: ProcedurePromptScope;
  title: string;
  description: string | null;
  prompt: string;
  procedureType: ProcedureType;
  category: ProcedurePromptCategory;
  organizationId: string | null;
  organization?: { id: string; name: string } | null;
}

export interface CreateProcedurePromptData {
  scopeType: ProcedurePromptScope;
  title: string;
  description?: string | null;
  prompt: string;
  procedureType: ProcedureType;
  category: ProcedurePromptCategory;
  organizationId?: string | null;
}

export interface UpdateProcedurePromptData {
  title?: string;
  description?: string | null;
  prompt?: string;
  procedureType?: ProcedureType;
  category?: ProcedurePromptCategory;
}

export interface ProcedurePromptListResponse {
  data: ProcedurePrompt[];
  total: number;
  page: number;
  limit: number;
}
