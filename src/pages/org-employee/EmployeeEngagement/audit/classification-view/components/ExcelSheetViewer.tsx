import { Sheet, Table as TableIcon, FilePlus, MessageSquare, Link } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import MappingDialog from "./MappingDialog";
import ReferenceFilesDialog from "./ReferenceFilesDialog";
import NotesDialog from "./NotesDialog";
import LeadSheetMappingsDialog from "./LeadSheetMappingsDialog";

interface ExcelSheetViewerProps {
    filename: string;
}

interface ContextMenuPosition {
    x: number;
    y: number;
    rowId: number;
    colId: string;
}

interface SelectionRange {
    startRow: number;
    endRow: number;
    startCol: string;
    endCol: string;
}



export default function ExcelSheetViewer({ filename }: ExcelSheetViewerProps) {
    const cols = useMemo(() => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], []);
    const rows = useMemo(() => Array.from({ length: 20 }, (_, i) => i + 1), []);

    const { cellData, rowStyles } = useMemo(() => {
        const data: Record<string, string | number> = {};
        const styles: Record<number, string> = {};

        rows.forEach(row => {
            if (row >= 2 && row <= 4) styles[row] = 'blue';
            else if (row >= 8 && row <= 9) styles[row] = 'green';
            else if (row >= 13 && row <= 15) styles[row] = 'pink';
            else styles[row] = 'none';

            cols.forEach(col => {
                const key = `${col}${row}`;
                if (row === 1) {
                    if (col === 'A') data[key] = "Code";
                    if (col === 'B') data[key] = "Account Name";
                    if (col === 'C') data[key] = "Current Year";
                    if (col === 'D') data[key] = "Prior Year";
                    if (col === 'E') data[key] = "Adjustments";
                } else {
                    if (col === 'A') data[key] = row.toString();
                    if (col === 'B') data[key] = row % 2 === 0 ? "Account " + row : "Expense " + row;
                    if (col === 'C') data[key] = (Math.random() * 10000).toFixed(2);
                    if (col === 'D') data[key] = (Math.random() * 8000).toFixed(2);
                }
            });
        });
        return { cellData: data, rowStyles: styles };
    }, [cols, rows]);

    const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
    const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
    const [isRefFilesDialogOpen, setIsRefFilesDialogOpen] = useState(false);
    const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
    const [isLeadSheetMappingsOpen, setIsLeadSheetMappingsOpen] = useState(false);

    // Selection state
    const [selection, setSelection] = useState<SelectionRange | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ row: number, col: string } | null>(null);

    // Hover state
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setContextMenu(null);
            }
        };

        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleMouseDown = (row: number, col: string) => {
        if (contextMenu) return;
        setIsSelecting(true);
        setSelectionStart({ row, col });
        setSelection({ startRow: row, endRow: row, startCol: col, endCol: col });
    };

    const handleMouseEnter = (row: number, col: string) => {
        setHoveredRow(row);

        if (isSelecting && selectionStart) {
            const startRow = Math.min(selectionStart.row, row);
            const endRow = Math.max(selectionStart.row, row);

            const startColIndex = cols.indexOf(selectionStart.col);
            const currentColIndex = cols.indexOf(col);

            const minColIndex = Math.min(startColIndex, currentColIndex);
            const maxColIndex = Math.max(startColIndex, currentColIndex);

            const startCol = cols[minColIndex];
            const endCol = cols[maxColIndex];

            setSelection({
                startRow,
                endRow,
                startCol,
                endCol
            });
        }
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
    };

    const handleContextMenu = (e: React.MouseEvent, rowId: number, colId: string) => {
        e.preventDefault();

        const isSelected = isCellSelected(rowId, colId);

        if (!isSelected) {
            setSelection({ startRow: rowId, endRow: rowId, startCol: colId, endCol: colId });
        }

        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            rowId,
            colId
        });
    };

    const handleCreateMapping = () => {
        setIsMappingDialogOpen(true);
        setContextMenu(null);
    };

    const getSelectedRangeString = () => {
        if (!selection) return "";
        if (selection.startRow === selection.endRow && selection.startCol === selection.endCol) {
            return `Sheet1!${selection.startCol}${selection.startRow}`;
        }
        return `Sheet1!${selection.startCol}${selection.startRow}:${selection.endCol}${selection.endRow}`;
    };

    const isCellSelected = (row: number, col: string) => {
        if (!selection) return false;

        const colIndex = cols.indexOf(col);
        const startColIndex = cols.indexOf(selection.startCol);
        const endColIndex = cols.indexOf(selection.endCol);

        const isRowInRange = row >= selection.startRow && row <= selection.endRow;
        const isColInRange = colIndex >= startColIndex && colIndex <= endColIndex;

        return isRowInRange && isColInRange;
    };

    // Helper to determine row color class
    const getRowColorClass = (rowId: number) => {
        const style = rowStyles[rowId];
        if (style === 'blue') return 'bg-blue-50';
        if (style === 'green') return 'bg-green-50';
        if (style === 'pink') return 'bg-red-50';
        return '';
    };

    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative" onMouseUp={handleMouseUp}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-md border border-green-200">
                        <TableIcon size={16} />
                        <span className="text-sm font-semibold">{filename}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-300" />
                    <div className="flex gap-2">
                        {['File', 'Home', 'Insert', 'Layout', 'Data'].map(menu => (
                            <button key={menu} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded">
                                {menu}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => setIsLeadSheetMappingsOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                    <Link size={14} />
                    Mappings
                </button>
            </div>

            {/* Formula Bar */}
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-200 bg-white">
                <div className="w-8 h-6 bg-gray-100 border border-gray-300 rounded text-[10px] flex items-center justify-center text-gray-500">
                    {selection ? `${selection.startCol}${selection.startRow}` : "A1"}
                </div>
                <div className="flex-1 h-6 bg-white border border-gray-300 rounded flex items-center px-2 text-xs text-gray-400">
                    fx {selection && cellData[`${selection.startCol}${selection.startRow}`]}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto bg-white relative">
                <table className="w-full border-collapse select-none">
                    <thead>
                        <tr>
                            <th className="w-10 bg-gray-100 border-b border-r border-gray-300 sticky top-0 z-10"></th>
                            {cols.map(col => (
                                <th key={col} className="min-w-[100px] h-6 bg-gray-50 border-b border-r border-gray-300 text-xs font-normal text-gray-500 sticky top-0 z-10">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row}>
                                <td className="h-6 bg-gray-50 border-b border-r border-gray-300 text-xs text-center text-gray-500 font-medium">
                                    {row}
                                </td>
                                {cols.map(col => {
                                    const cellId = `${col}${row}`;
                                    const isSelected = isCellSelected(row, col);
                                    const rowStyle = getRowColorClass(row);

                                    return (
                                        <td
                                            key={col}
                                            className={`h-6 border-b border-r border-gray-200 text-xs px-2 cursor-cell whitespace-nowrap overflow-hidden relative
                                                ${isSelected ? 'bg-blue-100 border-blue-300 z-10' : ''}
                                                ${!isSelected ? rowStyle : ''}
                                                ${!isSelected && !rowStyle ? 'hover:bg-gray-50' : ''}
                                            `}
                                            onMouseDown={() => handleMouseDown(row, col)}
                                            onMouseEnter={() => handleMouseEnter(row, col)}
                                            onContextMenu={(e) => handleContextMenu(e, row, col)}
                                            title={String(cellData[cellId] || '')}
                                        >
                                            {cellData[cellId]}

                                            {/* Hover Actions based on row style */}
                                            {hoveredRow === row && rowStyle && !contextMenu && !isSelecting && (
                                                <div className="absolute top-0 right-0 h-full flex items-center pr-2 bg-gradient-to-l from-white/90 to-transparent z-20">
                                                    {rowStyles[row] === 'green' && (
                                                        <div className="flex items-center gap-1 bg-white shadow-sm border border-green-200 rounded px-1.5 py-0.5 animate-in fade-in cursor-pointer hover:bg-green-50">
                                                            <FilePlus size={10} className="text-green-600" />
                                                            <span className="text-[10px] font-medium text-green-700 whitespace-nowrap">View Files</span>
                                                        </div>
                                                    )}
                                                    {rowStyles[row] === 'pink' && (
                                                        <div className="flex items-center gap-1 bg-white shadow-sm border border-red-200 rounded px-1.5 py-0.5 animate-in fade-in cursor-pointer hover:bg-red-50">
                                                            <MessageSquare size={10} className="text-red-600" />
                                                            <span className="text-[10px] font-medium text-red-700 whitespace-nowrap">View Notes</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bottom Tabs */}
            <div className="flex items-center gap-1 px-1 bg-gray-100 border-t border-gray-200 h-8">
                <button className="flex items-center gap-2 px-4 h-full bg-white text-xs font-medium text-green-700 border-r border-gray-200">
                    <Sheet size={14} />
                    Sheet1
                </button>
                <button className="flex items-center gap-2 px-4 h-full hover:bg-gray-200 text-xs text-gray-600 border-r border-gray-200 transition-colors">
                    <Sheet size={14} />
                    Sheet2
                </button>
                <button className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-gray-900">
                    +
                </button>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-56 z-50 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            {getSelectedRangeString()}
                        </div>
                    </div>

                    <button
                        onClick={handleCreateMapping}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                    >
                        <Link size={14} />
                        Create Mapping
                    </button>

                    {/* Visual separation for new features */}
                    <div className="my-1 border-t border-gray-100" />

                    <button
                        onClick={() => { setIsRefFilesDialogOpen(true); setContextMenu(null); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                    >
                        <FilePlus size={14} />
                        Add Reference Files
                    </button>
                    <button
                        onClick={() => { setIsNotesDialogOpen(true); setContextMenu(null); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 flex items-center gap-2"
                    >
                        <MessageSquare size={14} />
                        Add Notes
                    </button>
                </div>
            )}

            {/* Dialogs */}
            <MappingDialog
                isOpen={isMappingDialogOpen}
                onClose={() => setIsMappingDialogOpen(false)}
                selectedRange={getSelectedRangeString()}
            />

            <ReferenceFilesDialog
                isOpen={isRefFilesDialogOpen}
                onClose={() => setIsRefFilesDialogOpen(false)}
            />

            <NotesDialog
                isOpen={isNotesDialogOpen}
                onClose={() => setIsNotesDialogOpen(false)}
            />

            <LeadSheetMappingsDialog
                isOpen={isLeadSheetMappingsOpen}
                onClose={() => setIsLeadSheetMappingsOpen(false)}
            />
        </div>
    );
}
