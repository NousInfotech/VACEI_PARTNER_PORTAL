import { useRef } from "react";
import { UploadCloud, FileUp } from "lucide-react";
import { ShadowCard } from "../../../../../ui/ShadowCard";

export default function UploadFinalDocumentCard() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log("Final File selected:", file.name);
        }
    };

    return (
        <ShadowCard className="p-6 h-full flex flex-col group hover:shadow-lg transition-all duration-300 border-dashed border-2 border-gray-200 hover:border-primary/30">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 text-gray-600 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <UploadCloud size={20} />
                </div>
                <h3 className="font-bold text-gray-900">Upload Final Document</h3>
            </div>

            <div
                onClick={handleClick}
                className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed group-hover:bg-white transition-colors cursor-pointer"
            >
                <div className="mb-3 p-4 bg-white rounded-full shadow-sm text-primary">
                    <FileUp size={24} />
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
        </ShadowCard>
    );
}
