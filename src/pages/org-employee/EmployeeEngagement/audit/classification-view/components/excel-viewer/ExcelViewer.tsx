import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost, apiPostFormData } from '../../../../../../../config/base';
import { endPoints } from '../../../../../../../config/endPoint';
import { Loader2, FileSpreadsheet, ChevronLeft, Link, FilePlus, MessageSquare, Edit, Trash2, X, UploadCloud, XCircle, RefreshCw, FileText, List, ChevronDown, Code, Info } from 'lucide-react';
import { zeroIndexToExcelCol, excelColToZeroIndex } from './utils';
import { getMappings, getReferences, createRangeEvidence, updateRangeEvidence, deleteRangeEvidence, type RangeEvidence, type CreateRangeEvidenceRequest, type UpdateRangeEvidenceRequest } from '../../../../../../../lib/api/workbookApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../../../../ui/Dialog';
import { Button } from '../../../../../../../ui/Button';
import { Input } from '../../../../../../../ui/input';
import { Textarea } from '../../../../../../../ui/Textarea';
import { Label } from '../../../../../../../ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from '../../../../../../../ui/dropdown-menu';
import { Checkbox } from '../../../../../../../ui/checkbox';
import { Badge } from '../../../../../../../ui/badge';
import { useToast } from '../../../../../../../hooks/use-toast';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface ExcelViewerProps {
  workbookId: string;
  workbookName?: string;
  workbookWebUrl?: string;
  engagementId?: string;
  classification?: string; // Classification label (for filtering)
  classificationId?: string; // Classification ID (UUID) for evidence creation
  onBack?: () => void;
}

interface SheetDataResponse {
  sheetNames: string[];
  sheetData: { [sheetName: string]: string[][] };
}

interface Selection {
  sheet: string;
  start: { row: number; col: number }; // 0-indexed
  end: { row: number; col: number }; // 0-indexed
}

