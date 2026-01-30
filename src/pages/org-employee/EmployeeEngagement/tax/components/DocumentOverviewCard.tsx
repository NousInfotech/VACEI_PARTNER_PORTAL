import { Eye, FileText, Files } from "lucide-react";
import { ShadowCard } from "../../../../../ui/ShadowCard";
import { Button } from "../../../../../ui/Button";

export default function DocumentOverviewCard() {
    return (
        <ShadowCard className="p-6 h-full flex flex-col group hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Files size={20} />
                </div>
                <h3 className="font-bold text-gray-900">Document Overview</h3>
            </div>

            <div className="flex-1 space-y-4">
                {/* Draft Document Item */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group/item hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-gray-400">
                            <FileText size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Draft Document</p>
                            <p className="text-[10px] text-gray-500">v1.2 • Draft</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-primary"
                        onClick={() => window.open('/path/to/draft-document', '_blank')}
                    >
                        <Eye size={16} />
                    </Button>
                </div>

                {/* Final Document Item */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group/item hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg text-gray-400">
                            <FileText size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Final Document</p>
                            <p className="text-[10px] text-gray-500">Not generated</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-primary"
                        disabled
                        onClick={() => window.open('/path/to/final-document', '_blank')}
                    >
                        <Eye size={16} />
                    </Button>
                </div>
            </div>
        </ShadowCard>
    );
}
