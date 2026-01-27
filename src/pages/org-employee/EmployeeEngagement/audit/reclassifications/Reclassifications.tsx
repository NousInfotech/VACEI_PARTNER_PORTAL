import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "../../../../../ui/Button";
import AdjustmentCard from "../adjustments/AdjustmentCard";
import AdjustmentDialog from "../adjustments/AdjustmentDialog";
import type { AdjustmentData, AdjustmentEntry } from "../adjustments/AdjustmentDialog";

export default function Reclassifications() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AdjustmentData | undefined>(undefined);

    // Mock data for reclassifications
    const mockReclassLines: AdjustmentEntry[] = [
        { id: 1, accountId: 201, code: "8", accountName: "Sales", type: 'Debit', amount: 300, details: '' },
        { id: 2, accountId: 202, code: "4", accountName: "Shareholders' Loan", type: 'Credit', amount: 300, details: '' }
    ];

    const handleCreateClick = () => {
        setEditingItem(undefined);
        setIsDialogOpen(true);
    };

    const handleEditClick = () => {
        setEditingItem({
            id: "RC2",
            adjustmentNo: "RC2",
            description: "No description",
            status: "POSTED",
            entries: mockReclassLines
        });
        setIsDialogOpen(true);
    };

    const handleSave = (data: AdjustmentData) => {
        console.log("Saving reclassification:", data);
        setIsDialogOpen(false);
        setEditingItem(undefined);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reclassifications</h2>
                    <p className="text-gray-500 mt-1">Manage audit reclassifications for this engagement</p>
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
                        Create Reclassification
                    </Button>
                </div>
            </div>

            {/* Section Header */}
            <div>
                <h3 className="text-lg font-bold text-gray-900">Existing Reclassifications</h3>
            </div>

            {/* List */}
            <div className="space-y-4">
                <AdjustmentCard
                    id="RC2"
                    status="POSTED"
                    lines={mockReclassLines}
                    attachmentCount={0}
                    onEdit={handleEditClick}
                />
            </div>

            {isDialogOpen && (
                <AdjustmentDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={handleSave}
                    initialData={editingItem}
                    entityName="Reclassification"
                />
            )}
        </div>
    );
}
