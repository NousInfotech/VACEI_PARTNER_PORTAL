export const endPoints = {
  AUTH: {
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/auth/me',
    VERIFY_MFA: '/auth/verify-mfa',
    MFA_VERIFY: '/auth/mfa/verify',
    MFA_PREFERENCES: '/auth/mfa/preferences',
    MFA_SETUP_TOTP: '/auth/mfa/setup-totp',
    MFA_VERIFY_TOTP_SETUP: '/auth/mfa/verify-totp-setup',
    MFA_WEBAUTHN_REGISTER_CHALLENGE: '/auth/mfa/webauthn/register-challenge',
    MFA_WEBAUTHN_REGISTER_VERIFY: '/auth/mfa/webauthn/register-verify',
    MFA_WEBAUTHN_LOGIN_CHALLENGE: '/auth/mfa/webauthn/login-challenge',
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
  NOTIFICATION: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id: string) => `/notifications/read/${id}`,
    MARK_ALL_READ: '/notifications/read-all',
    PREFERENCES: '/notifications/preferences',
  },
  ENGAGEMENTS: {
    GET_ALL: '/engagements',
    GET_BY_ID: (engagementId: string) => `/engagements/${engagementId}`,
    UPDATE_STATUS: (engagementId: string) => `/engagements/${engagementId}/status`,
    CHECKLISTS: (id: string) => `/engagements/${id}/checklists`,
    CHECKLIST_BY_ID: (engId: string, checklistId: string) => `/engagements/${engId}/checklists/${checklistId}`,
    CHECKLIST_STATUS: (engId: string, checklistId: string) => `/engagements/${engId}/checklists/${checklistId}/status`,
    COMPLIANCES: (id: string) => `/engagements/${id}/compliances`,
    TEAM: (engagementId: string) => `/engagements/${engagementId}/team`,
    CHAT_ROOM: (engagementId: string) => `/chat/engagements/${engagementId}/room`,
    MILESTONES: (engagementId: string) => `/engagements/${engagementId}/milestones`,
    LIBRARY_FOLDER: (engagementId: string) => `/engagements/${engagementId}/library`,
    LIBRARY_FOLDER_BY_TYPE: (engagementId: string, type: string) => `/engagements/${engagementId}/library?type=${type}`,
    EVIDENCE_FOLDER: (engagementId: string) => `/engagements/${engagementId}/library/evidences`,
    WORKBOOK_FOLDER: (engagementId: string) => `/engagements/${engagementId}/library/workbooks`,
    FILINGS: (engagementId: string) => `/engagements/${engagementId}/filings`,
    FILING_STATUS: (engagementId: string, filingId: string) => `/engagements/${engagementId}/filings/${filingId}/status`,
  },
  ENGAGEMENT_UPDATES: '/engagement-updates',
  SERVICE_REQUEST: {
    GET_ALL: '/service-requests',
    GET_BY_ID: (id: string) => `/service-requests/${id}`,
    UPDATE_STATUS: (id: string) => `/service-requests/${id}/status`,
  },
  DOCUMENT_REQUESTS: '/document-requests',
  DOCUMENT_REQUEST_STATUS: (requestId: string) => `/document-requests/${requestId}/status`,
  REQUESTED_DOCUMENTS: (requestId: string) => `/document-requests/${requestId}/documents`,
  REQUESTED_DOCUMENT_BY_ID: (requestId: string, docId: string) => `/document-requests/${requestId}/documents/${docId}`,
  REQUESTED_DOCUMENT_UPLOAD: (requestId: string, docId: string) => `/document-requests/${requestId}/documents/${docId}/upload`,
  COMPLIANCE_CALENDAR: {
    BASE: '/compliance-calendar',
    GET_BY_ID: (id: string) => `/compliance-calendar/${id}`
  },
  CHAT: {
    ROOMS: '/chat/rooms',
    ROOM_BY_ID: (roomId: string) => `/chat/rooms/${roomId}`,
    MEMBERS: (roomId: string) => `/chat/rooms/${roomId}/members`,
    MEMBER_DELETE: (roomId: string, userId: string) => `/chat/rooms/${roomId}/members/${userId}`,
    MESSAGES: (roomId: string) => `/chat/rooms/${roomId}/messages`,
    CLEAR_MESSAGES: (roomId: string) => `/chat/rooms/${roomId}/messages`,
    NOTIFY_MEMBERS: (roomId: string) => `/chat/rooms/${roomId}/notify-members`,
    MARK_READ: (roomId: string) => `/chat/rooms/${roomId}/read`,
    UNREAD_COUNT: (roomId: string) => `/chat/rooms/${roomId}/unread-count`,
    UNREAD_SUMMARY: '/chat/unread-summary',
    UPLOAD: '/chat/upload',
  },
  LIBRARY: {
    FOLDERS_ROOTS: '/library/folders/roots',
    FOLDER_CONTENT: (folderId: string) => `/library/folders/${folderId}/content`,
    FOLDER_CREATE: '/library/folders',
    FILE_UPLOAD: '/library/files/upload',
    FILE_DELETE: (fileId: string) => `/library/files/${fileId}`,
    FILE_BY_ID: (id: string) => `/library/files/${id}`,
    FOLDER_DELETE: (folderId: string) => `/library/folders/${folderId}`,
    FOLDER_DOWNLOAD: (id: string) => `/library/folders/${id}/download`,
  },
  COMPANY: {
    BASE: '/companies',
    GET_BY_ID: (id: string) => `/companies/${id}`,
  },
  AUDIT: {
    CREATE_CYCLE: '/audit-cycles',
    GET_CYCLE: (id: string) => `/audit-cycles/${id}`,
    GET_CYCLES: '/audit-cycles',
    UPLOAD_TRIAL_BALANCE: (auditCycleId: string) => `/uploadapi/v1/services/audit/${auditCycleId}/trial-balance`,
    GET_TRIAL_BALANCES: (auditCycleId: string) => `/audit-cycles/${auditCycleId}/trial-balances`,
    GET_TRIAL_BALANCE_WITH_ACCOUNTS: (auditCycleId: string, trialBalanceId: string) => `/audit-cycles/${auditCycleId}/trial-balances/${trialBalanceId}/with-accounts`,
    GET_CLASSIFICATION_MAP: '/classifications/map',
    UPDATE_TRIAL_BALANCE_ACCOUNTS: (auditCycleId: string, trialBalanceId: string) => `/audit-cycles/${auditCycleId}/trial-balances/${trialBalanceId}/accounts`,
    CREATE_AUDIT_ENTRY: (auditCycleId: string, trialBalanceId: string) => `/audit-cycles/${auditCycleId}/trial-balances/${trialBalanceId}/audit-entries`,
    GET_AUDIT_ENTRIES: (auditCycleId: string, trialBalanceId: string) => `/audit-cycles/${auditCycleId}/trial-balances/${trialBalanceId}/audit-entries`,
    GET_AUDIT_ENTRY: (auditCycleId: string, trialBalanceId: string, entryId: string) => `/audit-cycles/${auditCycleId}/trial-balances/${trialBalanceId}/audit-entries/${entryId}`,
    UPDATE_AUDIT_ENTRY: (auditCycleId: string, trialBalanceId: string, entryId: string) => `/audit-cycles/${auditCycleId}/trial-balances/${trialBalanceId}/audit-entries/${entryId}`,
    DELETE_AUDIT_ENTRY: (auditCycleId: string, trialBalanceId: string, entryId: string) => `/audit-cycles/${auditCycleId}/trial-balances/${trialBalanceId}/audit-entries/${entryId}`,
    GET_INCOME_STATEMENT: (engagementId: string) => `/services/audit/engagements/${engagementId}/financial-reports/income-statement`,
    GET_BALANCE_SHEET: (engagementId: string) => `/services/audit/engagements/${engagementId}/financial-reports/balance-sheet`,
    // Evidence endpoints
    GET_EVIDENCES: '/evidences',
    GET_EVIDENCE: (evidenceId: string) => `/evidences/${evidenceId}`,
    CREATE_EVIDENCE: '/evidences',
    UPDATE_EVIDENCE: (evidenceId: string) => `/evidences/${evidenceId}`,
    DELETE_EVIDENCE: (evidenceId: string) => `/evidences/${evidenceId}`,
    // Classification endpoints
    GET_CLASSIFICATIONS: '/classifications',
    GET_CLASSIFICATION: (classificationId: string) => `/classifications/${classificationId}`,
    CREATE_CLASSIFICATION: '/classifications',
    FIND_CLASSIFICATION_BY_GROUPS: '/classifications/find-by-groups',
    /** Classification reviews (Review / Sign-off / Review History) - matches REFERENCE-PORTAL */
    GET_CLASSIFICATION_REVIEWS: (classificationId: string) => `/classifications/${classificationId}/reviews`,
    CREATE_CLASSIFICATION_REVIEW: (classificationId: string) => `/classifications/${classificationId}/reviews`,
    UPDATE_CLASSIFICATION_REVIEW: (classificationId: string, reviewId: string) =>
      `/classifications/${classificationId}/reviews/${reviewId}`,
    // Workbook endpoints
    GET_WORKBOOKS: '/workbooks',
    GET_WORKBOOK: (workbookId: string) => `/workbooks/${workbookId}`,
    CREATE_WORKBOOK: '/workbooks',
    UPDATE_WORKBOOK: (workbookId: string) => `/workbooks/${workbookId}`,
    DELETE_WORKBOOK: (workbookId: string) => `/workbooks/${workbookId}`,
    GET_WORKBOOK_SHEETS: (workbookId: string) => `/workbooks/${workbookId}/sheets`,
    GET_WORKBOOK_SHEET_DATA: (workbookId: string, sheetName?: string) =>
      sheetName
        ? `/workbooks/${workbookId}/sheets/data?sheetName=${encodeURIComponent(sheetName)}`
        : `/workbooks/${workbookId}/sheets/data`,
    // RangeEvidence endpoints (for mappings and references)
    GET_RANGE_EVIDENCES: (workbookId: string) => `/workbooks/${workbookId}/range-evidences`,
    GET_RANGE_EVIDENCE: (workbookId: string, rangeEvidenceId: string) => `/workbooks/${workbookId}/range-evidences/${rangeEvidenceId}`,
    CREATE_RANGE_EVIDENCE: (workbookId: string) => `/workbooks/${workbookId}/range-evidences`,
    UPDATE_RANGE_EVIDENCE: (workbookId: string, rangeEvidenceId: string) => `/workbooks/${workbookId}/range-evidences/${rangeEvidenceId}`,
    DELETE_RANGE_EVIDENCE: (workbookId: string, rangeEvidenceId: string) => `/workbooks/${workbookId}/range-evidences/${rangeEvidenceId}`,
    ATTACH_EVIDENCE_TO_RANGE_EVIDENCE: (workbookId: string, rangeEvidenceId: string) => `/workbooks/${workbookId}/range-evidences/${rangeEvidenceId}/attach-evidence`,
  },
  ACCOUNTING: {
    CREATE_CYCLE: '/accounting-cycles',
    GET_CYCLE: (id: string) => `/accounting-cycles/${id}`,
    UPDATE_STATUS: (id: string) => `/accounting-cycles/${id}/status`,
    UPDATE_CYCLE: (id: string) => `/accounting-cycles/${id}`,
    GET_BY_ENGAGEMENT_ID: (engagementId: string) => `/accounting-cycles/engagement/${engagementId}`,
    QUICKBOOKS_AVAILABLE: (companyId: string) =>
      `/companies/${companyId}/accounting/quickbooks/available`,
    TRANSACTIONS_BY_CYCLE: (cycleId: string) =>
      `/accounting-cycles/${cycleId}/transactions`,
    TRANSACTION_BY_ID: (cycleId: string, id: string) =>
      `/accounting-cycles/${cycleId}/transactions/${id}`,
    CREATE_TRANSACTION: (cycleId: string) =>
      `/accounting-cycles/${cycleId}/transactions`,
    UPDATE_TRANSACTION: (cycleId: string, id: string) =>
      `/accounting-cycles/${cycleId}/transactions/${id}`,
    DELETE_TRANSACTION: (cycleId: string, id: string) =>
      `/accounting-cycles/${cycleId}/transactions/${id}`,
    CHART_OF_ACCOUNTS: (companyId: string) =>
      `/companies/${companyId}/accounting/chart-of-accounts`,
    IMPORT_SYNC_ALL: (companyId: string) =>
      `/companies/${companyId}/accounting/import/sync/all`,
    MAP_INVOICE_TO_TRANSACTION: (companyId: string, qbInvoiceId: string) =>
      `/companies/${companyId}/accounting/import/invoices/${qbInvoiceId}/map-to-transaction`,
    MAP_BILL_TO_TRANSACTION: (companyId: string, qbBillId: string) =>
      `/companies/${companyId}/accounting/import/bills/${qbBillId}/map-to-transaction`,
  },
  QUICKBOOKS: {
    base: (companyId: string) => `/companies/${companyId}/accounting/quickbooks`,
    INVOICES: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/invoices`,
    CREATE_INVOICE: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/invoices`,
    INVOICE_STATS: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/invoices/stats`,
    INVOICE_PAYMENTS: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/invoices/payments`,
    INVOICE_IMPORT: (companyId: string, qbInvoiceId: string) =>
      `/companies/${companyId}/accounting/quickbooks/invoices/import/${qbInvoiceId}`,
    BILLS: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/bills`,
    CREATE_BILL: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/bills`,
    BILL_IMPORT: (companyId: string, qbBillId: string) =>
      `/companies/${companyId}/accounting/quickbooks/bills/import/${qbBillId}`,
    JOURNAL: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/journal`,
    JOURNAL_ITEMS: (companyId: string, id: string) =>
      `/companies/${companyId}/accounting/quickbooks/journal/items/${id}`,
    RECURRING_EXPENSES: (companyId: string) =>
      `/companies/${companyId}/accounting/quickbooks/recurring-expenses/user-expenses`,
    RECURRING_EXPENSES_SIMULATED: (companyId: string) =>
      `/companies/${companyId}/accounting/quickbooks/recurring-expenses/simulated`,
    REPORTS: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/reports/fetch`,
    REPORTS_DASHBOARD: (companyId: string) =>
      `/companies/${companyId}/accounting/quickbooks/reports/financial-dashboard-summary`,
    AGING: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/aging/user-ar-ap`,
    AGING_SYNCED: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/aging/synced`,
    ACCOUNTS: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/accounts`,
    BANK_ACCOUNTS: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/accounts/bank`,
    SYNC_HISTORY: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/sync-history`,
    TAX_ENTITY: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/tax-entity`,
    QB_TRANSACTIONS: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/transactions`,
    SEARCH: (companyId: string) => `/companies/${companyId}/accounting/quickbooks/search`,
    SYNC_CHART_ACCOUNTS: (companyId: string) =>
      `/companies/${companyId}/accounting/quickbooks/sync/chart-accounts`,
    SYNC_COMPANY_DATA: (companyId: string) =>
      `/companies/${companyId}/accounting/quickbooks/sync/company-data`,
  },
  INCORPORATION: {
    GET_BY_COMPANY: (companyId: string) => `/incorporation/company/${companyId}`,
  },
  TODO: {
    BASE: '/todos',
    BY_ENGAGEMENT: (engagementId: string) => `/engagements/${engagementId}/todos`,
    BY_ID: (todoId: string) => `/todos/${todoId}`,
    UPDATE_STATUS: (todoId: string) => `/todos/${todoId}/status`,
    FROM_CHAT: (engagementId: string) => `/engagements/${engagementId}/todos/from-chat`,
    FROM_DOCUMENT_REQUEST: (engagementId: string) => `/engagements/${engagementId}/todos/from-document-request`,
    FROM_REQUESTED_DOCUMENT: (engagementId: string) => `/engagements/${engagementId}/todos/from-requested-document`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ: (id: string) => `/notifications/read/${id}`,
    READ_ALL: '/notifications/read-all',
  },
  PROCEDURE_PROMPT: {
    BASE: '/procedure-prompts',
    GET_ALL: '/procedure-prompts',
    GET_BY_ID: (id: string) => `/procedure-prompts/${id}`,
    CREATE: '/procedure-prompts',
    UPDATE: (id: string) => `/procedure-prompts/${id}`,
    DELETE: (id: string) => `/procedure-prompts/${id}`,
  },
  CSP: {
    BASE: '/csp-cycles',
    CREATE: '/csp-cycles',
    GET_ALL: '/csp-cycles',
    BY_ID: (id: string) => `/csp-cycles/${id}`,
    UPDATE_STATUS: (id: string) => `/csp-cycles/${id}/status`,
    UPDATE: (id: string) => `/csp-cycles/${id}`,
    DELETE: (id: string) => `/csp-cycles/${id}`,
  },
  VAT: {
    BASE: '/vat-cycles',
    CREATE: '/vat-cycles',
    GET_ALL: '/vat-cycles',
    BY_ID: (id: string) => `/vat-cycles/${id}`,
    UPDATE_STATUS: (id: string) => `/vat-cycles/${id}/status`,
    UPDATE: (id: string) => `/vat-cycles/${id}`,
    DELETE: (id: string) => `/vat-cycles/${id}`,
  },
  TAX: {
    BASE: '/tax-cycles',
    CREATE: '/tax-cycles',
    GET_ALL: '/tax-cycles',
    BY_ID: (id: string) => `/tax-cycles/${id}`,
    UPDATE_STATUS: (id: string) => `/tax-cycles/${id}/status`,
    UPDATE: (id: string) => `/tax-cycles/${id}`,
    DELETE: (id: string) => `/tax-cycles/${id}`,
  },
  MBR: {
    BASE: '/mbr-cycles',
    CREATE: '/mbr-cycles',
    GET_ALL: '/mbr-cycles',
    BY_ID: (id: string) => `/mbr-cycles/${id}`,
    UPDATE_STATUS: (id: string) => `/mbr-cycles/${id}/status`,
    UPDATE: (id: string) => `/mbr-cycles/${id}`,
    DELETE: (id: string) => `/mbr-cycles/${id}`,
  },
  PAYROLL: {
    BASE: '/payroll-cycles',
    CREATE: '/payroll-cycles',
    GET_ALL: '/payroll-cycles',
    BY_ID: (id: string) => `/payroll-cycles/${id}`,
    UPDATE_STATUS: (id: string) => `/payroll-cycles/${id}/status`,
    UPDATE: (id: string) => `/payroll-cycles/${id}`,
    DELETE: (id: string) => `/payroll-cycles/${id}`,
    EMPLOYEES: (payrollCycleId: string) => `/payroll-cycles/${payrollCycleId}/employees`,
    EMPLOYEE_BY_ID: (payrollCycleId: string, employeeId: string) => `/payroll-cycles/${payrollCycleId}/employees/${employeeId}`,
  },
  CFO: {
    BASE: '/cfo-cycles',
    CREATE: '/cfo-cycles',
    GET_ALL: '/cfo-cycles',
    BY_ID: (id: string) => `/cfo-cycles/${id}`,
    UPDATE_STATUS: (id: string) => `/cfo-cycles/${id}/status`,
    UPDATE: (id: string) => `/cfo-cycles/${id}`,
    DELETE: (id: string) => `/cfo-cycles/${id}`,
  },

  // Audit procedures (planning, fieldwork, completion)
  PROCEDURES: {
    BASE: '/procedures',
    GET_ALL: '/procedures',
    GET_BY_ID: (id: string) => `/procedures/${id}`,
    CREATE: '/procedures',
    UPDATE: (id: string) => `/procedures/${id}`,
    DELETE: (id: string) => `/procedures/${id}`,
    GENERATE: '/procedures/generate-procedures-and-categories',
    /** Regenerate questions for existing procedure category (POST, no body). */
    GENERATE_QUESTIONS: (procedureId: string, categoryId: string) =>
      `/procedures/${procedureId}/categories/${categoryId}/generate-questions`,
    /** Fieldwork: generate answers for classification questions (body: { engagementId?, questions }) */
    CLASSIFICATION_ANSWERS: '/procedures/ai/classification-answers',
    GENERATE_RECOMMENDATIONS: (procedureId: string) => `/procedures/${procedureId}/generate-recommendations`,
    /** Save/upsert procedure for engagement (POST body: procedure payload) */
    SAVE: '/procedures',
    /** Save fieldwork document (questions, recommendations) to Procedure.documentPayload. Body: { auditCycleId, questions, recommendations, ... } */
    FIELDWORK_SAVE: '/procedures/fieldwork/save',
  },
  REVIEW: {
    WORKFLOWS_BY_ENGAGEMENT: (engagementId: string) => `/review/workflows/engagement/${engagementId}`,
    UPDATE_WORKFLOW: (workflowId: string) => `/review/workflows/${workflowId}`,
    DELETE_WORKFLOW: (workflowId: string) => `/review/workflows/${workflowId}`,
  },
  /** Planning procedures (section-based procedures + recommendations) */
  PLANNING_PROCEDURES: {
    GET_BY_ENGAGEMENT: (engagementId: string) => `/planning-procedures/${engagementId}`,
    SAVE: (engagementId: string) => `/planning-procedures/${engagementId}/save`,
    GENERATE_SECTION_QUESTIONS: (engagementId: string) =>
      `/planning-procedures/${engagementId}/generate/section-questions`,
    GENERATE_SECTION_ANSWERS: (engagementId: string) =>
      `/planning-procedures/${engagementId}/generate/section-answers`,
    GENERATE_RECOMMENDATIONS: (engagementId: string) =>
      `/planning-procedures/${engagementId}/generate/recommendations`,
  },
  /** Completion procedures */
  COMPLETION_PROCEDURES: {
    GET_BY_ENGAGEMENT: (engagementId: string) => `/completion-procedures/${engagementId}`,
    SAVE: (engagementId: string) => `/completion-procedures/${engagementId}/save`,
    GENERATE_SECTION_QUESTIONS: (engagementId: string) =>
      `/completion-procedures/${engagementId}/generate/section-questions`,
    GENERATE_SECTION_ANSWERS: (engagementId: string) =>
      `/completion-procedures/${engagementId}/generate/section-answers`,
    GENERATE_RECOMMENDATIONS: (engagementId: string) =>
      `/completion-procedures/${engagementId}/generate/recommendations`,
  },
  TEMPLATE: {
    BASE: '/templates',
    GET_ALL: '/templates',
    GET_BY_ID: (id: string) => `/templates/${id}`,
    CREATE: '/templates',
    UPDATE: (id: string) => `/templates/${id}`,
    DELETE: (id: string) => `/templates/${id}`,
    HARD_DELETE: (id: string) => `/templates/${id}/hard`,
    UPLOAD_FOLDER: '/templates/upload-folder',
  },
};
