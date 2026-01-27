import { FileText, FileSpreadsheet, FolderArchive, Download } from "lucide-react";
import { Button } from "../../../../../ui/Button";

interface ExportCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    actions: React.ReactNode;
    iconBgColor: string;
    iconColor: string;
}

function ExportCard({ icon, title, description, actions, iconBgColor, iconColor }: ExportCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg shrink-0 ${iconBgColor}`}>
                    <div className={iconColor}>
                        {icon}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                    <p className="text-gray-500 text-xs mt-1">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                {actions}
            </div>
        </div>
    );
}

export default function Exports() {
    return (
        <div className="p-6 space-y-8 h-full overflow-y-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Export Data</h2>
                <p className="text-gray-500 mt-1">Export Extended Trial Balance, Adjustments, Reclassifications, and Evidence Files</p>
            </div>

            <div className="space-y-4">
                {/* Combined Export */}
                <ExportCard
                    icon={<FileText size={20} />}
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    title="Combined Export"
                    description="Export Extended Trial Balance, Adjustments, and Reclassifications as Excel (multiple sheets) or PDF (separate files in ZIP)"
                    actions={
                        <>
                            <Button className="bg-[#0F172A] hover:bg-[#1E293B] text-white gap-2 h-9 text-xs px-4">
                                <FileSpreadsheet size={14} />
                                Excel
                            </Button>
                            <Button variant="outline" className="gap-2 h-9 text-xs px-4">
                                <FileText size={14} />
                                PDF
                            </Button>
                        </>
                    }
                />

                {/* Extended Trial Balance */}
                <ExportCard
                    icon={<FileText size={20} />}
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    title="Extended Trial Balance"
                    description="Export Extended Trial Balance with all columns including Grouping1-4 and Linked Files"
                    actions={
                        <>
                            <Button className="bg-[#0F172A] hover:bg-[#1E293B] text-white gap-2 h-9 text-xs px-4">
                                <FileSpreadsheet size={14} />
                                Excel
                            </Button>
                            <Button variant="outline" className="gap-2 h-9 text-xs px-4">
                                <FileText size={14} />
                                PDF
                            </Button>
                        </>
                    }
                />

                {/* Adjustments */}
                <ExportCard
                    icon={<FileText size={20} />}
                    iconBgColor="bg-orange-50"
                    iconColor="text-orange-600"
                    title="Adjustments"
                    description="Export all adjustments with evidence file links"
                    actions={
                        <>
                            <Button className="bg-[#0F172A] hover:bg-[#1E293B] text-white gap-2 h-9 text-xs px-4">
                                <FileSpreadsheet size={14} />
                                Excel
                            </Button>
                            <Button variant="outline" className="gap-2 h-9 text-xs px-4">
                                <FileText size={14} />
                                PDF
                            </Button>
                        </>
                    }
                />

                {/* Reclassifications */}
                <ExportCard
                    icon={<FileText size={20} />}
                    iconBgColor="bg-purple-50"
                    iconColor="text-purple-600"
                    title="Reclassifications"
                    description="Export all reclassifications with evidence file links"
                    actions={
                        <>
                            <Button className="bg-[#0F172A] hover:bg-[#1E293B] text-white gap-2 h-9 text-xs px-4">
                                <FileSpreadsheet size={14} />
                                Excel
                            </Button>
                            <Button variant="outline" className="gap-2 h-9 text-xs px-4">
                                <FileText size={14} />
                                PDF
                            </Button>
                        </>
                    }
                />

                {/* Linked Evidence Files */}
                <ExportCard
                    icon={<FolderArchive size={20} />}
                    iconBgColor="bg-green-50"
                    iconColor="text-green-600"
                    title="Linked Evidence Files For the Adjustments and Reclassifications"
                    description="Export all evidence files linked to Adjustments and Reclassifications as a ZIP archive"
                    actions={
                        <Button variant="outline" className="gap-2 h-9 text-xs px-4">
                            <Download size={14} />
                            Export Linked Evidence Files
                        </Button>
                    }
                />

                {/* All Evidence Files */}
                <ExportCard
                    icon={<FolderArchive size={20} />}
                    iconBgColor="bg-green-50"
                    iconColor="text-green-600"
                    title="All Evidence Files"
                    description="Export all evidence files for this engagement across all classifications as a ZIP archive"
                    actions={
                        <Button variant="outline" className="gap-2 h-9 text-xs px-4">
                            <Download size={14} />
                            Export All Evidence Files
                        </Button>
                    }
                />

                {/* All Workbooks */}
                <ExportCard
                    icon={<FileText size={20} />}
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    title="All Workbooks"
                    description="Export all workbooks for this engagement across all classifications as a ZIP archive"
                    actions={
                        <Button variant="outline" className="gap-2 h-9 text-xs px-4">
                            <Download size={14} />
                            Export All Workbooks
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
