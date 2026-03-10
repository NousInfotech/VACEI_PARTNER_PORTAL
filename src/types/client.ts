export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

export interface Client {
  id: string;
  userId: string;
  user: User;
  preferences: Record<string, unknown>;
  isActive: boolean;
  onboardings?: Array<{
    organizationId: string;
    type: string;
    isActive: boolean;
  }>;
  companies?: Array<{
    id: string;
    name: string;
    incorporationStatus: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ClientResponse {
  data: Client[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
