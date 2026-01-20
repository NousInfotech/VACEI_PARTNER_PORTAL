export const RoleEnum = {
  ORG_ADMIN: 'ORG_ADMIN',
  ORG_EMPLOYEE: 'ORG_EMPLOYEE',
} as const;

export type RoleEnum = typeof RoleEnum[keyof typeof RoleEnum];

export const users = [
  {
    id: '1',
    firstName: 'Kannan',
    lastName: 'Admin',
    email: 'kannan.admin@gmail.com',
    password: 'admin1234',
    role: RoleEnum.ORG_ADMIN,
    status: 'active',
  },
  {
    id: '2',
    firstName: 'Kannan',
    lastName: 'Employee',
    email: 'kannan.employee@gmail.com',
    password: 'employee1234',
    role: RoleEnum.ORG_EMPLOYEE,
    status: 'active',
  },
]
