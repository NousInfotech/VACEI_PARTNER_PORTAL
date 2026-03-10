import type { KycWorkflow } from './types';

export const MOCK_KYC_DATA: KycWorkflow[] = [
  {
    _id: 'workflow-company-1',
    companyId: 'mock-company-1',
    workflowType: 'Company',
    status: 'PENDING',
    documentRequests: [
      {
        _id: 'req-company-1',
        documentRequest: {
          _id: 'dr-company-1',
          category: 'Company KYC',
          address: '123 Valletta Street, Malta',
          status: 'PENDING',
          documents: [
            {
              _id: 'doc-1',
              name: 'Certificate of Incorporation',
              description: 'Official document proving the company formation.',
              status: 'pending',
              type: 'direct'
            },
            {
              _id: 'doc-2',
              name: 'Memorandum & Articles of Association',
              description: 'The company\'s constitution documents.',
              status: 'pending',
              type: 'direct'
            }
          ],
          multipleDocuments: []
        }
      }
    ]
  },
  {
    _id: 'workflow-sh-1',
    companyId: 'mock-company-1',
    workflowType: 'Shareholder',
    status: 'PENDING',
    documentRequests: [
      {
        _id: 'req-sh-1',
        person: {
          _id: 'pers-1',
          name: 'John Doe',
          nationality: 'Maltese',
          address: '123, Valletta Street, Malta'
        },
        documentRequest: {
          _id: 'dr-sh-1',
          category: 'Shareholder KYC',
          address: '123, Valletta Street, Malta',
          status: 'PENDING',
          documents: [
            {
              _id: 'doc-sh-1',
              name: 'Passport Copy',
              description: 'Clear copy of the valid identity document.',
              status: 'pending',
              type: 'direct'
            }
          ],
          multipleDocuments: [
            {
              _id: 'multi-sh-1',
              name: 'Proof of Address',
              instruction: 'Utility bill or bank statement (not older than 3 months).',
              multiple: [
                {
                  label: 'Utility Bill',
                  status: 'pending'
                }
              ]
            }
          ]
        }
      }
    ]
  },
  {
    _id: 'workflow-rep-1',
    companyId: 'mock-company-1',
    workflowType: 'Representative',
    status: 'PENDING',
    documentRequests: [
      {
        _id: 'req-rep-1',
        person: {
          _id: 'pers-2',
          name: 'Jane Smith',
          nationality: 'British',
          address: '45, London Road, UK'
        },
        documentRequest: {
          _id: 'dr-rep-1',
          category: 'Representative KYC',
          address: '45, London Road, UK',
          status: 'PENDING',
          documents: [
            {
              _id: 'doc-rep-1',
              name: 'ID Card Copy',
              status: 'verified',
              url: 'https://example.com/id.pdf',
              uploadedAt: new Date().toISOString(),
              uploadedFileName: 'jane_id.pdf'
            }
          ],
          multipleDocuments: []
        }
      }
    ]
  }
];
