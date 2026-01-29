import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/Dialog";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/Select";
import { financialMockData } from "../../extended-tb/data";
import ReferenceFileUpload from "./ReferenceFileUpload";
import NotesSection from "./NotesSection";
import { useState } from "react";

interface MappingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRange?: string;
}

export default function MappingDialog({ isOpen, onClose, selectedRange = "Sheet1!E7" }: MappingDialogProps) {
    const [selectedRowId, setSelectedRowId] = useState<string | number>("");

    const etbOptions = financialMockData.map(row => ({
        id: row.id,
        label: `${row.code} - ${row.accountName}`
    }));

    const selectedRowLabel = etbOptions.find(opt => opt.id === selectedRowId)?.label;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl sm:max-w-2xl">
                <div className="flex items-center justify-between mb-2">
                    <DialogTitle className="text-xl font-bold">Map to Lead Sheet</DialogTitle>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* ETB Row Selection */}
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-900">ETB Row</label>

                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Account Names from Lead Sheet:</p>
                            <div className="max-h-32 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                                {etbOptions.map(opt => (
                                    <div key={opt.id} className="text-sm text-gray-600 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></span>
                                        {opt.label}
                                    </div>
                                ))}
                            </div>

                            <Select
                                label={selectedRowLabel || "Select ETB Row"}
                                items={etbOptions.map(opt => ({
                                    ...opt,
                                    onClick: () => setSelectedRowId(opt.id)
                                }))}
                                fullWidth
                                searchable
                                searchPlaceholder="Search accounts..."
                                className="w-full"
                                contentClassName="max-h-60"
                            />
                            <p className="text-xs text-gray-500 mt-2">{etbOptions.length} rows available</p>
                        </div>
                    </div>

                    {/* Selected Range */}
                    <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-sm font-bold text-gray-900">Selected Range:</p>
                        <p className="text-sm text-gray-600 font-mono">{selectedRange}</p>
                    </div>

                    {/* Reference Files */}
                    <ReferenceFileUpload />

                    {/* Notes */}
                    <NotesSection />
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button disabled={!selectedRowId} className="bg-gray-600 hover:bg-gray-700 text-white">Create</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
