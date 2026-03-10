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

export type TemplateType = 'GENERAL' | 'SERVICE';

export interface ServiceRequest {
  id: string;
  companyId: string;
  clientId: string;
  service: string;
  status: string;
  templateId: string;
  customServiceCycleId?: string | null;
  createdAt: string;
  updatedAt: string;
}
