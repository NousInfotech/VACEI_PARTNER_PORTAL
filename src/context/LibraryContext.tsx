import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../config/base';
import { endPoints } from '../config/endPoint';

export interface LibraryItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  fileType: string;
  size: string;
  updatedAt: string;
  url?: string;
  parentId?: string | null;
  folderId?: string | null;
// Raw API fields
  folder_name?: string;
  file_name?: string;
  file_size?: number;
  createdAt?: string;
}

interface ApiFolder {
  id: string;
  folder_name: string;
  name?: string;
  updatedAt?: string;
}

interface ApiFile {
  id: string;
  file_name: string;
  filename?: string;
  file_type?: string;
  fileType?: string;
  file_size?: number;
  size?: number;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LibraryContentResponse {
  folders: ApiFolder[];
  files: ApiFile[];
  folder?: ApiFolder;
}

type ViewMode = 'list' | 'grid';
type SortField = 'name' | 'type' | 'size';
type SortOrder = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

interface ContextMenuState {
  x: number;
  y: number;
  itemId: string;
}

interface LibraryContextType {
  // State
  engagementId?: string;
  viewMode: ViewMode;
  currentFolderId: string | null;
  searchQuery: string;
  selectedItems: string[];
  sortConfig: SortConfig;
  contextMenu: ContextMenuState | null;
  filterType: string;
  isLoading: boolean;
  
  // Derived Data
  breadcrumbs: LibraryItem[];
  currentItems: LibraryItem[];
  rootFolders: LibraryItem[];
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string) => void;
  handleFolderClick: (id: string | null) => void;
  handleBack: () => void;
  handleDoubleClick: (item: LibraryItem) => void;
  handleSelection: (id: string, e: React.MouseEvent) => void;
  handleSort: (field: SortField) => void;
  handleContextMenu: (e: React.MouseEvent, itemId: string) => void;
  closeContextMenu: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setSelectedItems: (ids: string[]) => void;
  handleDownload: (item?: LibraryItem) => void;
  handleCreateFolder: (name: string) => Promise<void>;
  handleUpload: (files: FileList) => Promise<void>;
  handleDelete: (item: LibraryItem) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const LibraryProvider: React.FC<{ children: React.ReactNode; engagementId?: string }> = ({ children, engagementId }) => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', order: 'asc' });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch Root Folders or Engagement Library Folder
  const { data: libraryRootData } = useQuery({
    queryKey: ['library-roots', engagementId],
    queryFn: async () => {
      if (engagementId) {
        const res = await apiGet<{ data: LibraryContentResponse }>(
          endPoints.ENGAGEMENTS.LIBRARY_FOLDER(engagementId)
        );
        return res?.data;
      }
      const res = await apiGet<{ data: ApiFolder[] }>(endPoints.LIBRARY.FOLDERS_ROOTS);
      return { folders: res?.data ?? [], files: [] };
    },
  });

  const rootsData = useMemo(() => {
    return libraryRootData?.folders ?? [];
  }, [libraryRootData]);

  const rootFiles = useMemo(() => {
    if (engagementId) return libraryRootData?.files ?? [];
    return [];
  }, [libraryRootData, engagementId]);

