import {
    Filter,
    Download,
    Plus
} from "lucide-react";
import { Button } from "../../../../ui/Button";
import ExtendedTBTable from "./ExtendedTBTable";

export default function ExtendedTB() {
    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Extended Trial Balance</h2>
                    <p className="text-sm text-gray-500">Manage your financial data and adjustments</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter size={16} />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download size={16} />
                        Export
                    </Button>
                    <Button size="sm" className="gap-2">
                        <Plus size={16} />
                        Add Account
                    </Button>
                </div>
            </div>

            <ExtendedTBTable />
        </div>
    );
}
