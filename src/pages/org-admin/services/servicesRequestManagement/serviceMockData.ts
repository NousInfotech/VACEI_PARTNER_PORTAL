import type { ServiceRequest } from '../../../../types/service-request-template';

export const mockRequests: ServiceRequest[] = [
  {
    id: 'req_1',
    companyId: 'company_1',
    clientId: 'client_1',
    templateId: 'template_1',
    service: 'ACCOUNTING',
    status: 'SUBMITTED',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
    engagements: [],
    clientName: 'TechCorp Solutions',
    submittedBy: 'John Doe',
    statusHistory: [],
    company: { id: 'company_1', name: 'TechCorp Solutions' }
  },
  {
    id: 'req_2',
    companyId: 'company_2',
    clientId: 'client_2',
    templateId: 'template_2',
    service: 'VAT',
    status: 'SUBMITTED',
    createdAt: '2026-01-22T14:30:00Z',
    updatedAt: '2026-01-22T14:30:00Z',
    engagements: [],
    clientName: 'Global Logistics',
    submittedBy: 'Sarah Smith',
    statusHistory: [],
    company: { id: 'company_2', name: 'Global Logistics' }
  },
  {
    id: 'req_3',
    companyId: 'company_3',
    clientId: 'client_3',
    templateId: 'template_3',
    service: 'LEGAL',
    status: 'APPROVED',
    createdAt: '2026-01-18T09:15:00Z',
    updatedAt: '2026-01-18T09:15:00Z',
    engagements: [],
    clientName: 'Apex Innovations',
    submittedBy: 'Mike Johnson',
    statusHistory: [],
    company: { id: 'company_3', name: 'Apex Innovations' }
  },
  {
    id: 'req_4',
    companyId: 'company_4',
    clientId: 'client_4',
    templateId: 'template_4',
    engagements: [],
    service: 'PAYROLL',
    status: 'REJECTED',
    createdAt: '2026-01-25T11:45:00Z',
    updatedAt: '2026-01-25T11:45:00Z',
    clientName: 'Oceanic Ventures',
    submittedBy: 'Emma Wilson',
    statusHistory: [],
    company: { id: 'company_4', name: 'Oceanic Ventures' }
  }
];

export const mockQuestions = [
  {
    "question": "Proposed company name",
    "required": true,
    "maxLength": 30,
    "input_type": "text",
    "placeholder": "Enter the proposed company name"
  },
  {
    "options": [
      "Private Limited Liability Company (Ltd)",
      "Public Limited Company (PLC)",
      "Branch of Foreign Company"
    ],
    "question": "Type of company",
    "required": true,
    "input_type": "radio"
  },
  {
    "question": "Business activity description",
    "required": true,
    "input_type": "text_area",
    "placeholder": "Briefly describe the main business activities"
  },
  {
    "question": "Share capital amount (EUR)",
    "required": true,
    "input_type": "number",
    "placeholder": "e.g. 1200"
  },
  {
    "question": "Number of shareholders",
    "required": true,
    "input_type": "number"
  },
  {
    "options": [
      "Yes",
      "No"
    ],
    "question": "Are any shareholders corporate entities?",
    "required": true,
    "input_type": "radio"
  },
  {
    "question": "Director full name",
    "required": true,
    "input_type": "text",
    "placeholder": "First and last name"
  },
  {
    "question": "Registered office address in Malta",
    "required": true,
    "input_type": "text_area",
    "placeholder": "Full registered address in Malta"
  },
  {
    "question": "Do you require a company secretary service?",
    "required": true,
    "input_type": "select"
  },
  {
    "question": "What service do you need?",
    "required": true,
    "input_type": "select",
    "options": [
      "Standard Monthly",
      {
        "label": "Catch-up / Backlog",
        "value": "Catch-up / Backlog",
        "questions": [
          {
            "question": "Which periods are affected?",
            "required": true,
            "input_type": "radio",
            "options": [
              {
                "label": "Month",
                "value": "Month",
                "questions": [
                  {
                    "question": "Select the specific month",
                    "required": true,
                    "input_type": "select",
                    "options": ["January 2026", "February 2026", "March 2026"]
                  }
                ]
              },
              {
                "label": "Quarter",
                "value": "Quarter",
                "questions": [
                  {
                    "question": "Select the target quarter",
                    "required": true,
                    "input_type": "select",
                    "options": ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const mockAnswersByRequestId: Record<string, Record<string, string | number | boolean>> = {
  'req_1': {
    "Proposed company name": "TechSphere International Ltd",
    "Type of company": "Private Limited Liability Company (Ltd)",
    "Business activity description": "Software development and cloud infrastructure consultancy services for global enterprise clients.",
    "Share capital amount (EUR)": "5000",
    "Number of shareholders": "2",
    "Are any shareholders corporate entities?": "No",
    "Director full name": "John Michael Doe",
    "Registered office address in Malta": "Level 4, Quantum Towers, Dragonara Road, St. Julians, STJ 3141, Malta",
    "Do you require a company secretary service?": "Yes"
  }
};