  // Fetch Folder Content
  const { data: contentData, isLoading } = useQuery({
    queryKey: ['library-content', currentFolderId],
    enabled: !!currentFolderId,
    queryFn: async () => {
      if (!currentFolderId) return { folders: [], files: [] };
      const res = await apiGet<{ data: LibraryContentResponse }>(
        endPoints.LIBRARY.FOLDER_CONTENT(currentFolderId)
      );
      return res?.data ?? { folders: [], files: [] };
    },
  });

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiPost(endPoints.LIBRARY.FOLDER_CREATE, {
        folder_name: name,
        engagementId,
        parentId: currentFolderId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-content', currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ['library-roots'] });
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiPost(endPoints.LIBRARY.FILE_UPLOAD, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-content', currentFolderId] });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (item: LibraryItem) => {
      const url = item.type === 'folder' 
        ? endPoints.LIBRARY.FOLDER_DELETE(item.id)
        : endPoints.LIBRARY.FILE_DELETE(item.id);
      return apiDelete(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-content', currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ['library-roots'] });
    }
  });

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    window.addEventListener('click', closeContextMenu);
    return () => window.removeEventListener('click', closeContextMenu);
  }, []);

  const rootFolders = useMemo(() => {
    return (rootsData ?? []).map((f: ApiFolder) => ({
      ...f,
      id: f.id,
      name: f.name || f.folder_name,
      type: 'folder' as const,
      fileType: 'Folder',
      size: '',
      updatedAt: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : '',
    })) as LibraryItem[];
  }, [rootsData]);

  const currentItems = useMemo(() => {
    let folders: LibraryItem[] = [];
    let files: LibraryItem[] = [];

    if (!currentFolderId) {
      folders = rootFolders as LibraryItem[];
      files = (rootFiles ?? []).map((f: ApiFile) => ({
        ...f,
        name: f.filename || f.file_name,
        type: 'file' as const,
        fileType: f.fileType || f.file_type || 'File',
        size: formatFileSize(f.size || f.file_size),
        updatedAt: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : (f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''),
      })) as LibraryItem[];
    } else if (contentData) {
      folders = (contentData.folders ?? []).map((f: ApiFolder) => ({
        ...f,
        name: f.name || f.folder_name,
        type: 'folder' as const,
        fileType: 'Folder',
        size: '',
        updatedAt: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : '',
      }));
      files = (contentData.files ?? []).map((f: ApiFile) => ({
        ...f,
        name: f.filename || f.file_name,
        type: 'file' as const,
        fileType: f.fileType || f.file_type || 'File',
        size: formatFileSize(f.size || f.file_size),
        updatedAt: f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : (f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''),
      }));
    }

    const allItems = [...folders, ...files].filter(item => {
      const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (filterType === 'pdf') {
        matchesFilter = item.type === 'file' && item.fileType?.toUpperCase() === 'PDF';
      } else if (filterType === 'spreadsheet') {
        matchesFilter = item.type === 'file' && (item.fileType?.toUpperCase() === 'XLSX' || item.fileType?.toUpperCase() === 'CSV');
      } else if (filterType === 'document') {
        matchesFilter = item.type === 'file' && (item.fileType?.toUpperCase() === 'DOCX' || item.fileType?.toUpperCase() === 'DOC');
      }

      return matchesSearch && matchesFilter;
    });

    allItems.sort((a, b) => {
      let comparison = 0;
      if (sortConfig.field === 'name') {
        comparison = (a.name || "").localeCompare(b.name || "");
      } else if (sortConfig.field === 'type') {
        comparison = (a.fileType || "").localeCompare(b.fileType || "");
      } else if (sortConfig.field === 'size') {
        const sizeA = a.file_size || 0;
        const sizeB = b.file_size || 0;
        comparison = sizeA - sizeB;
      }
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    return allItems as LibraryItem[];
  }, [currentFolderId, rootFolders, rootFiles, contentData, searchQuery, sortConfig, filterType]);

  // Breadcrumbs logic - this would ideally come from the API or be managed via state
  // For now, we'll maintain a simple stack or rely on the current folder's parent
  const [breadcrumbStack, setBreadcrumbStack] = useState<LibraryItem[]>([]);

  const handleFolderClick = (id: string | null) => {
    if (id === null) {
      setCurrentFolderId(null);
      setBreadcrumbStack([]);
    } else {
      const folder = currentItems.find(i => i.id === id && i.type === 'folder');
      if (folder) {
        setBreadcrumbStack(prev => [...prev, folder]);
      }
      setCurrentFolderId(id);
    }
    setSelectedItems([]);
    setContextMenu(null);
  };

  const handleBack = () => {
    if (breadcrumbStack.length > 0) {
      const newStack = [...breadcrumbStack];
      newStack.pop();
      setBreadcrumbStack(newStack);
      const parent = newStack[newStack.length - 1];
      setCurrentFolderId(parent ? parent.id : null);
    } else {
      setCurrentFolderId(null);
    }
    setSelectedItems([]);
    setContextMenu(null);
  };

  const handleDoubleClick = (item: LibraryItem) => {
    if (item.type === 'folder') {
      handleFolderClick(item.id);
    } else if (item.url) {
      window.open(item.url, '_blank');
    }
  };

  const handleDownload = async (item?: LibraryItem) => {
    const itemsToDownload = item ? [item] : currentItems.filter(i => selectedItems.includes(i.id));
    
    for (const i of itemsToDownload) {
      if (i.type === 'file' && i.url) {
        const link = document.createElement('a');
        link.href = i.url;
        link.download = i.name;
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    if (e.ctrlKey || e.metaKey) {
      setSelectedItems(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedItems([id]);
    }
  };

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemId });
    if (!selectedItems.includes(itemId)) {
      setSelectedItems([itemId]);
    }
  };

  const handleCreateFolder = async (name: string) => {
    await createFolderMutation.mutateAsync(name);
  };

  const handleUpload = async (files: FileList) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    if (currentFolderId) formData.append('folderId', currentFolderId);
    if (engagementId) formData.append('engagementId', engagementId);
    
    await uploadFileMutation.mutateAsync(formData);
  };

  const handleDelete = async (item: LibraryItem) => {
    await deleteItemMutation.mutateAsync(item);
  };

  const value = {
    engagementId,
    viewMode, setViewMode,
    currentFolderId,
    searchQuery, setSearchQuery,
    selectedItems, setSelectedItems,
    sortConfig,
    contextMenu,
    filterType, setFilterType,
    isLoading,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    breadcrumbs: breadcrumbStack,
    currentItems,
    rootFolders,
    handleFolderClick,
    handleBack,
    handleDoubleClick,
    handleSelection,
    handleSort,
    handleContextMenu,
    closeContextMenu,
    handleDownload,
    handleCreateFolder,
    handleUpload,
    handleDelete
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
