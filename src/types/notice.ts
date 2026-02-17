export interface Notice {
  id: string;
  title: string;
  description: string;
  targetRoles: string[];
  type: string;
  status: string;
  scheduledAt: string;
  createdAt: string;
}
