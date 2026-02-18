export interface TemplateInfo {
  url?: string;
  instruction?: string;
}

export interface RequestedDocumentItem {
  id: string;
  documentRequestId: string;
  parentId: string | null;
  documentName: string;
  count: 'SINGLE' | 'MULTIPLE';
  type: 'DIRECT' | 'TEMPLATE';
  isMandatory: boolean;
  status: 'PENDING' | 'UPLOADED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  description?: string;
  template?: TemplateInfo;
  file?: { id: string; file_name: string; url: string } | null;
  templateFile?: { id: string; file_name: string; url: string } | null;
  children?: RequestedDocumentItem[];
}

export interface DocumentRequestItem {
  id: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  deadline: string | null;
  createdAt: string;
  requestedDocuments: RequestedDocumentItem[];
}

export interface FormDataMultipleItem {
  label: string;
  instruction: string;
  isMandatory?: boolean;
  templateFile: File | null;
  templateUrl?: string;
  templateInstructions: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
