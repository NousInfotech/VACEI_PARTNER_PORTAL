export interface DocumentFile {
  id: string;
  file_name: string;
  url: string;
}

export interface RequestedDocument {
  id: string;
  title: string;
  documentName?: string;
  description?: string;
  address?: string | null;
  type: 'DIRECT' | 'TEMPLATE';
  count: 'SINGLE' | 'MULTIPLE';
  status: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  file?: DocumentFile;
  templateFile?: DocumentFile;
  children?: RequestedDocument[];
  parentId?: string;
}

export interface BackendDocumentRequest {
  id: string;
  title: string;
  description?: string;
  status: string;
  requestedDocuments: RequestedDocument[];
  unassignedFiles?: any[];
}

export interface Involvement {
  id: string;
  partyType: 'PERSON' | 'COMPANY';
  role?: string[];
  person?: {
    id: string;
    name: string;
    address: string | null;
  };
  holderCompany?: {
    id: string;
    name: string;
    address: string | null;
  };
}

export interface InvolvementKyc {
  id: string;
  involvementId: string;
  kycId: string;
  status: string;
  documentRequest: BackendDocumentRequest;
  involvement: Involvement;
}

export interface KycBackendResponse {
  id: string;
  companyId: string;
  status: string;
  startedAt: string;
  verifiedAt?: string | null;
  company: { id: string; name: string; address: string | null };
  documentRequest?: BackendDocumentRequest;
  involvementKycs: InvolvementKyc[];
}

// Frontend compatible types (adapted from existing ones)
export interface DocumentRequestDocumentSingle {
  _id?: string;
  name: string;
  description?: string;
  status?: string;
  rejectionReason?: string;
  url?: string;
  uploadedAt?: string;
  uploadedFileName?: string;
  type?: string | { type: string };
  template?: {
    url: string;
  };
}

export interface MultipleDocumentItem {
  _id?: string;
  label: string;
  status?: string;
  rejectionReason?: string;
  url?: string;
  uploadedAt?: string;
  uploadedFileName?: string;
  template?: {
    url?: string;
    instruction?: string;
  };
}

export interface DocumentRequestDocumentMultiple {
  _id: string;
  name: string;
  instruction?: string;
  type?: string | { type: string };
  multiple: MultipleDocumentItem[];
}

export interface KycPerson {
  _id: string;
  name: string;
  nationality?: string;
  address?: string;
  id?: string;
}

export interface UnassignedFile {
  fileId: string;
  fileName: string;
  uploadDate: string;
  url: string;
}

export interface DocumentRequest {
  _id: string;
  category: string;
  entityName?: string;
  address: string | null;
  status: string;
  documents: DocumentRequestDocumentSingle[];
  multipleDocuments: DocumentRequestDocumentMultiple[];
  unassignedFiles?: UnassignedFile[];
}

export interface KycRequestFull {
  _id: string;
  documentRequest: DocumentRequest;
  person?: KycPerson;
}

export interface KycWorkflow {
  _id: string;
  companyId: string;
  workflowType: 'Shareholder' | 'Representative' | 'Company';
  documentRequests: KycRequestFull[];
  status: string;
}

