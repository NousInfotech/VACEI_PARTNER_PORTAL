import { Sheet, Table as TableIcon } from "lucide-react";

interface ExcelSheetViewerProps {
    filename: string;
}

export default function ExcelSheetViewer({ filename }: ExcelSheetViewerProps) {
    // Generate mock grid data
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const rows = Array.from({ length: 20 }, (_, i) => i + 1);

    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-md border border-green-200">
                    <TableIcon size={16} />
                    <span className="text-sm font-semibold">{filename}</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex gap-2">
                    {/* Mock toolbar buttons */}
                    {['File', 'Home', 'Insert', 'Layout', 'Data'].map(menu => (
                        <button key={menu} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded">
                            {menu}
                        </button>
                    ))}
                </div>
            </div>

            {/* Formula Bar */}
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-200 bg-white">
                <div className="w-8 h-6 bg-gray-100 border border-gray-300 rounded text-[10px] flex items-center justify-center text-gray-500">
                    A1
                </div>
                <div className="flex-1 h-6 bg-white border border-gray-300 rounded flex items-center px-2 text-xs text-gray-400">
                    fx
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="w-10 bg-gray-100 border-b border-r border-gray-300"></th>
                            {cols.map(col => (
                                <th key={col} className="min-w-[100px] h-6 bg-gray-50 border-b border-r border-gray-300 text-xs font-normal text-gray-500">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row}>
                                <td className="h-6 bg-gray-50 border-b border-r border-gray-300 text-xs text-center text-gray-500">
                                    {row}
                                </td>
                                {cols.map(col => (
                                    <td key={col} className="h-6 border-b border-r border-gray-200 text-xs px-2 focus:outline-blue-500 cursor-cell hover:bg-blue-50">
                                        {/* Mock content for specific cells */}
                                        {col === 'A' && row === 1 && "Account Code"}
                                        {col === 'B' && row === 1 && "Account Name"}
                                        {col === 'C' && row === 1 && "Debit"}
                                        {col === 'D' && row === 1 && "Credit"}

                                        {col === 'A' && row > 1 && `100${row}`}
                                        {col === 'B' && row > 1 && `Sample Account ${row}`}
                                        {col === 'C' && row > 1 && (Math.random() * 1000).toFixed(2)}
                                        {col === 'D' && row > 1 && (Math.random() * 500).toFixed(2)}
                                    </td>
                                ))}
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
        </div>
    );
}
