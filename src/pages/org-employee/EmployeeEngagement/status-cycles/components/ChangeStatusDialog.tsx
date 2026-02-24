import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../../ui/Dialog";
import { Button } from "../../../../../ui/Button";
import { X, Check } from "lucide-react";

interface ChangeStatusDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentStatus: string;
    onStatusChange: (newStatus: string, reason?: string) => void;
    statusOptions: { value: string; label: string }[];
    title?: string;
}

export default function ChangeStatusDialog({
    open,
    onOpenChange,
    currentStatus,
    onStatusChange,
    statusOptions,
    title = "Update Status"
}: ChangeStatusDialogProps) {
    const [selectedStatus, setSelectedStatus] = useState(currentStatus);
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (selectedStatus === currentStatus) {
            onOpenChange(false);
            return;
        }

        setIsLoading(true);
        // Let the parent handle the API call or logic
        await onStatusChange(selectedStatus, reason);
        setIsLoading(false);
        onOpenChange(false);
        setReason(""); // Reset reason
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>{title}</DialogTitle>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Select New Status</label>
                        <div className="grid grid-cols-1 gap-2">
                            {statusOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => setSelectedStatus(option.value)}
                                    className={`
                                        flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                        ${selectedStatus === option.value
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'}
                                    `}
                                >
                                    <span className={`text-sm font-medium ${selectedStatus === option.value ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {option.label}
                                    </span>
                                    {selectedStatus === option.value && (
                                        <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Reason / Note (Optional)</label>
                        <textarea
                            placeholder="Provide a reason for this status change..."
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none h-20 text-sm"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading || selectedStatus === currentStatus}>
                            {isLoading ? "Updating..." : "Update Status"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
