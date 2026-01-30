import { Eye, FileCheck } from "lucide-react";
import { ShadowCard } from "../../../../../ui/ShadowCard";
import { Button } from "../../../../../ui/Button";

export default function StatusOverviewCard() {
    return (
        <ShadowCard className="p-6 h-full flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <FileCheck size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900">Status Overview</h3>
                </div>
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Document Type</span>
                            <span className="font-bold text-gray-900">Annual Review</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Version</span>
                            <span className="font-bold text-gray-900">v2.4.0</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <Button className="w-full flex items-center gap-2" variant="outline">
                    <Eye size={16} />
                    View Document
                </Button>
            </div>
        </ShadowCard>
    );
}
