export type ShareClass = 'CLASS_A' | 'CLASS_B' | 'CLASS_C' | 'ORDINARY' | 'A' | 'B' | 'C' | string;
export type RepresentationRole = 'DIRECTOR' | 'SHAREHOLDER' | 'LEGAL_REPRESENTATIVE' | 'SECRETARY';
export type IncorporationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
export type KYCStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface CompanyShareClass {
  id: string;
  class: ShareClass;
  issued: number;
}

export interface CompanyInvolvement {
  id: string;
  partyType?: 'PERSON' | 'COMPANY';
  role: RepresentationRole[];
  classA: number;
  classB: number;
  classC: number;
  ordinary: number;
  person?: {
    id: string;
    name: string;
    address: string;
    nationality: string;
  } | null;
  holderCompany?: {
    id: string;
    name: string;
    address: string;
    registrationNumber: string;
  } | null;
}

export interface Company {
  id: string;
  name: string;
  registrationNumber: string | null;
  address: string | null;
  companyType: string | null;
  legalType: string | null;
  summary: string | null;
  industry: string[];
  authorizedShares: number;
  issuedShares: number;
  incorporationStatus: boolean;
  kycStatus: boolean;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  shareClasses?: CompanyShareClass[];
  involvements?: CompanyInvolvement[];
}

export interface IncorporationCycle {
  id: string;
  companyId: string;
  status: IncorporationStatus;
  startedAt: string;
  completedAt: string | null;
  documentRequests?: any[];
}

export interface KycCycle {
  id: string;
  companyId: string;
  status: KYCStatus;
  startedAt: string;
  verifiedAt: string | null;
}
