// src/lib/api/workbookApi.ts

import { apiGet, apiPost, apiPut, apiDelete } from "../../config/base";
import { endPoints } from "../../config/endPoint";

// TypeScript interfaces for Workbook API
export interface Workbook {
  id: string;
  engagementId: string;
  classification?: string | null;
  cloudFileId: string;
  name: string;
  webUrl?: string | null;
  uploadedBy: string;
  uploadedDate: string;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string;
  category?: string | null;
  customFields?: Record<string, unknown>;
}

export interface SheetData {
  [sheetName: string]: string[][];
}

export interface MappingCoordinates {
  row: number;
  col: number;
}

export interface MappingReferenceFile {
  fileName: string;
  fileUrl: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface EvidenceFile {
  id: string;
  fileId: string;
  file: {
    id: string;
    file_name: string;
    url: string;
    file_type?: string | null;
    file_size?: number | null;
  };
}

export interface RangeEvidence {
  id: string;
  workbookId: string;
  type: 'mapping' | 'reference';
  color?: string | null;
  sheet: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  evidences?: Array<{
    evidence: EvidenceFile;
  }>;
}

export interface CreateRangeEvidenceRequest {
  type: 'mapping' | 'reference';
  color?: string | null;
  sheet: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  notes?: string | null;
}

export interface UpdateRangeEvidenceRequest {
  type?: 'mapping' | 'reference';
  color?: string | null;
  sheet?: string;
  startRow?: number;
  startCol?: number;
  endRow?: number;
  endCol?: number;
  notes?: string | null;
}

export interface SheetDataResponse {
  sheetNames: string[];
  sheetData: SheetData;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

// ========================================
// Workbook API Functions
// ========================================

/**
 * Fetches sheet data for a workbook by parsing the Excel file
 */
export const fetchSheetData = async (
  workbookId: string,
  sheetName?: string
): Promise<SheetDataResponse> => {
  try {
    const url = endPoints.AUDIT.GET_WORKBOOK_SHEET_DATA(workbookId, sheetName);
    const response = await apiGet<ApiResponse<SheetDataResponse>>(url);
    return response.data || response;
  } catch (error: any) {
    console.error(`Error fetching sheet data for workbook ${workbookId}:`, error);
    throw error;
  }
};

/**
 * Fetches a workbook by ID
 */
export const getWorkbook = async (workbookId: string): Promise<Workbook> => {
  try {
    const response = await apiGet<ApiResponse<Workbook>>(endPoints.AUDIT.GET_WORKBOOK(workbookId));
    return response.data || response;
  } catch (error: any) {
    console.error(`Error fetching workbook ${workbookId}:`, error);
    throw error;
  }
};

/**
 * Fetches all range evidences (mappings and references) for a workbook
 */
export const getRangeEvidences = async (
  workbookId: string
): Promise<RangeEvidence[]> => {
  try {
    const response = await apiGet<ApiResponse<RangeEvidence[]>>(
      endPoints.AUDIT.GET_RANGE_EVIDENCES(workbookId)
    );
    return response.data || [];
  } catch (error: any) {
    console.error(`Error fetching range evidences for workbook ${workbookId}:`, error);
    throw error;
  }
};

/**
 * Creates a new range evidence (mapping or reference)
 */
export const createRangeEvidence = async (
  workbookId: string,
  data: CreateRangeEvidenceRequest
): Promise<RangeEvidence> => {
  try {
    const response = await apiPost<ApiResponse<RangeEvidence>>(
      endPoints.AUDIT.CREATE_RANGE_EVIDENCE(workbookId),
      data
    );
    return response.data || response;
  } catch (error: any) {
    console.error(`Error creating range evidence for workbook ${workbookId}:`, error);
    throw error;
  }
};

/**
 * Updates an existing range evidence
 */
export const updateRangeEvidence = async (
  workbookId: string,
  rangeEvidenceId: string,
  data: UpdateRangeEvidenceRequest
): Promise<RangeEvidence> => {
  try {
    const response = await apiPut<ApiResponse<RangeEvidence>>(
      endPoints.AUDIT.UPDATE_RANGE_EVIDENCE(workbookId, rangeEvidenceId),
      data
    );
    return response.data || response;
  } catch (error: any) {
    console.error(
      `Error updating range evidence ${rangeEvidenceId} for workbook ${workbookId}:`,
      error
    );
    throw error;
  }
};

/**
 * Deletes a range evidence
 */
export const deleteRangeEvidence = async (
  workbookId: string,
  rangeEvidenceId: string
): Promise<void> => {
  try {
    await apiDelete(endPoints.AUDIT.DELETE_RANGE_EVIDENCE(workbookId, rangeEvidenceId));
  } catch (error: any) {
    console.error(
      `Error deleting range evidence ${rangeEvidenceId} from workbook ${workbookId}:`,
      error
    );
    throw error;
  }
};

/**
 * Gets all mappings (range evidences with type='mapping') for a workbook
 */
export const getMappings = async (workbookId: string): Promise<RangeEvidence[]> => {
  try {
    const allEvidences = await getRangeEvidences(workbookId);
    return allEvidences.filter((evidence) => evidence.type === 'mapping');
  } catch (error: any) {
    console.error(`Error fetching mappings for workbook ${workbookId}:`, error);
    throw error;
  }
};

/**
 * Gets all references (range evidences with type='reference') for a workbook
 */
export const getReferences = async (workbookId: string): Promise<RangeEvidence[]> => {
  try {
    const allEvidences = await getRangeEvidences(workbookId);
    return allEvidences.filter((evidence) => evidence.type === 'reference');
  } catch (error: any) {
    console.error(`Error fetching references for workbook ${workbookId}:`, error);
    throw error;
  }
};

/**
 * Converts RangeEvidence to Mapping format (for compatibility with ExcelViewer)
 */
export const rangeEvidenceToMapping = (evidence: RangeEvidence) => {
  return {
    _id: evidence.id,
    workbookId: {
      id: evidence.workbookId,
      _id: evidence.workbookId,
    },
    color: evidence.color || '#FFEB3B',
    details: {
      sheet: evidence.sheet,
      start: {
        row: evidence.startRow,
        col: evidence.startCol,
      },
      end: {
        row: evidence.endRow,
        col: evidence.endCol,
      },
    },
    isActive: true, // RangeEvidence doesn't have isActive, default to true
    notes: evidence.notes || undefined,
  };
};

/**
 * Converts Mapping format to CreateRangeEvidenceRequest
 */
export const mappingToRangeEvidenceRequest = (
  mapping: {
    color?: string;
    details: {
      sheet: string;
      start: MappingCoordinates;
      end: MappingCoordinates;
    };
    notes?: string;
  },
  type: 'mapping' | 'reference' = 'mapping'
): CreateRangeEvidenceRequest => {
  return {
    type,
    color: mapping.color || '#FFEB3B',
    sheet: mapping.details.sheet,
    startRow: mapping.details.start.row,
    startCol: mapping.details.start.col,
    endRow: mapping.details.end.row,
    endCol: mapping.details.end.col,
    notes: mapping.notes || null,
  };
};

