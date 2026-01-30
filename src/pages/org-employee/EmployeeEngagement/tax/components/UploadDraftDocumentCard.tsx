import { useRef } from "react";
import { UploadCloud, AlertTriangle, Lightbulb, FileUp } from "lucide-react";
import { ShadowCard } from "../../../../../ui/ShadowCard";

interface UploadDraftDocumentCardProps {
    status?: string;
}

export default function UploadDraftDocumentCard({ status = 'Rejected' }: UploadDraftDocumentCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log("Draft File selected:", file.name);
        }
    };

    return (
        <ShadowCard className="p-6 h-full flex flex-col group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 text-gray-600 rounded-xl">
                    <UploadCloud size={20} />
                </div>
                <h3 className="font-bold text-gray-900">Upload Draft Document</h3>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                {/* Warning Alert */}
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-medium leading-relaxed">
                        Draft upload is only allowed at <strong>DRAFT</strong> status.<br />
                        Current status: <span className="font-bold">{status.toUpperCase()}</span>
                    </p>
                </div>

                {/* Functional Upload Area */}
                <div
                    onClick={handleClick}
                    className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed group-hover:bg-white transition-colors cursor-pointer min-h-[120px]"
                >
                    <div className="mb-3 p-3 bg-white rounded-full shadow-sm text-primary">
                        <FileUp size={20} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">Click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX up to 10MB</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.doc"
                    />
                </div>

                {/* Tip */}
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 flex items-start gap-3 mt-auto">
                    <Lightbulb className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-yellow-800 leading-relaxed">
                        <strong>Tip:</strong> Update status to "DRAFT" above to enable draft document upload
                    </p>
                </div>
            </div>
        </ShadowCard>
    );
}
