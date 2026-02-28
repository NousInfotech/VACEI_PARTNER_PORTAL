import { useState } from "react";
import { FileText, FileSpreadsheet, FolderArchive, Download, Loader2 } from "lucide-react";
import { Button } from "../../../../../ui/Button";
import { useToast } from "../../../../../hooks/use-toast";
import { apiGetBlob } from "../../../../../config/base";
import { endPoints } from "../../../../../config/endPoint";

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

type ExportType = "evidence" | "all-evidence" | "all-workbooks" | "combined" | "etb" | "adjustments" | "reclassifications";
type ExportFormat = "xlsx" | "pdf";

const DEFAULT_FILENAMES: Record<string, string> = {
    etb_xlsx: "Extended_Trial_Balance.xlsx",
    etb_pdf: "Extended_Trial_Balance.pdf",
    adjustments_xlsx: "Adjustments.xlsx",
    adjustments_pdf: "Adjustments.pdf",
    reclassifications_xlsx: "Reclassifications.xlsx",
    reclassifications_pdf: "Reclassifications.pdf",
    combined: "Combined.xlsx",
    combined_pdf: "Combined_Reports.pdf.zip",
    evidence: "EvidenceFiles.zip",
    "all-evidence": "AllEvidenceFiles.zip",
    "all-workbooks": "AllWorkbooks.zip",
};

interface ExportsProps {
    engagementId?: string;
}

