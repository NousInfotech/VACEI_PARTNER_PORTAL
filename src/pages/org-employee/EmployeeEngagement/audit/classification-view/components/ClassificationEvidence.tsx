import { FileText, Image, Eye, Edit2, Trash2, Link, UploadCloud, History, FileSpreadsheet } from "lucide-react";
import { useRef } from "react";
import { Button } from "../../../../../../ui/Button";

interface EvidenceFile {
    id: string;
    name: string;
    type: 'PDF' | 'TXT' | 'JPG';
    size: string;
    linkedFiles: number;
}

interface WorkbookFile {
    id: string;
    name: string;
    version: string;
    authorId: string;
}

export default function ClassificationEvidence() {
    const evidenceInputRef = useRef<HTMLInputElement>(null);
    const workbookInputRef = useRef<HTMLInputElement>(null);
    const evidenceFiles: EvidenceFile[] = [
        { id: '1', name: 'Invoice_INV-2024-001.pdf', type: 'PDF', size: '2.4 MB', linkedFiles: 1 },
        { id: '2', name: 'Meeting_Notes_Jan.txt', type: 'TXT', size: '12 KB', linkedFiles: 1 },
        { id: '3', name: 'Asset_Photo_002.jpg', type: 'JPG', size: '4.1 MB', linkedFiles: 1 },
    ];

    const workbooks: WorkbookFile[] = [
        { id: '1', name: 'Unique Ltd.xlsx', version: 'v1', authorId: '00ec57eb-ceb7-485d-8449-e0b9574e01e7' },
        { id: '2', name: 'Book2.xlsx', version: 'v1', authorId: '00ec57eb-ceb7-485d-8449-e0b9574e01e7' },
    ];

    return (
        <div className="space-y-8">
            {/* EVIDENCE SECTION */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Evidence</h2>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Upload Evidence Files</h3>
                            <p className="text-xs text-gray-500 mt-1">Upload supporting documents, images, and other evidence files</p>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div
                        className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer mb-8"
                        onClick={() => evidenceInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            className="hidden"
                            ref={evidenceInputRef}
                            multiple
                            accept=".pdf,.png,.jpg,.jpeg,.txt"
                            onChange={(e) => console.log(e.target.files)}
                        />
                        <div className="bg-blue-50 p-3 rounded-full mb-3">
                            <UploadCloud className="text-blue-500" size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG, TXT up to 10MB</p>
                    </div>

                    {/* Evidence Files List */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">EVIDENCE FILES</h4>
                        <div className="space-y-3">
                            {evidenceFiles.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${file.type === 'PDF' ? 'bg-red-100 text-red-600' :
                                            file.type === 'TXT' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {file.type === 'PDF' ? <FileText size={20} /> : file.type === 'TXT' ? <FileText size={20} /> : <Image size={20} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${file.type === 'PDF' ? 'bg-red-100 text-red-700' :
                                                    file.type === 'TXT' ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {file.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">{file.size}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-100">
                                            <Eye size={14} />
                                            {file.linkedFiles} file
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-blue-600">
                                            <Eye size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-blue-600">
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* WORKBOOKS SECTION */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Linked Workbooks</h2>
                    <Button variant="outline" className="gap-2 text-xs">
                        <History size={14} />
                        View All Workbook History
                    </Button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-900">Audit Work Book</h3>
                        <div
                            className="mt-4 border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer mb-8"
                            onClick={() => workbookInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                className="hidden"
                                ref={workbookInputRef}
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => console.log(e.target.files)}
                            />
                            <div className="bg-green-50 p-3 rounded-full mb-3">
                                <FileSpreadsheet className="text-green-600" size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-900">Click to upload workbook</p>
                            <p className="text-xs text-gray-500 mt-1">Add a new Excel file to start mapping</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">RECENT WORKBOOKS</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {workbooks.map((wb) => (
                                <div key={wb.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded text-green-700">
                                                <FileSpreadsheet size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{wb.name}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5 break-all">
                                                    {wb.version} by {wb.authorId}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-auto pt-2 border-t border-gray-200">
                                        <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                            <Link size={12} />
                                            Link to File
                                        </Button>
                                        <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs gap-2 text-red-500 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 size={12} />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
