// Types for Excel Viewer - adapted from REFERENCE-PORTAL

export interface MappingCoordinates {
  row: number;
  col: number;
}

export interface Workbook {
  id: string;
  _id?: string; // MongoDB format
  cloudFileId: string;
  name: string;
  webUrl?: string;
  uploadedDate: string;
  version?: string;
  lastModified?: string;
  lastModifiedBy?: string;
  previousVersion?: string;
  fileData?: any;
  referenceFiles?: ReferenceFile[];
}

export interface SheetData {
  [sheetName: string]: string[][];
}

export interface Selection {
  sheet: string;
  start: { row: number; col: number };
  end: { row: number; col: number };
}

export interface MappingReferenceFile {
  fileName: string;
  fileUrl: string;
  uploadedAt?: string;
  uploadedBy?: string | { name: string; email?: string };
}

export interface Mapping {
  _id: string;
  destinationField?: string;
  transform?: string;
  color: string;
  details: {
    sheet: string;
    start: MappingCoordinates;
    end: MappingCoordinates;
  };
  referenceFiles?: MappingReferenceFile[];
  notes?: string;
  workbookId?: string | { id: string; name: string };
}

export interface NamedRange {
  _id: string;
  name: string;
  range: string;
}

export interface ReferenceFile {
  _id: string;
  details: {
    sheet: string;
    start: MappingCoordinates;
    end?: MappingCoordinates;
  };
  evidence?: ClassificationEvidence[];
  notes?: string;
}

export interface ClassificationEvidence {
  _id: string;
  engagementId: string;
  classificationId: string;
  evidenceUrl: string;
  uploadedBy?: {
    userId: string;
    name: string;
    email: string;
  };
  linkedWorkbooks?: any[];
  mappings?: any[];
  evidenceComments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface ETBData {
  rows: ETBRow[];
}

export interface ETBRow {
  code: string;
  accountName: string;
  currentYear: number;
  priorYear: number;
  adjustments: number;
  finalBalance: number;
  mappings?: Mapping[];
}

export interface CreateMappingRequest {
  destinationField: string;
  transform?: string;
  color: string;
  details: {
    sheet: string;
    start: MappingCoordinates;
    end: MappingCoordinates;
  };
  referenceFiles?: MappingReferenceFile[];
  notes?: string;
}

export interface UpdateMappingRequest {
  destinationField?: string;
  transform?: string;
  color?: string;
  details?: {
    sheet?: string;
    start?: MappingCoordinates;
    end?: MappingCoordinates;
  };
  referenceFiles?: MappingReferenceFile[];
  notes?: string;
}

