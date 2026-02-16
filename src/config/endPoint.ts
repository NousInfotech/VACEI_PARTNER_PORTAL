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
};
