import { UploadCloud, AlertTriangle, Lightbulb } from "lucide-react";
import { ShadowCard } from "../../../../../ui/ShadowCard";
import { Button } from "../../../../../ui/Button";

export default function UploadDraftDocumentCard() {
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
                        Current status: <span className="font-bold">REJECTED</span>
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Select Draft File</label>
                    <div className="flex gap-2">
                        <div className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-400 italic">
                            No file chosen
                        </div>
                        <Button variant="outline" size="sm" disabled>
                            Browse
                        </Button>
                    </div>
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
