export interface Engagement {
  id: string;
  companyId: string;
  companyName: string;
  organizationId: string;
  organizationName: string;
  // Backend returns both a service category/type and a display name
  serviceCategory?: string;
  serviceType?: string;
  name?: string;
  status: string;
  serviceRequestId?: string;
  createdAt: string;
  updatedAt: string;
}
