import { apiGet, apiPost, apiPatch, apiDelete } from '../config/base';
import { endPoints } from '../config/endPoint';

export const TodoListType = {
  DOCUMENT_REQUEST: 'DOCUMENT_REQUEST',
  CHAT: 'CHAT',
  REQUESTED_DOCUMENT: 'REQUESTED_DOCUMENT',
  CUSTOM: 'CUSTOM',
} as const;
export type TodoListType = (typeof TodoListType)[keyof typeof TodoListType];

export const TodoListStatus = {
  ACTION_REQUIRED: 'ACTION_REQUIRED',
  ACTION_TAKEN: 'ACTION_TAKEN',
  COMPLETED: 'COMPLETED',
} as const;
export type TodoListStatus = (typeof TodoListStatus)[keyof typeof TodoListStatus];

export const TodoListActorRole = {
  SYSTEM: 'SYSTEM',
  ORG_MEMBER: 'ORG_MEMBER',
  PLATFORM_MEMBER: 'PLATFORM_MEMBER',
} as const;
export type TodoListActorRole = (typeof TodoListActorRole)[keyof typeof TodoListActorRole];

export interface Todo {
  id: string;
  engagementId: string | null;
  companyId: string;
  service: string;
  type: TodoListType;
  moduleId: string | null;
  customServiceCycleId: string | null;
  title: string;
  description: string | null;
  customerComment: string | null;
  deadline: string | null;
  status: TodoListStatus;
  statusHistory: any;
  createdById: string | null;
  role: TodoListActorRole;
  cta: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; user?: { id: string; firstName: string; lastName: string } };
}

export interface CreateTodoDto {
  title: string;
  description?: string | null;
  deadline?: string | null;
  service: string;
  type?: TodoListType;
  moduleId?: string | null;
  customServiceCycleId?: string | null;
  customerComment?: string | null;
  cta?: string;
  role?: TodoListActorRole;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  type?: TodoListType;
  moduleId?: string | null;
  customServiceCycleId?: string | null;
  customerComment?: string | null;
  cta?: string;
  reason?: string;
}

export const todoService = {
  list: (engagementId: string) => 
    apiGet<{ data: Todo[] }>(endPoints.TODO.BY_ENGAGEMENT(engagementId)).then(res => res.data),
  
  getById: (id: string) => 
    apiGet<{ data: Todo }>(endPoints.TODO.BY_ID(id)).then(res => res.data),
  
  create: (engagementId: string, data: CreateTodoDto) => 
    apiPost<{ data: Todo }>(endPoints.TODO.BY_ENGAGEMENT(engagementId), data).then(res => res.data),
  
  createFromChat: (engagementId: string, messageId: string, data: CreateTodoDto) => 
    apiPost<{ data: Todo }>(`${endPoints.TODO.FROM_CHAT(engagementId)}?messageId=${messageId}`, data).then(res => res.data),
  
  createFromDocumentRequest: (engagementId: string, docReqId: string, data: CreateTodoDto) => 
    apiPost<{ data: Todo }>(`${endPoints.TODO.FROM_DOCUMENT_REQUEST(engagementId)}?documentRequestId=${docReqId}`, data).then(res => res.data),
  
  createFromRequestedDocument: (engagementId: string, reqDocId: string, data: CreateTodoDto) => 
    apiPost<{ data: Todo }>(`${endPoints.TODO.FROM_REQUESTED_DOCUMENT(engagementId)}?requestedDocumentId=${reqDocId}`, data).then(res => res.data),
  
  update: (id: string, data: UpdateTodoDto) => 
    apiPatch<{ data: Todo }>(endPoints.TODO.BY_ID(id), data).then(res => res.data),
  
  updateStatus: (id: string, status: TodoListStatus, reason?: string) => 
    apiPatch<{ data: Todo }>(endPoints.TODO.UPDATE_STATUS(id), { status, reason }).then(res => res.data),
  
  delete: (id: string) => 
    apiDelete<{ data: any }>(endPoints.TODO.BY_ID(id)).then(res => res.data),
};