export default function ExcelViewer({ workbookId, workbookName, workbookWebUrl, engagementId, classification, classificationId, onBack }: ExcelViewerProps) {
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const gridRef = useRef<AgGridReact>(null);
  
  // Sheet list dropdown state
  const [isSheetListOpen, setIsSheetListOpen] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  
  // Mappings dialog state
  const [isMappingsDialogOpen, setIsMappingsDialogOpen] = useState(false);
  
  // Step 1: Cell selection state
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null);
  const anchorSelectionStart = useRef<{ row: number; col: number } | null>(null); // Ref for auto-scroll
  const gridApiRef = useRef<any>(null);
  
  // Auto-scroll state
  const spreadsheetContainerRef = useRef<HTMLDivElement>(null);
  const bottomHeaderRef = useRef<HTMLDivElement>(null);
  const autoScrollAnimationFrameRef = useRef<number | null>(null);
  const currentMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const lastUpdatedCellRef = useRef<{ row: number; col: number } | null>(null);

  // Step 2: Mappings state
  const [mappings, setMappings] = useState<RangeEvidence[]>([]);
  
  // Step 3: References state
  const [references, setReferences] = useState<RangeEvidence[]>([]);

  // Step 5: Context menu state (right-click)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: number;
    col: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Hover menu state (for mappings/references on hover)
  const [hoverMenu, setHoverMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: 'mapping' | 'reference' | null;
    data: RangeEvidence | null;
  }>({ visible: false, x: 0, y: 0, type: null, data: null });
  const hoverMenuRef = useRef<HTMLDivElement>(null);
  const hoverMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMenuHoveredRef = useRef(false);

  // View dialogs state
  const [viewingMapping, setViewingMapping] = useState<RangeEvidence | null>(null);
  const [isViewMappingDialogOpen, setIsViewMappingDialogOpen] = useState(false);
  const [viewingReference, setViewingReference] = useState<RangeEvidence | null>(null);
  const [isViewReferenceDialogOpen, setIsViewReferenceDialogOpen] = useState(false);

  // Fetch sheet data
  const { data: sheetDataResponse, isLoading, error } = useQuery<SheetDataResponse>({
    queryKey: ['workbook-sheet-data', workbookId],
    queryFn: async () => {
      const response = await apiGet<{ data: SheetDataResponse }>(
        endPoints.AUDIT.GET_WORKBOOK_SHEET_DATA(workbookId)
      );
      return response.data || response;
    },
    enabled: !!workbookId,
    retry: 2,
  });

  // Step 2: Fetch mappings
  const { data: mappingsData, refetch: refetchMappings } = useQuery<RangeEvidence[]>({
    queryKey: ['workbook-mappings', workbookId],
    queryFn: async () => {
      if (!workbookId) return [];
      return await getMappings(workbookId);
    },
    enabled: !!workbookId,
    retry: 2,
  });

  // Store refetch function for later use (creating/updating/deleting mappings)
  const mappingsRefetchRef = useRef(refetchMappings);
  useEffect(() => {
    mappingsRefetchRef.current = refetchMappings;
  }, [refetchMappings]);

  // Step 2: Update mappings state when data changes
  useEffect(() => {
    if (mappingsData) {
      setMappings(mappingsData);
    }
  }, [mappingsData]);

  // Step 3: Fetch references
  const { data: referencesData, refetch: refetchReferences } = useQuery<RangeEvidence[]>({
    queryKey: ['workbook-references', workbookId],
    queryFn: async () => {
      if (!workbookId) return [];
      return await getReferences(workbookId);
    },
    enabled: !!workbookId,
    retry: 2,
  });

  // Step 3: Update references state when data changes
  useEffect(() => {
    if (referencesData) {
      setReferences(referencesData);
    }
  }, [referencesData]);

  // Store refetch function for later use (creating/updating/deleting references)
  const referencesRefetchRef = useRef(refetchReferences);
  useEffect(() => {
    referencesRefetchRef.current = refetchReferences;
  }, [refetchReferences]);

  // Set initial sheet when data loads
  useEffect(() => {
    if (sheetDataResponse?.sheetNames && sheetDataResponse.sheetNames.length > 0 && !selectedSheet) {
      setSelectedSheet(sheetDataResponse.sheetNames[0]);
    }
  }, [sheetDataResponse, selectedSheet]);

  // Initialize selectedSheets when sheet names are available
  useEffect(() => {
    if (sheetDataResponse?.sheetNames && sheetDataResponse.sheetNames.length > 0) {
      // Initialize with all sheets selected
      setSelectedSheets(new Set(sheetDataResponse.sheetNames));
    }
  }, [sheetDataResponse?.sheetNames]);

  // Sheet list handlers
  const areAllSheetsSelected = useMemo(() => {
    if (!sheetDataResponse?.sheetNames) return false;
    return sheetDataResponse.sheetNames.length > 0 && 
           sheetDataResponse.sheetNames.every(sheet => selectedSheets.has(sheet));
  }, [sheetDataResponse?.sheetNames, selectedSheets]);

  const handleSelectAllSheets = useCallback((checked: boolean) => {
    if (!sheetDataResponse?.sheetNames) return;
    if (checked) {
      setSelectedSheets(new Set(sheetDataResponse.sheetNames));
    } else {
      setSelectedSheets(new Set());
    }
  }, [sheetDataResponse?.sheetNames]);

  const handleSheetToggle = useCallback((sheetName: string, checked: boolean) => {
    setSelectedSheets(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(sheetName);
      } else {
        newSet.delete(sheetName);
      }
      return newSet;
    });
  }, []);

  const handleSheetChange = useCallback((sheetName: string) => {
    setSelectedSheet(sheetName);
    setIsSheetListOpen(false);
  }, []);

  // Get current sheet data
  const currentSheetData = useMemo(() => {
    if (!sheetDataResponse?.sheetData || !selectedSheet) return null;
    return sheetDataResponse.sheetData[selectedSheet] || null;
  }, [sheetDataResponse, selectedSheet]);

  // Transform data for AG Grid
  const gridData = useMemo(() => {
    if (!currentSheetData || currentSheetData.length === 0) return [];
    
    // Ensure minimum 23 columns (A to W)
    const minCols = 23;
    
    // Use all rows (including header row if present)
    return currentSheetData.map((row, rowIndex) => {
      const rowData: any = { 
        _rowIndex: rowIndex, // 0-indexed for internal use
        _excelRowNumber: rowIndex + 1, // 1-indexed Excel row number
      };
      
      // Pad row to ensure at least 23 columns (A to W)
      const paddedRow = [...row];
      while (paddedRow.length < minCols) {
        paddedRow.push('');
      }
      
      paddedRow.forEach((cell, colIndex) => {
        const colLetter = zeroIndexToExcelCol(colIndex);
        rowData[colLetter] = cell || '';
      });
      
      return rowData;
    });
  }, [currentSheetData]);

  // Step 1: Helper to check if a cell is in selection
  const isCellInSelection = useCallback((row: number, col: number, selection: Selection): boolean => {
    if (selection.sheet !== selectedSheet) return false;
    
    const minRow = Math.min(selection.start.row, selection.end.row);
    const maxRow = Math.max(selection.start.row, selection.end.row);
    const minCol = Math.min(selection.start.col, selection.end.col);
    const maxCol = Math.max(selection.start.col, selection.end.col);
    
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [selectedSheet]);


  // Step 2: Helper to check if a cell is in a mapping
  const isCellInMapping = useCallback((row: number, col: number, mapping: RangeEvidence): boolean => {
    if (mapping.sheet !== selectedSheet) return false;
    
    // RangeEvidence uses 0-indexed coordinates
    const minRow = Math.min(mapping.startRow, mapping.endRow);
    const maxRow = Math.max(mapping.startRow, mapping.endRow);
    const minCol = Math.min(mapping.startCol, mapping.endCol);
    const maxCol = Math.max(mapping.startCol, mapping.endCol);
    
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [selectedSheet]);

  // Step 2: Get mapping for a cell (if any)
  const getCellMapping = useCallback((row: number, col: number): RangeEvidence | null => {
    for (const mapping of mappings) {
      if (isCellInMapping(row, col, mapping)) {
        return mapping;
      }
    }
    return null;
  }, [mappings, isCellInMapping]);

  // Step 3: Helper to check if a cell is in a reference
  const isCellInReference = useCallback((row: number, col: number, reference: RangeEvidence): boolean => {
    if (reference.sheet !== selectedSheet) return false;
    
    const minRow = Math.min(reference.startRow, reference.endRow);
    const maxRow = Math.max(reference.startRow, reference.endRow);
    const minCol = Math.min(reference.startCol, reference.endCol);
    const maxCol = Math.max(reference.startCol, reference.endCol);
    
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [selectedSheet]);

  // Step 3: Get reference for a cell (if any)
  const getCellReference = useCallback((row: number, col: number): RangeEvidence | null => {
    for (const reference of references) {
      if (isCellInReference(row, col, reference)) {
        return reference;
      }
    }
    return null;
  }, [references, isCellInReference]);

  // Step 10: Helper function to format range string for tooltip
  const formatRangeString = useCallback((evidence: RangeEvidence): string => {
    const startCol = zeroIndexToExcelCol(evidence.startCol);
    const endCol = zeroIndexToExcelCol(evidence.endCol);
    const startRow = evidence.startRow + 1;
    const endRow = evidence.endRow + 1;
    
    if (evidence.startRow === evidence.endRow && evidence.startCol === evidence.endCol) {
      return `${evidence.sheet}!${startCol}${startRow}`;
    }
    return `${evidence.sheet}!${startCol}${startRow}:${endCol}${endRow}`;
  }, []);

  // Cell selection handlers (moved from cellRenderer to AG Grid props)
  const onCellMouseDown = useCallback((event: any) => {
    // Ignore right-clicks (button === 2) - they should not trigger selection
    if (event.event && event.event.button === 2) {
      return; // Don't process right-clicks for selection
    }
    
    // Ignore row number column
    if (event.colDef.field === '_rowIndex' || event.colDef.field === '_excelRowNumber') {
      return;
    }

    const rowIndex = event.node.rowIndex;
    const colLetter = event.colDef.field;
    const excelColIndex = excelColToZeroIndex(colLetter);

    // Reset AG Grid internals to prevent row selection
    if (gridApiRef.current) {
      gridApiRef.current.stopEditing();
      gridApiRef.current.clearFocusedCell();
      gridApiRef.current.deselectAll();
    }

    const clickedCell = { row: rowIndex, col: excelColIndex };
    const newSelection: Selection = {
      sheet: selectedSheet,
      start: clickedCell,
      end: clickedCell
    };

    // Update React state
    if (event.event.ctrlKey || event.event.metaKey) {
      setSelections(prev => [...prev, newSelection]);
    } else {
      setSelections([newSelection]);
    }

    setIsSelecting(true);
    isMouseDownRef.current = true;
    setSelectionStart(clickedCell);
    anchorSelectionStart.current = clickedCell; // Set ref for auto-scroll
  }, [selectedSheet]);

  const onCellMouseOver = useCallback((event: any) => {
    // Ignore row number column
    if (event.colDef.field === '_rowIndex' || event.colDef.field === '_excelRowNumber') {
      return;
    }

    // Update mouse position for auto-scroll
    if (event.event) {
      currentMousePositionRef.current = { x: event.event.clientX, y: event.event.clientY };
    }

    // Handle cell selection during drag
    // Only update selection if mouse is still down (isMouseDownRef) and we're in selecting mode
    if (isSelecting && selectionStart && isMouseDownRef.current) {
      const rowIndex = event.node.rowIndex;
      const colLetter = event.colDef.field;
      const excelColIndex = excelColToZeroIndex(colLetter);

      setSelections([{
        sheet: selectedSheet,
        start: selectionStart,
        end: { row: rowIndex, col: excelColIndex }
      }]);
      return; // Don't show hover menu while selecting
    }

    // Handle hover menu for mappings/references
    // Don't show hover menu if selecting, menu is hovered, or dialogs are open
    if (!isSelecting && !isMenuHoveredRef.current && !isViewMappingDialogOpen && !isViewReferenceDialogOpen) {
      const rowIndex = event.node.rowIndex;
      const colLetter = event.colDef.field;
      const excelColIndex = excelColToZeroIndex(colLetter);

      // Check for mapping or reference
      const cellMapping = getCellMapping(rowIndex, excelColIndex);
      const cellReference = getCellReference(rowIndex, excelColIndex);

      // Clear any existing timeout
      if (hoverMenuTimeoutRef.current) {
        clearTimeout(hoverMenuTimeoutRef.current);
        hoverMenuTimeoutRef.current = null;
      }

      if (cellMapping || cellReference) {
        const cellElement = event.event?.target?.closest('.ag-cell');
        if (cellElement) {
          const rect = cellElement.getBoundingClientRect();
          setHoverMenu({
            visible: true,
            x: rect.left + rect.width / 2, // Center of cell
            y: rect.bottom, // Below cell
            type: cellMapping ? 'mapping' : 'reference',
            data: cellMapping || cellReference
          });
        }
      } else {
        // Hide menu with delay when leaving mapping/reference area
        hoverMenuTimeoutRef.current = setTimeout(() => {
          if (!isMenuHoveredRef.current) {
            setHoverMenu(prev => ({ ...prev, visible: false }));
          }
        }, 200);
      }
    }
  }, [isSelecting, selectionStart, selectedSheet, getCellMapping, getCellReference, isViewMappingDialogOpen, isViewReferenceDialogOpen]);

  // Mouse up is handled by global event listener in useEffect

  const onCellContextMenu = useCallback((params: any) => {
    // Prevent browser's default context menu (matching REFERENCE-PORTAL)
    const nativeEvent = params.event as MouseEvent;
    if (nativeEvent) {
      nativeEvent.preventDefault();
      nativeEvent.stopPropagation();
      nativeEvent.stopImmediatePropagation();
      nativeEvent.cancelBubble = true;
    }
    
    // Only show context menu for data cells (not row number column)
    if (params.colDef?.field === '_rowIndex' || params.colDef?.field === '_excelRowNumber') {
      return;
    }
    
    // Get cell position
    const rowIndex = params.node?.rowIndex !== undefined ? params.node.rowIndex : 0;
    const colLetter = params.colDef?.field || '';
    
    if (!colLetter || colLetter === '_rowIndex' || colLetter === '_excelRowNumber') {
      return;
    }
    
    const excelColIndex = excelColToZeroIndex(colLetter);
    
    // IMPORTANT: Right-click should NOT change selections
    // Keep the current selection as-is, don't create new selections on right-click
    // The context menu will work with whatever selection currently exists
    
    // If no selection exists, create one for this cell
    if (selections.length === 0) {
      setSelections([{
        sheet: selectedSheet,
        start: { row: rowIndex, col: excelColIndex },
        end: { row: rowIndex, col: excelColIndex }
      }]);
    }

    setContextMenu({
      x: nativeEvent?.clientX || 0,
      y: nativeEvent?.clientY || 0,
      row: rowIndex,
      col: excelColIndex
    });
  }, [selections, selectedSheet]);

  const onColumnResized = useCallback((event: any) => {
    // Column resize is handled automatically by AG Grid
    // This callback can be used for persistence if needed in the future
    console.log('Column resized:', event);
  }, []);

  // Step 1 & 2: Custom cell renderer for displaying mappings and references
  const cellRenderer = useCallback((params: any) => {
    const colId = params.column.colId;
    if (colId === '_rowIndex' || colId === '_excelRowNumber') {
      return <div className="w-full h-full flex items-center justify-center">{params.value}</div>;
    }
    
    const row = params.node.rowIndex;
    const col = excelColToZeroIndex(colId);
    const isSelected = selections.some(sel => isCellInSelection(row, col, sel));
    
    // Step 2: Check if cell is in a mapping
    const cellMapping = getCellMapping(row, col);
    // Step 3: Check if cell is in a reference
    const cellReference = getCellReference(row, col);
    
    // Determine background color: selection > mapping > reference > default
    let bgColor = '';
    let inlineStyle: React.CSSProperties | undefined = undefined;
    
    if (isSelected) {
      bgColor = 'bg-blue-100';
    } else if (cellMapping) {
      const mappingColor = cellMapping.color || '#FFEB3B'; // Default yellow
      // Use inline style for custom colors (hex colors)
      if (mappingColor.startsWith('#')) {
        // Convert hex to rgba with opacity
        const hex = mappingColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        inlineStyle = {
          backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)`,
        };
      } else {
        // Use Tailwind color classes for named colors
        bgColor = 'bg-yellow-100';
      }
    } else if (cellReference) {
      // References use yellow background to differentiate from selected cells (blue) and mappings
      inlineStyle = {
        backgroundColor: 'rgba(234, 179, 8, 0.2)', // yellow-500 with 20% opacity - distinct from blue selection
      };
    }
    
    // Return cell content without tooltip (hover menu will handle it)
    return (
      <div
        className={`w-full h-full flex items-center ${bgColor || ''}`}
        style={{ ...inlineStyle, paddingLeft: '6px', paddingRight: '6px' }}
      >
        {params.value}
      </div>
    );
  }, [selections, isSelecting, selectionStart, selectedSheet, isCellInSelection, getCellMapping, getCellReference, formatRangeString]);

  // Global mouse event tracking for auto-scrolling (with capture: true to catch scrollbar events)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Update the ref immediately for the auto-scroll loop to use
      currentMousePositionRef.current = { x: e.clientX, y: e.clientY };
      
      // Track button state
      if (e.buttons === 1) {
        isMouseDownRef.current = true;
      } else {
        isMouseDownRef.current = false;
      }
    };

    const handleMouseDown = () => {
      isMouseDownRef.current = true;
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      lastUpdatedCellRef.current = null; // Reset selection tracking
      anchorSelectionStart.current = null; // Clear anchor for auto-scroll
      if (isSelecting) {
        setIsSelecting(false);
      }
    };

    // Prevent browser context menu globally when over the spreadsheet area
    // Use capture phase to prevent browser menu, but don't stop propagation
    // so AG Grid's onCellContextMenu can still handle it
    const handleContextMenu = (e: MouseEvent) => {
      // Only prevent if the event is within our spreadsheet container
      if (spreadsheetContainerRef.current && spreadsheetContainerRef.current.contains(e.target as Node)) {
        // Always prevent browser context menu
        e.preventDefault();
        // Don't stop propagation - let AG Grid's handler run
        // This allows our custom context menu to appear via onCellContextMenu
      }
    };

    // Use capture: true to catch events even if they hit the scrollbar
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      isMouseDownRef.current = false;
    };
  }, [isSelecting]);

  // Step 5: Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Step 5: Get selected range string for display
  const getSelectedRangeString = useCallback((): string => {
    if (selections.length === 0) return '';
    
    const lastSelection = selections[selections.length - 1];
    const start = `${zeroIndexToExcelCol(lastSelection.start.col)}${lastSelection.start.row + 1}`;
    const end = `${zeroIndexToExcelCol(lastSelection.end.col)}${lastSelection.end.row + 1}`;
    
    if (start === end) {
      return start;
    }
    return `${start}:${end}`;
  }, [selections]);

  // Get selected cell value for formula bar
  const getSelectedCellValue = useCallback((): string => {
    if (selections.length === 0 || !currentSheetData) return '';
    
    const lastSelection = selections[selections.length - 1];
    const row = lastSelection.start.row;
    const col = lastSelection.start.col;
    
    if (row < currentSheetData.length && col < currentSheetData[row].length) {
      const value = currentSheetData[row][col];
      return value !== null && value !== undefined ? String(value) : '';
    }
    return '';
  }, [selections, currentSheetData]);

  // Step 5: Check if current cell has a mapping
  const hasMapping = useCallback((): boolean => {
    if (selections.length === 0) return false;
    const lastSelection = selections[selections.length - 1];
    return mappings.some(m => 
      m.sheet === selectedSheet &&
      m.startRow === lastSelection.start.row &&
      m.startCol === lastSelection.start.col &&
      m.endRow === lastSelection.end.row &&
      m.endCol === lastSelection.end.col
    );
  }, [selections, mappings, selectedSheet]);

  // Step 5: Get current cell mapping (if exists)
  const getCurrentMapping = useCallback((): RangeEvidence | null => {
    if (selections.length === 0) return null;
    const lastSelection = selections[selections.length - 1];
    return mappings.find(m => 
      m.sheet === selectedSheet &&
      m.startRow === lastSelection.start.row &&
      m.startCol === lastSelection.start.col &&
      m.endRow === lastSelection.end.row &&
      m.endCol === lastSelection.end.col
    ) || null;
  }, [selections, mappings, selectedSheet]);

  // Step 5: Check if current cell has a reference
  const hasReference = useCallback((): boolean => {
    if (selections.length === 0) return false;
    const lastSelection = selections[selections.length - 1];
    return references.some(r => 
      r.sheet === selectedSheet &&
      r.startRow === lastSelection.start.row &&
      r.startCol === lastSelection.start.col &&
      r.endRow === lastSelection.end.row &&
      r.endCol === lastSelection.end.col
    );
  }, [selections, references, selectedSheet]);

  // Step 9: Get current reference for notes editing
  const getCurrentReference = useCallback((): RangeEvidence | null => {
    if (selections.length === 0) return null;
    const lastSelection = selections[selections.length - 1];
    return references.find(r => 
      r.sheet === selectedSheet &&
      r.startRow === lastSelection.start.row &&
      r.startCol === lastSelection.start.col &&
      r.endRow === lastSelection.end.row &&
      r.endCol === lastSelection.end.col
    ) || null;
  }, [selections, references, selectedSheet]);

  // Step 5: Dialog states (will be used in later steps)
  const [isCreateMappingDialogOpen, setIsCreateMappingDialogOpen] = useState(false);
  const [isEditMappingDialogOpen, setIsEditMappingDialogOpen] = useState(false);
  const [isDeleteMappingDialogOpen, setIsDeleteMappingDialogOpen] = useState(false);
  const [isDeleteReferenceDialogOpen, setIsDeleteReferenceDialogOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<RangeEvidence | null>(null);
  const [isDeletingReference, setIsDeletingReference] = useState(false);
  const [isAddReferenceDialogOpen, setIsAddReferenceDialogOpen] = useState(false);
  const [isAddNotesDialogOpen, setIsAddNotesDialogOpen] = useState(false);

  // Step 6: Create mapping dialog state
  const [mappingColor, setMappingColor] = useState<string>('#FFEB3B'); // Default yellow
  const [mappingNotes, setMappingNotes] = useState<string>('');
  const [isCreatingMapping, setIsCreatingMapping] = useState(false);
  
  // Step 7: Edit mapping dialog state
  const [editingMapping, setEditingMapping] = useState<RangeEvidence | null>(null);
  const [editMappingColor, setEditMappingColor] = useState<string>('#FFEB3B');
  const [editMappingNotes, setEditMappingNotes] = useState<string>('');
  const [isUpdatingMapping, setIsUpdatingMapping] = useState(false);
  const [isDeletingMapping, setIsDeletingMapping] = useState(false);
  
  // Step 8: Create reference dialog state
  const [referenceNotes, setReferenceNotes] = useState<string>('');
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [isCreatingReference, setIsCreatingReference] = useState(false);
  
  // Step 9: Notes dialog state
  const [notesText, setNotesText] = useState<string>('');
  const [editingNotesFor, setEditingNotesFor] = useState<'mapping' | 'reference' | null>(null);
  const [editingNotesEvidence, setEditingNotesEvidence] = useState<RangeEvidence | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeletingNotes, setIsDeletingNotes] = useState(false);
  
  const { toast } = useToast();

  // Step 5: Placeholder handlers (will be implemented in Steps 6-9)
  const handleCreateMapping = () => {
    // Reset form when opening
    setMappingColor('#FFEB3B');
    setMappingNotes('');
    setIsCreateMappingDialogOpen(true);
  };
  // Step 7: Handle edit mapping (populate form with current mapping data)
  const handleEditMapping = () => {
    const currentMapping = getCurrentMapping();
    if (currentMapping) {
      setEditingMapping(currentMapping);
      setEditMappingColor(currentMapping.color || '#FFEB3B');
      setEditMappingNotes(currentMapping.notes || '');
      setIsEditMappingDialogOpen(true);
    }
  };

  // Step 7: Handle delete mapping
  const handleDeleteMapping = () => {
    const currentMapping = getCurrentMapping();
    if (currentMapping) {
      setEditingMapping(currentMapping);
      setIsDeleteMappingDialogOpen(true);
    }
  };
  // Step 8: Handle add reference (reset form when opening)
  const handleAddReference = () => {
    setReferenceNotes('');
    setReferenceFiles([]);
    setIsAddReferenceDialogOpen(true);
  };
  // Step 9: Handle add/edit notes (populate form with existing notes if available)
  const handleAddNotes = () => {
    const currentMapping = getCurrentMapping();
    const currentReference = getCurrentReference();
    
    // Priority: mapping > reference
    if (currentMapping) {
      setEditingNotesFor('mapping');
      setEditingNotesEvidence(currentMapping);
      setNotesText(currentMapping.notes || '');
    } else if (currentReference) {
      setEditingNotesFor('reference');
      setEditingNotesEvidence(currentReference);
      setNotesText(currentReference.notes || '');
    } else {
      // No mapping or reference exists, create a mapping with notes
      setEditingNotesFor('mapping');
      setEditingNotesEvidence(null);
      setNotesText('');
    }
    
    setIsAddNotesDialogOpen(true);
  };

  // Step 6: Handle create mapping
  const handleCreateMappingSubmit = useCallback(async () => {
    if (selections.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a cell range first',
      });
      return;
    }

    const lastSelection = selections[selections.length - 1];
    
    setIsCreatingMapping(true);
    try {
      const mappingData: CreateRangeEvidenceRequest = {
        type: 'mapping',
        color: mappingColor || null,
        sheet: selectedSheet,
        startRow: lastSelection.start.row,
        startCol: lastSelection.start.col,
        endRow: lastSelection.end.row,
        endCol: lastSelection.end.col,
        notes: mappingNotes.trim() || null,
      };

      await createRangeEvidence(workbookId, mappingData);
      
      // Refresh mappings
      if (mappingsRefetchRef.current) {
        await mappingsRefetchRef.current();
      }
      
      toast({
        title: 'Success',
        description: 'Mapping created successfully',
      });
      
      setIsCreateMappingDialogOpen(false);
      setMappingColor('#FFEB3B');
      setMappingNotes('');
    } catch (error: any) {
      console.error('Error creating mapping:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to create mapping',
      });
    } finally {
      setIsCreatingMapping(false);
    }
  }, [selections, selectedSheet, mappingColor, mappingNotes, workbookId, toast]);

  // Step 7: Handle update mapping
  const handleUpdateMappingSubmit = useCallback(async () => {
    if (!editingMapping) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No mapping selected for editing',
      });
      return;
    }

    setIsUpdatingMapping(true);
    try {
      const updateData: UpdateRangeEvidenceRequest = {
        color: editMappingColor || null,
        notes: editMappingNotes.trim() || null,
      };

      await updateRangeEvidence(workbookId, editingMapping.id, updateData);
      
      // Refresh mappings
      if (mappingsRefetchRef.current) {
        await mappingsRefetchRef.current();
      }
      
      toast({
        title: 'Success',
        description: 'Mapping updated successfully',
      });
      
      setIsEditMappingDialogOpen(false);
      setEditingMapping(null);
      setEditMappingColor('#FFEB3B');
      setEditMappingNotes('');
    } catch (error: any) {
      console.error('Error updating mapping:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update mapping',
      });
    } finally {
      setIsUpdatingMapping(false);
    }
  }, [editingMapping, editMappingColor, editMappingNotes, workbookId, toast]);

  // Step 7: Handle delete mapping confirmation
  const handleDeleteMappingConfirm = useCallback(async () => {
    if (!editingMapping) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No mapping selected for deletion',
      });
      return;
    }

    setIsDeletingMapping(true);
    try {
      await deleteRangeEvidence(workbookId, editingMapping.id);
      
      // Refresh mappings
      if (mappingsRefetchRef.current) {
        await mappingsRefetchRef.current();
      }
      
      toast({
        title: 'Success',
        description: 'Mapping deleted successfully',
      });
      
      setIsDeleteMappingDialogOpen(false);
      setEditingMapping(null);
    } catch (error: any) {
      console.error('Error deleting mapping:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to delete mapping',
      });
    } finally {
      setIsDeletingMapping(false);
    }
  }, [editingMapping, workbookId, toast]);

  // Get evidence folder ID for file uploads
  const { data: evidenceFolderData } = useQuery({
    queryKey: ['engagement-evidence-folder', engagementId],
    queryFn: async () => {
      if (!engagementId) return null;
      try {
        const response = await apiGet<{ data: { folder: { id: string } } }>(
          endPoints.ENGAGEMENTS.EVIDENCE_FOLDER(engagementId)
        );
        return response.data || response;
      } catch (error: any) {
        console.error('Error fetching evidence folder:', error);
        return null;
      }
    },
    enabled: !!engagementId,
    retry: 2,
  });

  const evidenceFolderId = evidenceFolderData?.folder?.id || (evidenceFolderData as any)?.id;

  // Step 8: Handle create reference
  const handleCreateReferenceSubmit = useCallback(async () => {
    if (selections.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a cell range first',
      });
      return;
    }

    const lastSelection = selections[selections.length - 1];
    
    setIsCreatingReference(true);
    try {
      // Step 1: Upload files and create evidence records (if files are provided)
      const evidenceIds: string[] = [];
      
      console.log('Creating reference - initial check:', {
        referenceFilesCount: referenceFiles.length,
        evidenceFolderId,
        classificationId,
        classification,
        hasFiles: referenceFiles.length > 0,
        hasFolder: !!evidenceFolderId,
        hasClassificationId: !!classificationId,
      });
      
      // Check if classificationId is missing but we have files to upload
      if (referenceFiles.length > 0 && !classificationId) {
        toast({
          variant: 'destructive',
          title: 'Classification ID Missing',
          description: 'Cannot create evidence files without a classification ID. Please navigate from the classification view to ensure the classification ID is available.',
        });
        setIsCreatingReference(false);
        return;
      }
      
      if (referenceFiles.length > 0 && evidenceFolderId && classificationId) {
        for (const file of referenceFiles) {
          try {
            // Upload file to evidence folder
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folderId', evidenceFolderId);

            const uploadResponse = await apiPostFormData<{ data: { id: string; file_name: string; url: string } }>(
              endPoints.LIBRARY.FILE_UPLOAD,
              formData
            );

            const uploadedFile = uploadResponse.data || uploadResponse;
            const fileId = uploadedFile.id;

            // Create evidence record
            if (!classificationId) {
              throw new Error('Classification ID is required to create evidence. Please navigate from the classification view.');
            }
            
            const evidenceResponse = await apiPost<{ data: { id: string } }>(
              endPoints.AUDIT.CREATE_EVIDENCE,
              {
                fileId,
                classificationId: classificationId, // Must be a UUID
              }
            );

            const evidence = evidenceResponse.data || evidenceResponse;
            console.log('Created evidence:', evidence);
            console.log('Evidence ID:', evidence.id);
            evidenceIds.push(evidence.id);
          } catch (fileError: any) {
            console.error('Error uploading file:', fileError);
            toast({
              variant: 'destructive',
              title: 'File Upload Error',
              description: `Failed to upload ${file.name}: ${fileError?.message || 'Unknown error'}`,
            });
          }
        }
      }

      // Step 2: Create reference RangeEvidence
      const referenceData: CreateRangeEvidenceRequest = {
        type: 'reference',
        color: '#4CAF50', // Default green for references
        sheet: selectedSheet,
        startRow: lastSelection.start.row,
        startCol: lastSelection.start.col,
        endRow: lastSelection.end.row,
        endCol: lastSelection.end.col,
        notes: referenceNotes.trim() || null,
      };

      const createdReference = await createRangeEvidence(workbookId, referenceData);
      console.log('Created reference:', createdReference);
      console.log('Evidence IDs to link:', evidenceIds);
      console.log('Will link evidence files?', evidenceIds.length > 0);

      // Step 3: Link evidence files to the range evidence (if any were uploaded)
      if (evidenceIds.length > 0) {
        try {
          console.log('Linking evidence files:', {
            workbookId,
            rangeEvidenceId: createdReference.id,
            evidenceIds,
            evidenceIdsCount: evidenceIds.length,
          });
          const linkResponse = await apiPost(
            endPoints.AUDIT.ATTACH_EVIDENCE_TO_RANGE_EVIDENCE(workbookId, createdReference.id),
            { evidenceIds }
          );
          console.log('Evidence link response:', linkResponse);
          
          // Immediately fetch the reference again to verify the links were created
          const verifyResponse = await apiGet<{ data: RangeEvidence }>(
            endPoints.AUDIT.GET_RANGE_EVIDENCE(workbookId, createdReference.id)
          );
          const verifiedReference = verifyResponse.data || verifyResponse;
          console.log('Verified reference after linking:', verifiedReference);
          console.log('Verified evidences:', verifiedReference.evidences);
        } catch (linkError: any) {
          console.error('Error linking evidence files:', linkError);
          toast({
            variant: 'destructive',
            title: 'Warning',
            description: 'Reference created but failed to link some files. Please try attaching them again.',
          });
        }
      }
      
      // Refresh references
      if (referencesRefetchRef.current) {
        await referencesRefetchRef.current();
      }
      
      toast({
        title: 'Success',
        description: `Reference created successfully${evidenceIds.length > 0 ? ` with ${evidenceIds.length} file(s)` : ''}`,
      });
      
      setIsAddReferenceDialogOpen(false);
      setReferenceNotes('');
      setReferenceFiles([]);
    } catch (error: any) {
      console.error('Error creating reference:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to create reference',
      });
    } finally {
      setIsCreatingReference(false);
    }
  }, [selections, selectedSheet, referenceNotes, referenceFiles, workbookId, engagementId, classificationId, evidenceFolderId, toast]);

  // Step 8: Handle delete reference confirmation
  const handleDeleteReferenceConfirm = useCallback(async () => {
    if (!editingReference) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No reference selected for deletion',
      });
      return;
    }

    setIsDeletingReference(true);
    try {
      await deleteRangeEvidence(workbookId, editingReference.id);
      
      // Refresh references
      if (referencesRefetchRef.current) {
        await referencesRefetchRef.current();
      }
      
      toast({
        title: 'Success',
        description: 'Reference deleted successfully',
      });
      
      setIsDeleteReferenceDialogOpen(false);
      setEditingReference(null);
      // Also close view dialog if open
      setIsViewReferenceDialogOpen(false);
      setViewingReference(null);
    } catch (error: any) {
      console.error('Error deleting reference:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to delete reference',
      });
    } finally {
      setIsDeletingReference(false);
    }
  }, [editingReference, workbookId, toast]);

  // Step 8: Handle file selection for reference
  const handleReferenceFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setReferenceFiles((prev) => [...prev, ...files]);
    }
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  }, []);

  // Step 8: Remove file from reference files list
  const handleRemoveReferenceFile = useCallback((index: number) => {
    setReferenceFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Step 9: Handle save notes
  const handleSaveNotes = useCallback(async () => {
    if (selections.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a cell range first',
      });
      return;
    }

    const lastSelection = selections[selections.length - 1];
    setIsSavingNotes(true);

    try {
      // If editing existing evidence, update it
      if (editingNotesEvidence) {
        const updateData: UpdateRangeEvidenceRequest = {
          notes: notesText.trim() || null,
        };
        await updateRangeEvidence(workbookId, editingNotesEvidence.id, updateData);
        
        // Refresh the appropriate list
        if (editingNotesFor === 'mapping' && mappingsRefetchRef.current) {
          await mappingsRefetchRef.current();
        } else if (editingNotesFor === 'reference' && referencesRefetchRef.current) {
          await referencesRefetchRef.current();
        }
        
        toast({
          title: 'Success',
          description: 'Notes updated successfully',
        });
      } else {
        // Create new mapping with notes (since no mapping/reference exists)
        const mappingData: CreateRangeEvidenceRequest = {
          type: 'mapping',
          color: '#FFEB3B', // Default yellow
          sheet: selectedSheet,
          startRow: lastSelection.start.row,
          startCol: lastSelection.start.col,
          endRow: lastSelection.end.row,
          endCol: lastSelection.end.col,
          notes: notesText.trim() || null,
        };

        await createRangeEvidence(workbookId, mappingData);
        
        // Refresh mappings
        if (mappingsRefetchRef.current) {
          await mappingsRefetchRef.current();
        }
        
        toast({
          title: 'Success',
          description: 'Notes saved successfully',
        });
      }
      
      setIsAddNotesDialogOpen(false);
      setNotesText('');
      setEditingNotesFor(null);
      setEditingNotesEvidence(null);
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to save notes',
      });
    } finally {
      setIsSavingNotes(false);
    }
  }, [selections, selectedSheet, notesText, editingNotesEvidence, editingNotesFor, workbookId, toast]);

  // Step 9: Handle delete notes
  const handleDeleteNotes = useCallback(async () => {
    if (!editingNotesEvidence) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No notes to delete',
      });
      return;
    }

    setIsDeletingNotes(true);

    try {
      const updateData: UpdateRangeEvidenceRequest = {
        notes: null,
      };
      
      await updateRangeEvidence(workbookId, editingNotesEvidence.id, updateData);
      
      // Refresh the appropriate list
      if (editingNotesFor === 'mapping' && mappingsRefetchRef.current) {
        await mappingsRefetchRef.current();
      } else if (editingNotesFor === 'reference' && referencesRefetchRef.current) {
        await referencesRefetchRef.current();
      }
      
      toast({
        title: 'Success',
        description: 'Notes deleted successfully',
      });
      
      setIsAddNotesDialogOpen(false);
      setNotesText('');
      setEditingNotesFor(null);
      setEditingNotesEvidence(null);
    } catch (error: any) {
      console.error('Error deleting notes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to delete notes',
      });
    } finally {
      setIsDeletingNotes(false);
    }
  }, [editingNotesEvidence, editingNotesFor, workbookId, toast]);

  // Auto-scroll during cell selection
  useEffect(() => {
    // Stop scrolling if not selecting (matching REFERENCE-PORTAL - don't check isMouseDownRef here)
    if (!isSelecting || !spreadsheetContainerRef.current || !gridApiRef.current) {
      // Stop scrolling if not selecting
      if (autoScrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollAnimationFrameRef.current);
        autoScrollAnimationFrameRef.current = null;
      }
      return;
    }

    // Helper function to find the actual scrollable container within AG Grid
    // Matching REFERENCE-PORTAL exactly
    const getScrollableContainer = (): HTMLElement | null => {
      if (!spreadsheetContainerRef.current) return null;
      
      // AG Grid uses .ag-body-viewport as the main scrollable container for rows
      // And .ag-center-cols-viewport for columns if virtualized
      let viewport = spreadsheetContainerRef.current.querySelector('.ag-body-viewport') as HTMLElement;
      if (viewport) return viewport;
      
      // Fallback check for horizontal viewport
      viewport = spreadsheetContainerRef.current.querySelector('.ag-center-cols-viewport') as HTMLElement;
      if (viewport) return viewport;

      // Last resort: outer container
      return spreadsheetContainerRef.current as HTMLElement;
    };

    // Helper function to get cell data at a specific screen coordinate
    // This works even if the mouse is technically outside the grid bounds or over scrollbars
    const getCellAtPosition = (x: number, y: number): { row: number; col: number } | null => {
      try {
        const elementAtPoint = document.elementFromPoint(x, y);
        if (!elementAtPoint) return null;

        // Traverse up to find the AG Grid cell
        const agCell = elementAtPoint.closest('.ag-cell') as HTMLElement;
        if (!agCell) return null;

        // Extract row index from the cell's attribute
        const rowIndexAttr = agCell.getAttribute('row-index');
        if (rowIndexAttr === null) return null;

        // Ensure we have the row node from AG Grid to get correct Excel coordinates
        const rowNode = gridApiRef.current.getRowNode(rowIndexAttr);
        if (!rowNode || !rowNode.data || rowNode.data._rowIndex === undefined) return null;

        const rowIndex = rowNode.data._rowIndex;

        // Get column ID from the cell's attribute
        const colId = agCell.getAttribute('col-id');
        if (!colId || colId === '_rowIndex' || colId === '_excelRowNumber') return null;

        // Convert column ID (e.g., "A", "B") to zero-based index
        const excelColIndex = excelColToZeroIndex(colId);
        if (excelColIndex === null || excelColIndex === undefined) return null;

        return { row: rowIndex, col: excelColIndex };
      } catch (error) {
        // Silently fail (expected when mouse is over floating UI or scrollbars)
        return null;
      }
    };

    // Helper to update selection state based on current mouse position
    const updateSelectionFromMousePosition = (mouseX: number, mouseY: number) => {
      // Don't update selection if anchor is not set (matching REFERENCE-PORTAL - they don't check isMouseDownRef here)
      if (!anchorSelectionStart.current) return;

      const cell = getCellAtPosition(mouseX, mouseY);
      
      // Only update state if we actually found a cell and it's different from the last one
      if (!cell) return;

      const { row, col } = cell;
      
      if (lastUpdatedCellRef.current && 
          lastUpdatedCellRef.current.row === row && 
          lastUpdatedCellRef.current.col === col) {
        return;
      }

      lastUpdatedCellRef.current = cell;

      // Update the React state to extend the selection
      setSelections(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = updated[updated.length - 1];
        
        // Update the 'end' coordinate of the current selection
        updated[updated.length - 1] = {
          ...last,
          end: { row, col }
        };
        return updated;
      });
    };

    // Configuration for scroll behavior (matching REFERENCE-PORTAL exactly)
    const maxScrollDistance = 100; // Distance where MAX speed is reached
    const minScrollSpeed = 3; // Pixels per frame
    const maxScrollSpeed = 30; // Pixels per frame (fast!)

    // The main animation loop
    const smoothScroll = () => {
      // Stop if not selecting anymore (the loop should continue as long as isSelecting is true)
      if (!isSelecting) {
        autoScrollAnimationFrameRef.current = null;
        return;
      }

      // If mouse is not down, just continue the loop without scrolling
      // This allows the loop to restart scrolling when mouse goes down again
      if (!isMouseDownRef.current) {
        // Continue the loop but don't scroll
        autoScrollAnimationFrameRef.current = requestAnimationFrame(smoothScroll);
        return;
      }

      const container = getScrollableContainer();
      if (!container) {
        // Retry next frame if container wasn't found yet
        autoScrollAnimationFrameRef.current = requestAnimationFrame(smoothScroll);
        return;
      }

      const mouseX = currentMousePositionRef.current.x;
      const mouseY = currentMousePositionRef.current.y;
      const rect = container.getBoundingClientRect();

      // Determine if we can scroll in each direction
      const canScrollHorizontally = container.scrollWidth > container.clientWidth;
      const canScrollVertically = container.scrollHeight > container.clientHeight;

      let scrollX = 0;
      let scrollY = 0;
      let needsScroll = false;

      // --- HORIZONTAL SCROLLING ---
      if (canScrollHorizontally) {
        // Check Right Edge (mouse outside right edge) - matching REFERENCE-PORTAL exactly
        if (mouseX > rect.right) {
          const dist = Math.min(mouseX - rect.right, maxScrollDistance);
          const speedFactor = Math.min(1, dist / maxScrollDistance);
          scrollX = minScrollSpeed + (maxScrollSpeed - minScrollSpeed) * Math.pow(speedFactor, 0.8); // Slightly eased curve
          needsScroll = true;
        }
        // Check Left Edge (mouse outside left edge) - matching REFERENCE-PORTAL exactly
        else if (mouseX < rect.left) {
          const dist = Math.min(rect.left - mouseX, maxScrollDistance);
          const speedFactor = Math.min(1, dist / maxScrollDistance);
          scrollX = -(minScrollSpeed + (maxScrollSpeed - minScrollSpeed) * Math.pow(speedFactor, 0.8));
          needsScroll = true;
        }
      }

      // --- VERTICAL SCROLLING ---
      if (canScrollVertically) {
        // Check Bottom Edge (mouse outside bottom edge) - matching REFERENCE-PORTAL exactly
        // REFERENCE-PORTAL doesn't prevent scrolling over bottom header - it scrolls anyway
        if (mouseY > rect.bottom) {
          const dist = Math.min(mouseY - rect.bottom, maxScrollDistance);
          const speedFactor = Math.min(1, dist / maxScrollDistance);
          scrollY = minScrollSpeed + (maxScrollSpeed - minScrollSpeed) * Math.pow(speedFactor, 0.8);
          needsScroll = true;
        }
        // Check Top Edge (mouse outside top edge) - matching REFERENCE-PORTAL exactly
        else if (mouseY < rect.top) {
          const dist = Math.min(rect.top - mouseY, maxScrollDistance);
          const speedFactor = Math.min(1, dist / maxScrollDistance);
          scrollY = -(minScrollSpeed + (maxScrollSpeed - minScrollSpeed) * Math.pow(speedFactor, 0.8));
          needsScroll = true;
        }
      }

      // Apply scrolling if needed
      if (needsScroll) {
        // 1. Scroll the container
        container.scrollBy({
          left: scrollX,
          top: scrollY,
          behavior: 'auto' // 'auto' allows instant scrolling per frame
        });

        // 2. Update Selection
        // We use requestAnimationFrame here to ensure the DOM has scrolled 
        // before we try to detect the cell at the new mouse position
        requestAnimationFrame(() => {
          updateSelectionFromMousePosition(mouseX, mouseY);
        });
      } else {
        // Even if not scrolling, update selection if mouse is moving inside grid
        // This ensures selection follows mouse correctly during normal drag
        updateSelectionFromMousePosition(mouseX, mouseY);
      }

      // Schedule next frame to keep the loop running (matching REFERENCE-PORTAL)
      // This ensures auto-scroll continues even when mouse is outside container
      // The loop continues as long as isSelecting is true
      autoScrollAnimationFrameRef.current = requestAnimationFrame(smoothScroll);
    };

    // Start the loop when isSelecting becomes true
    // The loop will continue running and check isMouseDownRef inside
    autoScrollAnimationFrameRef.current = requestAnimationFrame(smoothScroll);

    return () => {
      if (autoScrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollAnimationFrameRef.current);
        autoScrollAnimationFrameRef.current = null;
      }
    };
  }, [
    isSelecting, 
    anchorSelectionStart,
    setSelections,
    selectedSheet
  ]);

  // Column definitions for AG Grid
  const gridColumns = useMemo(() => {
    if (!currentSheetData || currentSheetData.length === 0) return [];
    
    // Calculate max columns from data, but ensure minimum 23 columns (up to W)
    const dataMaxCols = Math.max(...currentSheetData.map(row => row.length), 0);
    const maxCols = Math.max(23, dataMaxCols); // Minimum 23 columns (A to W)
    const columns: any[] = [
      {
        headerName: '#',
        field: '_excelRowNumber',
        width: 60,
        pinned: 'left',
        resizable: false,
        suppressMovable: true,
        lockPosition: true,
        cellClass: 'bg-gray-100 font-semibold text-center',
        sortable: false,
        filter: false,
      }
    ];
    
    // Add data columns
    for (let colIndex = 0; colIndex < maxCols; colIndex++) {
      const colLetter = zeroIndexToExcelCol(colIndex);
      
      columns.push({
        headerName: colLetter,
        field: colLetter,
        colId: colLetter,
        width: 120,
        sortable: false, // Disable sorting for Excel-like behavior
        filter: false, // Disable filtering for Excel-like behavior
        resizable: true,
        editable: false,
        cellRenderer: cellRenderer, // Custom renderer for selection
        suppressSizeToFit: true, // Prevent auto-sizing that can create gaps
      });
    }
    
    return columns;
  }, [currentSheetData, cellRenderer]);

  // Cleanup hover menu on unmount (must be before any conditional returns)
  useEffect(() => {
    return () => {
      if (hoverMenuTimeoutRef.current) {
        clearTimeout(hoverMenuTimeoutRef.current);
      }
    };
  }, []);

  // Hide hover menu when clicking outside (must be before any conditional returns)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hoverMenuRef.current && !hoverMenuRef.current.contains(event.target as Node)) {
        if (!isMenuHoveredRef.current) {
          setHoverMenu(prev => ({ ...prev, visible: false }));
        }
      }
    };

    if (hoverMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [hoverMenu.visible]);

  // Reset hover state when dialogs close
  useEffect(() => {
    if (!isViewMappingDialogOpen && !isViewReferenceDialogOpen) {
      // Reset menu hover state when dialogs close
      isMenuHoveredRef.current = false;
      // Clear any pending timeout
      if (hoverMenuTimeoutRef.current) {
        clearTimeout(hoverMenuTimeoutRef.current);
        hoverMenuTimeoutRef.current = null;
      }
    }
  }, [isViewMappingDialogOpen, isViewReferenceDialogOpen]);

  // Fetch latest reference data when dialog opens
  useEffect(() => {
    if (isViewReferenceDialogOpen && viewingReference?.id) {
      // Refetch the reference to get latest data with evidences
      apiGet<{ data: RangeEvidence }>(
        endPoints.AUDIT.GET_RANGE_EVIDENCE(workbookId, viewingReference.id)
      )
        .then((response) => {
          const latestReference = response.data || response;
          console.log('Fetched latest reference:', latestReference);
          console.log('Fetched latest reference evidences:', latestReference.evidences);
          console.log('Full response:', JSON.stringify(latestReference, null, 2));
          setViewingReference(latestReference);
        })
        .catch((error) => {
          console.error('Error fetching reference details:', error);
        });
    }
  }, [isViewReferenceDialogOpen, viewingReference?.id, workbookId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading workbook data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Failed to load workbook</p>
          <p className="text-sm text-gray-500">
            {error instanceof Error ? error.message : 'An error occurred while loading the workbook'}
          </p>
        </div>
      </div>
    );
  }

  if (!sheetDataResponse || !sheetDataResponse.sheetNames || sheetDataResponse.sheetNames.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-gray-500">No sheets found in workbook</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Header */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              title="Go back"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">{workbookName || 'Workbook'}</h2>
          </div>
        </div>

        {/* Action Buttons on Right */}
        <div className="flex items-center gap-2">
          {/* Sheet Selection Dropdown */}
          <div className="relative">
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="px-3 py-1.5 pr-8 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
            >
              {sheetDataResponse?.sheetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          
          {/* Sheet List Dropdown */}
          <DropdownMenu open={isSheetListOpen} onOpenChange={setIsSheetListOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 flex items-center gap-1.5 text-gray-700"
                title="List all sheets"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <List size={14} />
                <span>List</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 max-h-[400px] overflow-y-auto !z-[9999]"
              style={{ zIndex: 9999 }}
            >
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>All Sheets ({sheetDataResponse?.sheetNames?.length || 0})</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Select All Checkbox */}
              <div className="px-2 py-1.5 flex items-center space-x-2 hover:bg-gray-100 rounded-sm cursor-pointer">
                <Checkbox
                  id="select-all-sheets"
                  checked={areAllSheetsSelected}
                  onCheckedChange={handleSelectAllSheets}
                  onClick={(e) => e.stopPropagation()}
                />
                <label
                  htmlFor="select-all-sheets"
                  className="text-sm font-medium cursor-pointer flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAllSheets(!areAllSheetsSelected);
                  }}
                >
                  Select All
                </label>
              </div>

              <DropdownMenuSeparator />

              {/* Sheet List with Checkboxes */}
              {sheetDataResponse?.sheetNames && sheetDataResponse.sheetNames.length > 0 ? (
                [...sheetDataResponse.sheetNames].sort().map((sheet) => (
                  <div
                    key={sheet}
                    className="px-2 py-1.5 flex items-center space-x-2 hover:bg-gray-100 rounded-sm cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSheetChange(sheet);
                    }}
                  >
                    <Checkbox
                      id={`sheet-${sheet}`}
                      checked={selectedSheets.has(sheet)}
                      onCheckedChange={(checked) => {
                        handleSheetToggle(sheet, checked as boolean);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label
                      htmlFor={`sheet-${sheet}`}
                      className="text-sm cursor-pointer flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSheetToggle(sheet, !selectedSheets.has(sheet));
                      }}
                    >
                      {sheet}
                    </label>
                    {sheet === selectedSheet && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  No sheets available
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="px-3 py-1.5 border border-blue-500 rounded-md text-sm bg-white hover:bg-blue-50 flex items-center gap-1.5 text-blue-600 font-medium"
            title="Open in Excel"
            onClick={() => {
              if (workbookWebUrl) {
                window.open(workbookWebUrl, '_blank');
              } else {
                toast({
                  variant: 'destructive',
                  title: 'No Web URL',
                  description: 'This workbook does not have a web URL to open.',
                });
              }
            }}
            disabled={!workbookWebUrl}
          >
            <FileSpreadsheet size={14} />
            <span>Open Excel</span>
          </button>
          <button
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 flex items-center gap-1.5 text-gray-700"
            title="Reload workbook"
            onClick={() => {
              window.location.reload();
            }}
          >
            <RefreshCw size={14} />
            <span>Reload</span>
          </button>
          <button
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 flex items-center gap-1.5 text-gray-700"
            title="View mappings"
            onClick={() => setIsMappingsDialogOpen(true)}
          >
            <Code size={14} />
            <span>Mappings</span>
          </button>
        </div>
      </div>

      {/* Formula Bar - Selected Area Display */}
      <div className="border-b border-gray-200 px-4 py-1.5 bg-white flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-[100px]">
          <span className="text-sm font-mono text-gray-700 font-medium">{getSelectedRangeString() || ''}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 border-l border-gray-300 pl-2">
          <span className="text-sm text-gray-600 font-medium">fx</span>
          <span className="text-sm text-gray-700 flex-1">{getSelectedCellValue()}</span>
        </div>
      </div>

      {/* AG Grid */}
      <div 
        className="flex-1 overflow-hidden p-4" 
        ref={spreadsheetContainerRef}
        onContextMenu={(e) => {
          // Prevent browser context menu on the grid container
          // But don't stop propagation so AG Grid's onCellContextMenu can handle it
          e.preventDefault();
        }}
      >
        <style>{`
          /* Kill the focus border */
          .ag-theme-alpine .ag-cell-focus, 
          .ag-theme-alpine .ag-cell-no-focus {
            border: none !important;
            outline: none !important;
          }
          
          /* Disable AG Grid's default selection styles */
          .ag-theme-alpine .ag-row-selected,
          .ag-theme-alpine .ag-cell-range-selected,
          .ag-theme-alpine .ag-cell-range-selected-1,
          .ag-theme-alpine .ag-cell-range-selected-2,
          .ag-theme-alpine .ag-cell-range-selected-3,
          .ag-theme-alpine .ag-cell-range-selected-4 {
            background-color: transparent !important;
            border: none !important;
          }
          
          /* All cells get borders - matching REFERENCE-PORTAL */
          .ag-theme-alpine .ag-cell {
            transition: background-color 0.08s ease-out, border-color 0.08s ease-out !important;
            will-change: background-color, border-color;
            overflow: hidden !important;
            border-right: 1px solid #e2e8f0 !important;
            border-bottom: 1px solid #e2e8f0 !important;
            border-top: none !important;
            border-left: none !important;
            padding-left: 6px !important;
            padding-right: 6px !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            white-space: nowrap !important;
            text-overflow: ellipsis !important;
          }
          
          /* First data column (A) gets left border */
          .ag-theme-alpine .ag-cell[col-id="A"] {
            border-left: 1px solid #e2e8f0 !important;
          }
          
          /* Row number column styling */
          .ag-theme-alpine .ag-cell[col-id="_excelRowNumber"] {
            border-right: 2px solid #ccc !important;
            border-bottom: 1px solid #e0e0e0 !important;
            border-top: none !important;
            border-left: none !important;
            background-color: #f5f5f5 !important;
            font-weight: 600;
            padding-left: 6px !important;
            padding-right: 6px !important;
            margin: 0 !important;
          }
          
          /* Header cells */
          .ag-theme-alpine .ag-header-cell {
            border-right: 1px solid #e2e8f0 !important;
            border-bottom: 1px solid #e2e8f0 !important;
            border-top: none !important;
            border-left: none !important;
            background-color: #f9fafb !important;
            font-weight: 600 !important;
            padding-left: 6px !important;
            padding-right: 6px !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
          
          /* First header column (A) gets left border */
          .ag-theme-alpine .ag-header-cell[col-id="A"] {
            border-left: 1px solid #e2e8f0 !important;
          }
          
          /* Row number header */
          .ag-theme-alpine .ag-header-cell[col-id="_excelRowNumber"] {
            border-right: 2px solid #ccc !important;
            border-bottom: 1px solid #e2e8f0 !important;
            border-top: none !important;
            border-left: none !important;
            background-color: #f3f4f6 !important;
            padding-left: 6px !important;
            padding-right: 6px !important;
            margin: 0 !important;
          }
          
          /* Remove gaps between columns completely */
          .ag-theme-alpine .ag-cell-wrapper {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Remove column gaps in AG Grid */
          .ag-theme-alpine .ag-header-cell,
          .ag-theme-alpine .ag-cell {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          /* Remove any spacing between columns */
          .ag-theme-alpine .ag-header-row,
          .ag-theme-alpine .ag-row {
            margin: 0 !important;
          }
          
          /* Remove spacing between columns at grid level */
          .ag-theme-alpine .ag-center-cols-container {
            gap: 0 !important;
          }
          
          /* Remove any default padding/margin that creates gaps */
          .ag-theme-alpine .ag-header-cell-label {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Remove padding from cell content */
          .ag-theme-alpine .ag-cell-value {
            padding: 0 !important;
            overflow: hidden !important;
            white-space: nowrap !important;
            text-overflow: ellipsis !important;
          }
          
          /* Ensure no gaps in column layout */
          .ag-theme-alpine .ag-header {
            overflow: visible !important;
          }
          
          /* Force columns to be exactly their width with no gaps */
          .ag-theme-alpine .ag-header-cell,
          .ag-theme-alpine .ag-cell {
            min-width: 0 !important;
            max-width: none !important;
          }
          
          /* Remove any flex gaps */
          .ag-theme-alpine .ag-header-row,
          .ag-theme-alpine .ag-row {
            display: flex !important;
            gap: 0 !important;
          }
          
          /* Ensure column widths are exact */
          .ag-theme-alpine .ag-center-cols-container {
            display: flex !important;
            gap: 0 !important;
          }
          
          /* Selected cell styling */
          .ag-theme-alpine .cell-selected {
            background-color: rgba(59, 130, 246, 0.1) !important;
          }
          
          /* Mapped cell styling */
          .ag-theme-alpine .cell-mapped {
            background-color: rgba(255, 235, 59, 0.2) !important;
          }
          
          /* Referenced cell styling */
          .ag-theme-alpine .cell-reference {
            background-color: rgba(76, 175, 80, 0.1) !important;
          }
          
          /* Hide vertical scrollbar */
          .ag-theme-alpine .ag-body-vertical-scroll {
            display: none !important;
          }
          
          .ag-theme-alpine .ag-body-vertical-scroll-viewport {
            display: none !important;
          }
          
          /* Hide scrollbar but keep scrolling functionality */
          .ag-theme-alpine .ag-body-viewport::-webkit-scrollbar {
            width: 0px;
            height: 0px;
            background: transparent;
          }
          
          .ag-theme-alpine .ag-body-viewport {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
          }
        `}</style>
        <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={gridData}
            columnDefs={gridColumns}
            defaultColDef={{
              resizable: true,
              sortable: false, // Excel-like: no sorting
              filter: false, // Excel-like: no filtering
              minWidth: 50,
              suppressSizeToFit: true, // CRITICAL: Prevent auto-sizing for manual column resizing
            }}
            suppressColumnVirtualisation={true}
            animateRows={false}
            pagination={false}
            domLayout="normal"
            suppressCellFocus={true}
            suppressRowHoverHighlight={true}
            rowHeight={28}
            theme="legacy"
            onGridReady={(params) => {
              gridApiRef.current = params.api;
            }}
            onCellMouseDown={onCellMouseDown}
            onCellMouseOver={onCellMouseOver}
            onCellContextMenu={onCellContextMenu}
            onColumnResized={onColumnResized}
          />
        </div>
      </div>
      
      {/* Bottom Header - Sheet Tabs */}
      <div 
        ref={bottomHeaderRef}
        className="border-t border-gray-200 bg-gray-50 px-2 py-1 flex items-center gap-1 shrink-0 overflow-x-auto"
      >
        {sheetDataResponse?.sheetNames && sheetDataResponse.sheetNames.length > 0 ? (
          sheetDataResponse.sheetNames.map((sheet) => (
            <button
              key={sheet}
              onClick={() => setSelectedSheet(sheet)}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                sheet === selectedSheet
                  ? 'bg-white border-t-2 border-l border-r border-gray-300 text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 border-t border-l border-r border-transparent'
              }`}
            >
              <FileSpreadsheet size={14} className={sheet === selectedSheet ? 'text-blue-600' : 'text-gray-500'} />
              <span>{sheet}</span>
            </button>
          ))
        ) : (
          <div className="px-3 py-1.5 text-sm text-gray-500">No sheets available</div>
        )}
      </div>

      {/* Step 5: Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-56 z-50 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Range display */}
          <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              {getSelectedRangeString()}
            </div>
          </div>

          {/* Mapping options */}
          {hasMapping() ? (
            <>
              <button
                onClick={() => {
                  handleEditMapping();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
              >
                <Edit size={14} />
                Edit Mapping
              </button>
              <button
                onClick={() => {
                  handleDeleteMapping();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete Mapping
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                handleCreateMapping();
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
            >
              <Link size={14} />
              Create Mapping
            </button>
          )}

          {/* Visual separation */}
          <div className="my-1 border-t border-gray-100" />

          {/* Reference options */}
          {!hasReference() ? (
            <button
              onClick={() => {
                handleAddReference();
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
            >
              <FilePlus size={14} />
              Add Reference Files
            </button>
          ) : (
            <button
              onClick={() => {
                const currentRef = getCurrentReference();
                if (currentRef) {
                  setEditingReference(currentRef);
                  setIsDeleteReferenceDialogOpen(true);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Delete Reference
            </button>
          )}

          {/* Notes option */}
          <button
            onClick={() => {
              handleAddNotes();
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 flex items-center gap-2"
          >
            <MessageSquare size={14} />
            {getCurrentMapping()?.notes || hasReference() ? 'View/Edit Notes' : 'Add Notes'}
          </button>
        </div>
      )}

      {/* Step 6: Create Mapping Dialog */}
      <Dialog open={isCreateMappingDialogOpen} onOpenChange={setIsCreateMappingDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Create Mapping</DialogTitle>
              <button
                onClick={() => setIsCreateMappingDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isCreatingMapping}
              >
                <X size={20} />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Selected Range Display */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <Label className="text-sm font-semibold text-gray-700 mb-1 block">Selected Range:</Label>
              <p className="text-sm text-gray-600 font-mono">{getSelectedRangeString()}</p>
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <Label htmlFor="mapping-color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="mapping-color"
                  type="color"
                  value={mappingColor}
                  onChange={(e) => setMappingColor(e.target.value)}
                  className="h-10 w-20 cursor-pointer"
                  disabled={isCreatingMapping}
                />
                <Input
                  type="text"
                  value={mappingColor}
                  onChange={(e) => setMappingColor(e.target.value)}
                  placeholder="#FFEB3B"
                  className="flex-1 font-mono"
                  disabled={isCreatingMapping}
                />
              </div>
              <p className="text-xs text-gray-500">
                Choose a color to highlight this mapping in the spreadsheet
              </p>
              
              {/* Color Presets */}
              <div className="flex gap-2 mt-2">
                {['#FFEB3B', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setMappingColor(color)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      mappingColor === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                    disabled={isCreatingMapping}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="mapping-notes">Notes (Optional)</Label>
              <Textarea
                id="mapping-notes"
                placeholder="Add any notes or comments about this mapping..."
                value={mappingNotes}
                onChange={(e) => setMappingNotes(e.target.value)}
                className="min-h-[100px]"
                disabled={isCreatingMapping}
              />
              <p className="text-xs text-gray-500">
                Add notes to provide context or additional information about this mapping
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateMappingDialogOpen(false);
                setMappingColor('#FFEB3B');
                setMappingNotes('');
              }}
              disabled={isCreatingMapping}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMappingSubmit}
              disabled={isCreatingMapping || selections.length === 0}
            >
              {isCreatingMapping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Mapping'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Step 7: Edit Mapping Dialog */}
      <Dialog open={isEditMappingDialogOpen} onOpenChange={setIsEditMappingDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Mapping</DialogTitle>
              <button
                onClick={() => {
                  setIsEditMappingDialogOpen(false);
                  setEditingMapping(null);
                  setEditMappingColor('#FFEB3B');
                  setEditMappingNotes('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isUpdatingMapping}
              >
                <X size={20} />
              </button>
            </div>
          </DialogHeader>

          {editingMapping && (
            <>
              <div className="space-y-6 py-4">
                {/* Selected Range Display */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <Label className="text-sm font-semibold text-gray-700 mb-1 block">Mapping Range:</Label>
                  <p className="text-sm text-gray-600 font-mono">
                    {editingMapping.sheet}!{zeroIndexToExcelCol(editingMapping.startCol)}{editingMapping.startRow + 1}
                    {editingMapping.startRow !== editingMapping.endRow || editingMapping.startCol !== editingMapping.endCol
                      ? `:${zeroIndexToExcelCol(editingMapping.endCol)}${editingMapping.endRow + 1}`
                      : ''}
                  </p>
                </div>

                {/* Color Selection */}
                <div className="space-y-2">
                  <Label htmlFor="edit-mapping-color">Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="edit-mapping-color"
                      type="color"
                      value={editMappingColor}
                      onChange={(e) => setEditMappingColor(e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                      disabled={isUpdatingMapping}
                    />
                    <Input
                      type="text"
                      value={editMappingColor}
                      onChange={(e) => setEditMappingColor(e.target.value)}
                      placeholder="#FFEB3B"
                      className="flex-1 font-mono"
                      disabled={isUpdatingMapping}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Choose a color to highlight this mapping in the spreadsheet
                  </p>
                  
                  {/* Color Presets */}
                  <div className="flex gap-2 mt-2">
                    {['#FFEB3B', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditMappingColor(color)}
                        className={`w-8 h-8 rounded border-2 transition-all ${
                          editMappingColor === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                        disabled={isUpdatingMapping}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="edit-mapping-notes">Notes (Optional)</Label>
                  <Textarea
                    id="edit-mapping-notes"
                    placeholder="Add any notes or comments about this mapping..."
                    value={editMappingNotes}
                    onChange={(e) => setEditMappingNotes(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isUpdatingMapping}
                  />
                  <p className="text-xs text-gray-500">
                    Add notes to provide context or additional information about this mapping
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditMappingDialogOpen(false);
                    setEditingMapping(null);
                    setEditMappingColor('#FFEB3B');
                    setEditMappingNotes('');
                  }}
                  disabled={isUpdatingMapping}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateMappingSubmit}
                  disabled={isUpdatingMapping}
                >
                  {isUpdatingMapping ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Mapping'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 7: Delete Mapping Dialog */}
      <Dialog open={isDeleteMappingDialogOpen} onOpenChange={setIsDeleteMappingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Mapping</DialogTitle>
          </DialogHeader>

          {editingMapping && (
            <>
              <div className="py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete this mapping? This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <Label className="text-sm font-semibold text-gray-700 mb-1 block">Mapping Range:</Label>
                  <p className="text-sm text-gray-600 font-mono">
                    {editingMapping.sheet}!{zeroIndexToExcelCol(editingMapping.startCol)}{editingMapping.startRow + 1}
                    {editingMapping.startRow !== editingMapping.endRow || editingMapping.startCol !== editingMapping.endCol
                      ? `:${zeroIndexToExcelCol(editingMapping.endCol)}${editingMapping.endRow + 1}`
                      : ''}
                  </p>
                  {editingMapping.notes && (
                    <div className="mt-2">
                      <Label className="text-sm font-semibold text-gray-700 mb-1 block">Notes:</Label>
                      <p className="text-sm text-gray-600">{editingMapping.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteMappingDialogOpen(false);
                    setEditingMapping(null);
                  }}
                  disabled={isDeletingMapping}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteMappingConfirm}
                  disabled={isDeletingMapping}
                >
                  {isDeletingMapping ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Mapping'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Step 8: Add Reference Dialog */}
      <Dialog open={isAddReferenceDialogOpen} onOpenChange={setIsAddReferenceDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Add Reference Files</DialogTitle>
              <button
                onClick={() => {
                  setIsAddReferenceDialogOpen(false);
                  setReferenceNotes('');
                  setReferenceFiles([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isCreatingReference}
              >
                <X size={20} />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Selected Range Display */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <Label className="text-sm font-semibold text-gray-700 mb-1 block">Selected Range:</Label>
              <p className="text-sm text-gray-600 font-mono">{getSelectedRangeString()}</p>
            </div>

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label>Reference Files (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-green-500 hover:bg-green-50/50 transition-all">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3 text-green-600">
                  <UploadCloud size={20} />
                </div>
                <p className="text-sm font-medium text-green-600 mb-1">
                  Click to upload reference files <span className="text-gray-500 font-normal">or drag and drop</span>
                </p>
                <p className="text-xs text-gray-400 mb-3">All file types supported (max 10MB per file)</p>
                <input
                  type="file"
                  multiple
                  onChange={handleReferenceFileSelect}
                  className="hidden"
                  id="reference-file-input"
                  disabled={isCreatingReference}
                />
                <label
                  htmlFor="reference-file-input"
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select Files
                </label>
              </div>

              {/* Uploaded Files List */}
              {referenceFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">Selected Files:</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {referenceFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FilePlus size={16} className="text-gray-500 shrink-0" />
                          <span className="text-sm text-gray-700 truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500 shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveReferenceFile(index)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors shrink-0"
                          disabled={isCreatingReference}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <Label htmlFor="reference-notes">Notes (Optional)</Label>
              <Textarea
                id="reference-notes"
                placeholder="Add any notes or comments about this reference..."
                value={referenceNotes}
                onChange={(e) => setReferenceNotes(e.target.value)}
                className="min-h-[100px]"
                disabled={isCreatingReference}
              />
              <p className="text-xs text-gray-500">
                Add notes to provide context or additional information about this reference
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddReferenceDialogOpen(false);
                setReferenceNotes('');
                setReferenceFiles([]);
              }}
              disabled={isCreatingReference}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateReferenceSubmit}
              disabled={isCreatingReference || selections.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreatingReference ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Reference'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Step 9: Notes Dialog */}
      <Dialog open={isAddNotesDialogOpen} onOpenChange={setIsAddNotesDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {editingNotesEvidence ? 'View/Edit Notes' : 'Add Notes'}
              </DialogTitle>
              <button
                onClick={() => {
                  setIsAddNotesDialogOpen(false);
                  setNotesText('');
                  setEditingNotesFor(null);
                  setEditingNotesEvidence(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSavingNotes || isDeletingNotes}
              >
                <X size={20} />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Selected Range Display */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <Label className="text-sm font-semibold text-gray-700 mb-1 block">Selected Range:</Label>
              <p className="text-sm text-gray-600 font-mono">{getSelectedRangeString()}</p>
              {editingNotesEvidence && (
                <div className="mt-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1 block">Type:</Label>
                  <span className={`text-xs px-2 py-1 rounded ${
                    editingNotesFor === 'mapping' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {editingNotesFor === 'mapping' ? 'Mapping' : 'Reference'}
                  </span>
                </div>
              )}
            </div>

            {/* Notes Textarea */}
            <div className="space-y-2">
              <Label htmlFor="notes-text">Notes</Label>
              <Textarea
                id="notes-text"
                placeholder="Add notes or comments about this cell range..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="min-h-[150px]"
                disabled={isSavingNotes || isDeletingNotes}
              />
              <p className="text-xs text-gray-500">
                Add notes to provide context, explanations, or additional information about this cell range
              </p>
            </div>

            {/* Info message if creating new mapping */}
            {!editingNotesEvidence && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> A new mapping will be created for this cell range with these notes.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div>
              {editingNotesEvidence && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteNotes}
                  disabled={isSavingNotes || isDeletingNotes || !notesText.trim()}
                  size="sm"
                >
                  {isDeletingNotes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Notes'
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddNotesDialogOpen(false);
                  setNotesText('');
                  setEditingNotesFor(null);
                  setEditingNotesEvidence(null);
                }}
                disabled={isSavingNotes || isDeletingNotes}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNotes}
                disabled={isSavingNotes || isDeletingNotes || selections.length === 0}
              >
                {isSavingNotes ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingNotesEvidence ? 'Update Notes' : 'Save Notes'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mappings Dialog */}
      <Dialog open={isMappingsDialogOpen} onOpenChange={setIsMappingsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Workbook Mappings ({mappings.length})</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {mappings.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-sm text-gray-500 text-center">
                  No workbook mappings available
                  <br />
                  <span className="text-xs text-gray-400 mt-1 block">
                    Create a mapping by selecting cells and choosing from the context menu
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {mappings.map((mapping) => {
                  const startCol = zeroIndexToExcelCol(mapping.startCol);
                  const endCol = zeroIndexToExcelCol(mapping.endCol);
                  const startRow = mapping.startRow + 1;
                  const endRow = mapping.endRow + 1;
                  const rangeString = 
                    mapping.startRow === mapping.endRow && mapping.startCol === mapping.endCol
                      ? `${mapping.sheet}!${startCol}${startRow}`
                      : `${mapping.sheet}!${startCol}${startRow}:${endCol}${endRow}`;

                  return (
                    <div
                      key={mapping.id}
                      className="p-3 rounded border-l-4 bg-gray-50"
                      style={{
                        borderLeftColor: mapping.color || '#FFEB3B',
                        borderLeftWidth: '4px'
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">
                              {workbookName || 'Workbook'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Range: {rangeString}
                          </p>
                          {mapping.notes && (
                            <p className="text-sm text-gray-500 mt-1">
                              Notes: {mapping.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Select the mapping range
                              setSelections([{
                                sheet: mapping.sheet,
                                start: { row: mapping.startRow, col: mapping.startCol },
                                end: { row: mapping.endRow, col: mapping.endCol }
                              }]);
                              setSelectedSheet(mapping.sheet);
                              setIsMappingsDialogOpen(false);
                            }}
                          >
                            Select
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Edit mapping
                              setEditingMapping(mapping);
                              setEditMappingColor(mapping.color || '#FFEB3B');
                              setEditMappingNotes(mapping.notes || '');
                              setIsEditMappingDialogOpen(true);
                              setIsMappingsDialogOpen(false);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await deleteRangeEvidence(workbookId, mapping.id);
                                if (mappingsRefetchRef.current) {
                                  await mappingsRefetchRef.current();
                                }
                                toast({
                                  title: 'Success',
                                  description: 'Mapping deleted successfully',
                                });
                              } catch (error: any) {
                                toast({
                                  variant: 'destructive',
                                  title: 'Error',
                                  description: error?.message || 'Failed to delete mapping',
                                });
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMappingsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hover Menu for Mappings/References */}
      {hoverMenu.visible && hoverMenu.data && (
        <div
          ref={hoverMenuRef}
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[10000]"
          style={{
            left: hoverMenu.x,
            top: hoverMenu.y,
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
          }}
          onMouseEnter={() => {
            isMenuHoveredRef.current = true;
            if (hoverMenuTimeoutRef.current) {
              clearTimeout(hoverMenuTimeoutRef.current);
              hoverMenuTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            isMenuHoveredRef.current = false;
            hoverMenuTimeoutRef.current = setTimeout(() => {
              setHoverMenu(prev => ({ ...prev, visible: false }));
            }, 200);
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-2 rounded-t-lg">
            {hoverMenu.type === 'mapping' ? (
              <Link className="h-3 w-3 text-blue-500" />
            ) : (
              <FileText className="h-3 w-3 text-green-500" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              {hoverMenu.type === 'mapping' ? 'Mapping' : 'Reference'}
            </span>
          </div>

          <div className="py-1">
            {hoverMenu.type === 'mapping' && (
              <div
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Clear timeout and reset menu hover state
                  if (hoverMenuTimeoutRef.current) {
                    clearTimeout(hoverMenuTimeoutRef.current);
                    hoverMenuTimeoutRef.current = null;
                  }
                  isMenuHoveredRef.current = false;
                  setViewingMapping(hoverMenu.data);
                  setIsViewMappingDialogOpen(true);
                  setHoverMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <Info className="h-4 w-4" />
                View Mapping
              </div>
            )}

            {hoverMenu.type === 'reference' && (
              <div
                className="px-4 py-2 text-sm text-green-600 hover:bg-green-50 cursor-pointer flex items-center gap-2"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Clear timeout and reset menu hover state
                  if (hoverMenuTimeoutRef.current) {
                    clearTimeout(hoverMenuTimeoutRef.current);
                    hoverMenuTimeoutRef.current = null;
                  }
                  isMenuHoveredRef.current = false;
                  // Fetch the latest reference data with evidences included
                  try {
                    if (!hoverMenu.data) return;
                    console.log('Fetching reference:', hoverMenu.data.id);
                    const latestReference = await apiGet<{ data: RangeEvidence }>(
                      endPoints.AUDIT.GET_RANGE_EVIDENCE(workbookId, hoverMenu.data.id)
                    );
                    console.log('Raw API response:', latestReference);
                    const referenceData = latestReference.data || latestReference;
                    console.log('Processed reference data:', referenceData);
                    console.log('Reference evidences:', referenceData.evidences);
                    console.log('Evidences type:', typeof referenceData.evidences);
                    console.log('Evidences is array:', Array.isArray(referenceData.evidences));
                    if (referenceData.evidences && referenceData.evidences.length > 0) {
                      console.log('First evidence item:', referenceData.evidences[0]);
                    }
                    setViewingReference(referenceData);
                  } catch (error) {
                    // Fallback to hover menu data if fetch fails
                    console.error('Error fetching reference details:', error);
                    setViewingReference(hoverMenu.data);
                  }
                  setIsViewReferenceDialogOpen(true);
                  setHoverMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <Info className="h-4 w-4" />
                View Reference Files
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Mapping Dialog */}
      <Dialog open={isViewMappingDialogOpen} onOpenChange={(open) => {
        setIsViewMappingDialogOpen(open);
        if (!open) {
          // Reset hover state when dialog closes
          isMenuHoveredRef.current = false;
          if (hoverMenuTimeoutRef.current) {
            clearTimeout(hoverMenuTimeoutRef.current);
            hoverMenuTimeoutRef.current = null;
          }
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-[#0f1729] text-white border-[#0f1729]">
          <DialogHeader>
            <DialogTitle className="text-white">Mapping Details</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {viewingMapping && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-white">Range:</Label>
                  <p className="text-sm text-gray-200 font-mono mt-1">
                    {formatRangeString(viewingMapping)}
                  </p>
                </div>
                {viewingMapping.color && (
                  <div>
                    <Label className="text-sm font-semibold text-white">Color:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-6 h-6 rounded border border-gray-400"
                        style={{ backgroundColor: viewingMapping.color }}
                      />
                      <span className="text-sm text-gray-200">{viewingMapping.color}</span>
                    </div>
                  </div>
                )}
                {viewingMapping.notes && (
                  <div>
                    <Label className="text-sm font-semibold text-white">Notes:</Label>
                    <p className="text-sm text-gray-200 mt-1 whitespace-pre-wrap">
                      {viewingMapping.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsViewMappingDialogOpen(false);
                // Reset hover state when dialog closes
                isMenuHoveredRef.current = false;
                if (hoverMenuTimeoutRef.current) {
                  clearTimeout(hoverMenuTimeoutRef.current);
                  hoverMenuTimeoutRef.current = null;
                }
              }}
              className="bg-white text-[#0f1729] hover:bg-gray-100 border-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Reference Dialog */}
      <Dialog open={isViewReferenceDialogOpen} onOpenChange={(open) => {
        setIsViewReferenceDialogOpen(open);
        if (!open) {
          // Reset hover state when dialog closes
          isMenuHoveredRef.current = false;
          if (hoverMenuTimeoutRef.current) {
            clearTimeout(hoverMenuTimeoutRef.current);
            hoverMenuTimeoutRef.current = null;
          }
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Reference Files</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {viewingReference && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Range:</Label>
                  <p className="text-sm text-gray-600 font-mono mt-1">
                    {formatRangeString(viewingReference)}
                  </p>
                </div>
                {viewingReference.notes && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Notes:</Label>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {viewingReference.notes}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Reference Files:</Label>
                  {(() => {
                    // Debug: Log the structure
                    console.log('Viewing Reference:', viewingReference);
                    console.log('Evidences:', viewingReference.evidences);
                    
                    // Check if evidences exist and have the correct structure
                    const evidences = viewingReference.evidences;
                    if (evidences && Array.isArray(evidences) && evidences.length > 0) {
                      return (
                        <div className="mt-2 space-y-2">
                          {evidences.map((evidenceLink: any, index: number) => {
                            const evidence = evidenceLink?.evidence || evidenceLink;
                            const file = evidence?.file;
                            if (!file) {
                              console.warn('Evidence link missing file:', evidenceLink);
                              return null;
                            }
                            
                            return (
                              <div
                                key={evidence.id || evidenceLink.evidenceId || index}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {file.file_name || 'Untitled File'}
                                    </p>
                                    {file.file_size && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {(file.file_size / 1024).toFixed(2)} KB
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {file.url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(file.url, '_blank', 'noopener,noreferrer')}
                                      className="text-xs"
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      Open
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <p className="text-sm text-gray-500 mt-1">
                        No evidence files attached to this reference.
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (viewingReference) {
                  setEditingReference(viewingReference);
                  setIsViewReferenceDialogOpen(false);
                  setIsDeleteReferenceDialogOpen(true);
                }
              }}
              disabled={!viewingReference}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Reference
            </Button>
            <Button variant="outline" onClick={() => {
              setIsViewReferenceDialogOpen(false);
              // Reset hover state when dialog closes
              isMenuHoveredRef.current = false;
              if (hoverMenuTimeoutRef.current) {
                clearTimeout(hoverMenuTimeoutRef.current);
                hoverMenuTimeoutRef.current = null;
              }
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Reference Dialog */}
      <Dialog open={isDeleteReferenceDialogOpen} onOpenChange={setIsDeleteReferenceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Reference</DialogTitle>
          </DialogHeader>

          {editingReference && (
            <>
              <div className="py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete this reference? This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <Label className="text-sm font-semibold text-gray-700 mb-1 block">Reference Range:</Label>
                  <p className="text-sm text-gray-600 font-mono">
                    {editingReference.sheet}!{zeroIndexToExcelCol(editingReference.startCol)}{editingReference.startRow + 1}
                    {editingReference.startRow !== editingReference.endRow || editingReference.startCol !== editingReference.endCol
                      ? `:${zeroIndexToExcelCol(editingReference.endCol)}${editingReference.endRow + 1}`
                      : ''}
                  </p>
                  {editingReference.notes && (
                    <div className="mt-2">
                      <Label className="text-sm font-semibold text-gray-700 mb-1 block">Notes:</Label>
                      <p className="text-sm text-gray-600">{editingReference.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteReferenceDialogOpen(false);
                    setEditingReference(null);
                  }}
                  disabled={isDeletingReference}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteReferenceConfirm}
                  disabled={isDeletingReference}
                >
                  {isDeletingReference ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Reference'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

