import { UploadCloud } from "lucide-react";

export default function ReferenceFileUpload() {
    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Reference Files (Optional)</h4>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                    <UploadCloud size={20} />
                </div>
                <p className="text-sm font-medium text-blue-600 mb-1">Click to upload reference files <span className="text-gray-500 font-normal">or drag and drop</span></p>
                <p className="text-xs text-gray-400">All file types supported (max 10MB per file)</p>
            </div>
        </div>
    );
}
