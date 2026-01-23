import { 
  FileIcon, 
  FileTextIcon, 
  ImageIcon, 
  FileCodeIcon,
  ArchiveIcon
} from 'lucide-react';

export interface Folder {
  id: string;
  folder_name: string;
  parentId: string | null;
  scope?: unknown;
  permissions?: unknown;
  tags: string[];
  uploaderId: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryFile {
  id: string;
  folderId: string;
  file_name: string;
  file_type: string;
  url: string;
  file_size: number;
  version: number;
  tags: string[];
  uploaderId: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

// Unified type for frontend components - includes both backend fields and UI-friendly mappings
export type LibraryItem = ((Folder & { type: 'folder' }) | (LibraryFile & { type: 'file' })) & {
  // UI-Friendly Helper Fields (populated by context/mapping)
  name?: string;
  fileType?: string;
  size?: string;
  parentId?: string | null;
  updatedAt?: string;
};

export const mockLibraryData: LibraryItem[] = [
  // Root level
  { 
    id: '1', 
    folder_name: 'Engagement & onboarding', 
    type: 'folder', 
    parentId: null,
    tags: ['onboarding'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  { 
    id: '2', 
    folder_name: 'Compliance & tax records', 
    type: 'folder', 
    parentId: null,
    tags: ['tax'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z'
  },
  { 
    id: '3', 
    folder_name: 'Audit & financial reports', 
    type: 'folder', 
    parentId: null,
    tags: ['audit'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  { 
    id: '4', 
    folder_name: 'Corporate governance', 
    type: 'folder', 
    parentId: null,
    tags: ['legal'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z'
  },
  
  // Inside Engagement & onboarding (ID: 1)
  { 
    id: '5', 
    folder_name: 'Draft agreements', 
    type: 'folder', 
    parentId: '1',
    tags: ['legal'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  { 
    id: '6', 
    folder_name: 'Policy Documents', 
    type: 'folder', 
    parentId: '1',
    tags: ['policy'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-19T10:00:00Z',
    updatedAt: '2024-01-19T10:00:00Z'
  },
  { 
    id: '8', 
    file_name: 'ENGAGEMENT_LETTER_2024_FINAL.pdf', 
    type: 'file', 
    file_type: 'PDF', 
    file_size: 1258291, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    folderId: '1',
    version: 1,
    tags: ['final'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-20T10:00:00Z'
  },
  { 
    id: '9', 
    file_name: 'MASTER_SERVICES_AGREEMENT.docx', 
    type: 'file', 
    file_type: 'DOCX', 
    file_size: 460800, 
    url: 'https://calibre-ebook.com/downloads/demos/demo.docx',
    folderId: '1',
    version: 1,
    tags: ['draft'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-15T10:00:00Z'
  },
  { 
    id: '10', 
    file_name: 'Onboarding_Checklist.xlsx', 
    type: 'file', 
    file_type: 'XLSX', 
    file_size: 128000, 
    url: 'https://go.microsoft.com/fwlink/?LinkID=521962',
    folderId: '1',
    version: 1,
    tags: ['checklist'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-10T10:00:00Z'
  },
  { 
    id: '11', 
    file_name: 'Company_Office_Map.png', 
    type: 'file', 
    file_type: 'PNG', 
    file_size: 2450000, 
    url: 'https://picsum.photos/1200/800',
    folderId: '1',
    version: 1,
    tags: ['office'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-12T10:00:00Z'
  },

  // Inside Compliance & tax records (ID: 2)
  { 
    id: '23', 
    file_name: 'VAT_SUBMISSION_Q4_2023.pdf', 
    type: 'file', 
    file_type: 'PDF', 
    file_size: 911360, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    folderId: '2',
    version: 1,
    tags: ['tax', 'vat'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-18T10:00:00Z'
  },
  { 
    id: '25', 
    file_name: 'Tax_Computation_Workings.xlsx', 
    type: 'file', 
    file_type: 'XLSX', 
    file_size: 2202009, 
    url: 'https://go.microsoft.com/fwlink/?LinkID=521962',
    folderId: '2',
    version: 1,
    tags: ['tax', 'workings'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-16T10:00:00Z'
  },
  { 
    id: '26', 
    file_name: 'Tax_Clearance_Certificate.pdf', 
    type: 'file', 
    file_type: 'PDF', 
    file_size: 450000, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    folderId: '2',
    version: 1,
    tags: ['tax', 'cert'],
    uploaderId: 'user-1',
    isDeleted: false,
    createdAt: '2024-01-15T10:00:00Z'
  },

  // Inside Audit & financial reports (ID: 3)
  { 
    id: '33', 
    file_name: 'FINANCIAL_STATEMENT_FY2023.pdf', 
    type: 'file', 
    file_type: 'PDF', 
    file_size: 3565158, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    folderId: '3',
    version: 1,
    tags: ['financial', 'audit'],
    uploaderId: 'user-2',
    isDeleted: false,
    createdAt: '2024-01-15T10:00:00Z'
  },
  { 
    id: '34', 
    file_name: 'Audit_Report_v2.docx', 
    type: 'file', 
    file_type: 'DOCX', 
    file_size: 890000, 
    url: 'https://calibre-ebook.com/downloads/demos/demo.docx',
    folderId: '3',
    version: 2,
    tags: ['audit'],
    uploaderId: 'user-2',
    isDeleted: false,
    createdAt: '2024-01-14T10:00:00Z'
  },
  { 
    id: '35', 
    file_name: 'Management_Accounts.xlsx', 
    type: 'file', 
    file_type: 'XLSX', 
    file_size: 1540000, 
    url: 'https://go.microsoft.com/fwlink/?LinkID=521962',
    folderId: '3',
    version: 1,
    tags: ['accounts'],
    uploaderId: 'user-2',
    isDeleted: false,
    createdAt: '2024-01-12T10:00:00Z'
  },

  // Inside Corporate governance (ID: 4)
  { 
    id: '43', 
    file_name: 'BOARD_MINUTES_JAN_2024.pdf', 
    type: 'file', 
    file_type: 'PDF', 
    file_size: 512000, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    folderId: '4',
    version: 1,
    tags: ['board', 'minutes'],
    uploaderId: 'admin-1',
    isDeleted: false,
    createdAt: '2024-01-10T10:00:00Z'
  },
  { 
    id: '44', 
    file_name: 'Company_Articles_of_Association.pdf', 
    type: 'file', 
    file_type: 'PDF', 
    file_size: 1800000, 
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    folderId: '4',
    version: 1,
    tags: ['legal', 'governance'],
    uploaderId: 'admin-1',
    isDeleted: false,
    createdAt: '2024-01-08T10:00:00Z'
  },
  { 
    id: '45', 
    file_name: 'Share_Register_2024.csv', 
    type: 'file', 
    file_type: 'CSV', 
    file_size: 85000, 
    url: 'https://raw.githubusercontent.com/datapackage-examples/sample-csv/master/sample.csv',
    folderId: '4',
    version: 1,
    tags: ['shares'],
    uploaderId: 'admin-1',
    isDeleted: false,
    createdAt: '2024-01-05T10:00:00Z'
  },
  { 
    id: '46', 
    file_name: 'Director_Headshot_Emma.jpg', 
    type: 'file', 
    file_type: 'JPG', 
    file_size: 1200000, 
    url: 'https://picsum.photos/400/400',
    folderId: '4',
    version: 1,
    tags: ['images', 'board'],
    uploaderId: 'admin-1',
    isDeleted: false,
    createdAt: '2024-01-02T10:00:00Z'
  },
];

export const getFileIcon = (fileType?: string) => {
  switch (fileType?.toUpperCase()) {
    case 'PDF': return FileTextIcon;
    case 'PNG':
    case 'JPG':
    case 'JPEG': return ImageIcon;
    case 'DOCX':
    case 'DOC': return FileTextIcon;
    case 'XLSX':
    case 'CSV': return FileCodeIcon;
    case 'ZIP': return ArchiveIcon;
    default: return FileIcon;
  }
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
