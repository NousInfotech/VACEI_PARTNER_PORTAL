import { useRef } from "react";
import { UploadCloud, FileSpreadsheet, Clock, Link, Trash2 } from "lucide-react";
import type { WorkbookFile } from "../ClassificationView";

interface UploadWorkbookCardProps {
    files: WorkbookFile[];
    onUpload: (file: WorkbookFile) => void;
    onFileClick: (file: WorkbookFile) => void;
    onDelete: (id: string) => void;
}

export default function UploadWorkbookCard({ files, onUpload, onFileClick, onDelete }: UploadWorkbookCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const newFile: WorkbookFile = {
                id: Date.now().toString(),
                name: file.name,
                user: "Uploaded by You",
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                date: "Just now"
            };
            onUpload(newFile);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <UploadCloud size={20} className="text-gray-900" />
                        Upload Workbook
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Add a new Excel file to start mapping.</p>
                </div>

                <div
                    onClick={handleUploadClick}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                    />
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <UploadCloud size={32} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                        Drag & drop an .xlsx file here, or
                    </p>
                    <button className="text-sm font-semibold text-gray-900 hover:underline">
                        Browse Files
                    </button>
                </div>
            </div>

            {/* Recent Workbooks Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Workbooks</h3>
                <div className="space-y-4">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            onClick={() => onFileClick(file)}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all cursor-pointer hover:bg-blue-50/30"
                        >
                            <div className="p-3 bg-white border border-gray-200 rounded-lg text-green-600">
                                <FileSpreadsheet size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{file.user} • {file.size}</p>
                            </div>

                            {/* Meta & Actions */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                                    <Clock size={12} />
                                    <span>{file.date}</span>
                                </div>

                                <div className="flex items-center gap-2 pl-2 border-l border-gray-200" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded transition-colors"
                                        title="Link to Field"
                                    >
                                        <Link size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(file.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {files.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No workbooks uploaded yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
