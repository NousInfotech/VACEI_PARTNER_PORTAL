import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "../../../../../ui/Button";
import AdjustmentCard from "./AdjustmentCard";
import AdjustmentDialog from "./AdjustmentDialog";
import type { AdjustmentData, AdjustmentEntry } from "./AdjustmentDialog";

export default function Adjustments() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAdjustment, setEditingAdjustment] = useState<AdjustmentData | undefined>(undefined);

    // Mock data for the adjustment card
    const mockAdjustmentLines: AdjustmentEntry[] = [
        { id: 1, accountId: 101, code: "1", accountName: "Cash and cash equivalents", type: 'Debit', amount: 1000, details: '' },
        { id: 2, accountId: 102, code: "2", accountName: "Accruals", type: 'Credit', amount: 1000, details: '' }
    ];

    const handleCreateClick = () => {
        setEditingAdjustment(undefined);
        setIsDialogOpen(true);
    };

    const handleEditClick = () => {
        setEditingAdjustment({
            id: "AA1",
            adjustmentNo: "AA1",
            description: "No description",
            status: "POSTED",
            entries: mockAdjustmentLines
        });
        setIsDialogOpen(true);
    };

    const handleSaveAdjustment = (data: AdjustmentData) => {
        console.log("Saving adjustment:", data);
        setIsDialogOpen(false);
        setEditingAdjustment(undefined);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Adjustments</h2>
                    <p className="text-gray-500 mt-1">Manage audit adjustments for this engagement</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 text-gray-600">
                        <Download size={18} />
                        Export to Excel
                    </Button>
                    <Button
                        onClick={handleCreateClick}
                        className="gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        <Plus size={18} />
                        Create Adjustment
                    </Button>
                </div>
            </div>

            {/* Section Header */}
            <div>
                <h3 className="text-lg font-bold text-gray-900">Existing Adjustments</h3>
            </div>

            {/* Adjustments List */}
            <div className="space-y-4">
                <AdjustmentCard
                    id="AA1"
                    status="POSTED"
                    lines={mockAdjustmentLines}
                    attachmentCount={0}
                    onEdit={handleEditClick}
                />
            </div>

            {isDialogOpen && (
                <AdjustmentDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={handleSaveAdjustment}
                    initialData={editingAdjustment}
                />
            )}
        </div>
    );
}
