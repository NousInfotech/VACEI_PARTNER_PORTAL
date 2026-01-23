import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { type LibraryItem, mockLibraryData, formatFileSize } from '../lib/libraryData';

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
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', order: 'asc' });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Simulated Loading Effect
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsLoading(true);
    }, 0);
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [currentFolderId, filterType]);

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    window.addEventListener('click', closeContextMenu);
    return () => window.removeEventListener('click', closeContextMenu);
  }, []);

  const breadcrumbs = useMemo(() => {
    const path: LibraryItem[] = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = mockLibraryData.find(item => item.id === currentId && item.type === 'folder');
      if (folder && folder.type === 'folder') {
        // Normalize breadcrumb item
        path.unshift({
          ...folder,
          name: folder.folder_name,
        });
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  }, [currentFolderId]);

  const currentItems = useMemo(() => {
    const filtered = mockLibraryData.filter(item => {
      const itemParentId = item.type === 'folder' ? item.parentId : item.folderId;
      const itemName = item.type === 'folder' ? item.folder_name : item.file_name;
      
      const matchesFolder = itemParentId === currentFolderId;
      const matchesSearch = searchQuery === '' || itemName.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (filterType === 'pdf') {
        matchesFilter = item.type === 'file' && item.file_type?.toUpperCase() === 'PDF';
      } else if (filterType === 'spreadsheet') {
        matchesFilter = item.type === 'file' && (item.file_type?.toUpperCase() === 'XLSX' || item.file_type?.toUpperCase() === 'CSV');
      } else if (filterType === 'document') {
        matchesFilter = item.type === 'file' && (item.file_type?.toUpperCase() === 'DOCX' || item.file_type?.toUpperCase() === 'DOC');
      }

      return matchesFolder && matchesSearch && matchesFilter;
    });

    const normalized = filtered.map(item => {
      const name = item.type === 'folder' ? item.folder_name : item.file_name;
      const fileType = item.type === 'file' ? item.file_type : 'Folder';
      const size = item.type === 'file' ? formatFileSize(item.file_size) : '';
      const updatedAtStr = item.type === 'folder' ? item.updatedAt : item.createdAt;
      
      return {
        ...item,
        name,
        fileType,
        size,
        updatedAt: new Date(updatedAtStr).toLocaleDateString(),
        parentId: item.type === 'folder' ? item.parentId : item.folderId,
      };
    });

    normalized.sort((a, b) => {
      let comparison = 0;
      if (sortConfig.field === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortConfig.field === 'type') {
        comparison = a.fileType.localeCompare(b.fileType);
      } else if (sortConfig.field === 'size') {
        comparison = a.size.localeCompare(b.size);
      }
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    return normalized;
  }, [currentFolderId, searchQuery, sortConfig, filterType]);

  const rootFolders = useMemo(() => {
    return mockLibraryData
      .filter(item => item.type === 'folder' && item.parentId === null)
      .map(folder => ({
        ...folder,
        name: folder.type === 'folder' ? folder.folder_name : '',
      }));
  }, []);

  const handleFolderClick = (id: string | null) => {
    setCurrentFolderId(id);
    setSelectedItems([]);
    setContextMenu(null);
  };

  const handleBack = () => {
    if (currentFolderId) {
      const current = mockLibraryData.find(item => item.id === currentFolderId);
      setCurrentFolderId(current?.parentId || null);
      setSelectedItems([]);
      setContextMenu(null);
    }
  };

  const handleDoubleClick = (item: LibraryItem) => {
    if (item.type === 'folder') {
      handleFolderClick(item.id);
    } else {
      const isExcel = item.fileType?.toUpperCase() === 'XLSX' || item.fileType?.toUpperCase() === 'CSV';
      if (isExcel) {
        handleDownload(item);
      } else if (item.url) {
        window.open(item.url, '_blank');
      }
    }
  };

  const handleDownload = async (item?: LibraryItem) => {
    let itemsToDownload: LibraryItem[] = [];
    let isZip = false;
    let zipName = "library_export.zip";
    
    if (item) {
      itemsToDownload = [item];
      if (item.type === 'folder') {
        isZip = true;
        zipName = `${item.name}.zip`;
      }
    } else if (selectedItems.length > 0) {
      itemsToDownload = mockLibraryData.filter(i => selectedItems.includes(i.id));
      if (itemsToDownload.length > 1 || itemsToDownload.some(i => i.type === 'folder')) {
        isZip = true;
      }
    } else {
      itemsToDownload = currentItems;
      isZip = true;
      const folderName = currentFolderId 
        ? mockLibraryData.find(i => i.id === currentFolderId)?.name 
        : "Root";
      zipName = `${folderName}_all_files.zip`;
    }

    if (isZip) {
      console.log(`Simulating Zip Creation: ${zipName}`);
      // In a real app, we'd use JSZip here. For mock, we'll simulate a zip download.
      // We use a dummy blob to trigger the browser's download dialog with the correct name.
      const blob = new Blob(["This is a simulated ZIP file content for " + zipName], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return;
    }

    // Single file download logic
    const filesToDownload = itemsToDownload.filter(i => i.type === 'file' && i.url);
    for (const i of filesToDownload) {
      const itemName = i.type === 'folder' ? i.folder_name : i.file_name;
      const itemUrl = i.type === 'file' ? i.url : undefined;

      if (itemUrl) {
        console.log(`Downloading ${itemName}...`);
        try {
          const response = await fetch(itemUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = itemName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch {
          // Fallback: open in new tab if download fails
          const link = document.createElement('a');
          link.href = itemUrl;
          link.setAttribute('download', itemName);
          link.setAttribute('target', '_blank');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
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
      setSelectedItems(prev => (prev.length === 1 && prev[0] === id) ? [] : [id]);
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

  const value = {
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
    breadcrumbs,
    currentItems,
    rootFolders,
    handleFolderClick,
    handleBack,
    handleDoubleClick,
    handleSelection,
    handleSort,
    handleContextMenu,
    closeContextMenu,
    handleDownload
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
