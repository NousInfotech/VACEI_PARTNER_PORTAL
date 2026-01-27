import { useState } from "react";
import {
    Plus
} from "lucide-react";
import { Button } from "../../../../../ui/Button";
import ExtendedTBTable from "./ExtendedTBTable";
import { financialMockData } from "./data";
import type { ExtendedTBRow } from "./data";

export default function ExtendedTB({ isSectionsView = false }: { isSectionsView?: boolean }) {
    const [data, setData] = useState<ExtendedTBRow[]>(financialMockData);

    const handleAddRow = () => {
        const newRow: ExtendedTBRow = {
            id: Math.max(...data.map(d => d.id), 0) + 1,
            code: "",
            accountName: "",
            currentYear: 0,
            reClassification: 0,
            adjustments: 0,
            finalBalance: 0,
            priorYear: 0,
            classification: "",
            actions: [],
            linkedFiles: []
        };
        setData([...data, newRow]);
    };

    const handleUpdateRow = (id: number, field: string, value: string | number) => {
        setData(data.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleDeleteRow = (id: number) => {
        setData(data.filter(row => row.id !== id));
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Extended Trial Balance</h2>
                    <p className="text-sm text-gray-500">Manage your financial data and adjustments</p>
                </div>
                {!isSectionsView && (
                    <div className="flex gap-2">
                        <Button size="sm" className="gap-2" onClick={handleAddRow}>
                            <Plus size={16} />
                            Add Row
                        </Button>
                    </div>
                )}
            </div>

            <ExtendedTBTable
                data={data}
                onUpdateRow={handleUpdateRow}
                onDeleteRow={handleDeleteRow}
                isSectionsView={isSectionsView}
            />
        </div>
    );
}
