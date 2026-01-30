import { RefreshCw, ArrowRight } from "lucide-react";
import { ShadowCard } from "../../../../../ui/ShadowCard";
import { Button } from "../../../../../ui/Button";

export default function UpdateStatusCard() {
    return (
        <ShadowCard className="p-6 h-full flex flex-col justify-between group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                        <RefreshCw size={20} />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Update Status</h3>
                <p className="text-gray-500 text-sm mb-4">
                    Progress through the MBR workflow by updating the status.
                </p>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Next Step</label>
                    <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                        <option>Submit for Review</option>
                        <option>Request Changes</option>
                        <option>Approve MBR</option>
                    </select>
                </div>
            </div>

            <div className="mt-6">
                <Button className="w-full flex items-center justify-between group/btn">
                    Update Progress
                    <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                </Button>
            </div>
        </ShadowCard>
    );
}
