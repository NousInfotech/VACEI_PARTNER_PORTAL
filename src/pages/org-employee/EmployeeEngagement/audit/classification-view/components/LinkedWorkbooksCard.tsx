import { FileSpreadsheet } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

export default function LinkedWorkbooksCard() {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Audit Work Book</h3>
                    </div>
                </div>
                <Button variant="outline" className="text-gray-700 border-gray-300">
                    View All Workbook History
                </Button>
            </div>
        </div>
    );
}