export default function Exports({ engagementId }: ExportsProps) {
    const [exporting, setExporting] = useState<string | null>(null);
    const { toast } = useToast();

    const handleExport = async (type: ExportType, format?: ExportFormat) => {
        if (!engagementId) {
            toast({
                title: "Error",
                description: "Engagement context is required. Open an engagement first.",
                variant: "destructive",
            });
            return;
        }

        const key = format ? `${type}_${format}` : type === "combined" && format === "pdf" ? "combined_pdf" : type;
        setExporting(key);
        try {
            const url = endPoints.ENGAGEMENTS.EXPORT(
                engagementId,
                type,
                type === "combined" ? format ?? "xlsx" : format
            );
            const { blob, filename: headerFilename } = await apiGetBlob(url);
            const filename =
                headerFilename ||
                DEFAULT_FILENAMES[key] ||
                (key.endsWith(".zip") ? key : `${key}.${type === "combined" && format === "pdf" ? "zip" : format || "xlsx"}`);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast({
                title: "Export successful",
                description:
                    type === "combined" && format === "pdf"
                        ? "Combined PDF files exported as ZIP"
                        : type === "combined"
                            ? "Combined Excel file exported"
                            : type === "evidence"
                                ? "Linked evidence files exported as ZIP"
                                : type === "all-evidence"
                                    ? "All evidence files exported as ZIP"
                                    : type === "all-workbooks"
                                        ? "All workbooks exported as ZIP"
                                        : `${type} exported as ${(format || "xlsx").toUpperCase()}`,
            });
        } catch (err: any) {
            console.error("Export failed:", err);
            let description = err?.message || `Failed to export ${type}`;
            if (err?.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text();
                    const json = JSON.parse(text);
                    if (json?.message) description = json.message;
                } catch (_) {}
            } else if (err?.response?.data?.message) {
                description = err.response.data.message;
            }
            toast({
                title: "Export failed",
                description,
                variant: "destructive",
            });
        } finally {
            setExporting(null);
        }
    };

    const loading = (key: string) => exporting === key;
    const disabled = exporting !== null;

    return (
        <div className="p-6 space-y-8 h-full overflow-y-auto">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Export Data</h2>
                <p className="text-gray-500 mt-1">Export Extended Trial Balance, Adjustments, Reclassifications, and Evidence Files</p>
            </div>

            <div className="space-y-4">
                <ExportCard
                    icon={<FileText size={20} />}
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    title="Combined Export"
                    description="Export Extended Trial Balance, Adjustments, and Reclassifications as Excel (multiple sheets) or PDF (separate files in ZIP)"
                    actions={
                        <>
                            <Button
                                className="bg-[#0F172A] hover:bg-[#1E293B] text-white gap-2 h-9 text-xs px-4"
                                disabled={disabled}
                                onClick={() => handleExport("combined", "xlsx")}
                            >
                                {loading("combined") ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                                Excel
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 h-9 text-xs px-4"
                                disabled={disabled}
                                onClick={() => handleExport("combined", "pdf")}
                            >
                                {loading("combined_pdf") ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                PDF
                            </Button>
                        </>
                    }
                />

                <ExportCard
                    icon={<FileText size={20} />}
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    title="Extended Trial Balance"
                    description="Export Extended Trial Balance with all columns including Grouping1-4 and Linked Files"
                    actions={
                        <>
                            <Button
                                className="bg-[#0F172A] hover:bg-[#1E293B] text-white gap-2 h-9 text-xs px-4"
                                disabled={disabled}
                                onClick={() => handleExport("etb", "xlsx")}
                            >
                                {loading("etb_xlsx") ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                                Excel
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 h-9 text-xs px-4"
                                disabled={disabled}
                                onClick={() => handleExport("etb", "pdf")}
                            >
                                {loading("etb_pdf") ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                PDF
                            </Button>
                        </>
                    }
                />

                <ExportCard
                    icon={<FileText size={20} />}
                    iconBgColor="bg-orange-50"
                    iconColor="text-orange-600"
                    title="Adjustments"
                    description="Export all adjustments with evidence file links"
                    actions={
                        <>
                            <Button
                                className="bg-[#0F172A] hover:bg-[#1E293B] text-white gap-2 h-9 text-xs px-4"
                                disabled={disabled}
                                onClick={() => handleExport("adjustments", "xlsx")}
                            >
                                {loading("adjustments_xlsx") ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                                Excel
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 h-9 text-xs px-4"
                                disabled={disabled}
                                onClick={() => handleExport("adjustments", "pdf")}
                            >
                                {loading("adjustments_pdf") ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                PDF
                            </Button>
                        </>
                    }
                />

                <ExportCard
                    icon={<FileText size={20} />}
                    iconBgColor="bg-purple-50"
                    iconColor="text-purple-600"
                    title="Reclassifications"
                    description="Export all reclassifications with evidence file links"
                    actions={
                        <>
                            <Button
                                className="bg-[#0F172A] hover:bg-[#1E293B] text-white gap-2 h-9 text-xs px-4"
                                disabled={disabled}
                                onClick={() => handleExport("reclassifications", "xlsx")}
                            >
                                {loading("reclassifications_xlsx") ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                                Excel
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 h-9 text-xs px-4"
                                disabled={disabled}
                                onClick={() => handleExport("reclassifications", "pdf")}
                            >
                                {loading("reclassifications_pdf") ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                PDF
                            </Button>
                        </>
                    }
                />

                <ExportCard
                    icon={<FolderArchive size={20} />}
                    iconBgColor="bg-green-50"
                    iconColor="text-green-600"
                    title="Linked Evidence Files For the Adjustments and Reclassifications"
                    description="Export all evidence files linked to Adjustments and Reclassifications as a ZIP archive"
                    actions={
                        <Button
                            variant="outline"
                            className="gap-2 h-9 text-xs px-4"
                            disabled={disabled}
                            onClick={() => handleExport("evidence")}
                        >
                            {loading("evidence") ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            Export Linked Evidence Files
                        </Button>
                    }
                />

                <ExportCard
                    icon={<FolderArchive size={20} />}
                    iconBgColor="bg-green-50"
                    iconColor="text-green-600"
                    title="All Evidence Files"
                    description="Export all evidence files for this engagement across all classifications as a ZIP archive"
                    actions={
                        <Button
                            variant="outline"
                            className="gap-2 h-9 text-xs px-4"
                            disabled={disabled}
                            onClick={() => handleExport("all-evidence")}
                        >
                            {loading("all-evidence") ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            Export All Evidence Files
                        </Button>
                    }
                />

                <ExportCard
                    icon={<FileText size={20} />}
                    iconBgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    title="All Workbooks"
                    description="Export all workbooks for this engagement across all classifications as a ZIP archive"
                    actions={
                        <Button
                            variant="outline"
                            className="gap-2 h-9 text-xs px-4"
                            disabled={disabled}
                            onClick={() => handleExport("all-workbooks")}
                        >
                            {loading("all-workbooks") ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            Export All Workbooks
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
