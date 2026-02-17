export const endPoints = {
  AUTH: {
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/auth/me',
  },
  ORGANIZATION: {
    CREATE_MEMBER: '/organization-members',
    GET_MEMBERS: '/organization-members',
    ASSIGN_SERVICES: '/organization-members',
    ASSIGN_CUSTOM_SERVICES: '/organization-members',
  },
  CUSTOM_SERVICE: {
    GET_ACTIVE: '/custom-services/active',
  },
  NOTICE: {
    GET_TODAY: '/notices/today',
  },
  ENGAGEMENTS: {
    GET_ALL: '/engagements',
    GET_BY_ID: (engagementId: string) => `/engagements/${engagementId}`,
    CHECKLISTS: (engagementId: string) => `/engagements/${engagementId}/checklists`,
    COMPLIANCES: (engagementId: string) => `/engagements/${engagementId}/compliances`,
    TEAM: (engagementId: string) => `/engagements/${engagementId}/team`,
    CHAT_ROOM: (engagementId: string) => `/engagements/${engagementId}/chat-room`,
  },
  ENGAGEMENT_UPDATES: '/engagement-updates',
  DOCUMENT_REQUESTS: '/document-requests',
  CHAT: {
    ROOMS: '/chat/rooms',
    ROOM_BY_ID: (roomId: string) => `/chat/rooms/${roomId}`,
    MESSAGES: (roomId: string) => `/chat/rooms/${roomId}/messages`,
  },
  LIBRARY: {
    FOLDERS_ROOTS: '/library/folders/roots',
    FOLDER_CONTENT: (folderId: string) => `/library/folders/${folderId}/content`,
  },
};
