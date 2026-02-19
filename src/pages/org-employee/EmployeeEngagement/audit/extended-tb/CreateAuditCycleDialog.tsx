import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../../../ui/Dialog";
import { Button } from "../../../../../ui/Button";
import { Input } from "../../../../../ui/input";
import AlertMessage from "../../../../common/AlertMessage";

interface CreateAuditCycleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { yearEndDate: string }) => Promise<void>;
    engagementId?: string;
    companyId?: string;
    isLoading?: boolean;
}

export default function CreateAuditCycleDialog({
    isOpen,
    onClose,
    onSubmit,
    engagementId,
    companyId,
    isLoading = false
}: CreateAuditCycleDialogProps) {
    // Initialize with default year end date (end of current year)
    const getDefaultYearEndDate = () => {
        return new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];
    };

    const [yearEndDate, setYearEndDate] = useState(getDefaultYearEndDate());
    const [alertMessage, setAlertMessage] = useState<{ message: string; variant: "success" | "danger" | "warning" | "info" } | null>(null);

    // Reset to default when dialog opens
    useEffect(() => {
        if (isOpen) {
            setYearEndDate(getDefaultYearEndDate());
            setAlertMessage(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAlertMessage(null);

        if (!yearEndDate) {
            setAlertMessage({ message: "Year end date is required", variant: "danger" });
            return;
        }

        try {
            await onSubmit({ yearEndDate });
            // Don't close here - let the parent handle it after success
            // The parent will close the dialog and show success message
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to create audit cycle";
            setAlertMessage({ message: errorMessage, variant: "danger" });
            // Don't close on error - let user see the error and try again
        }
    };

    const handleClose = () => {
        setYearEndDate(getDefaultYearEndDate());
        setAlertMessage(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                {alertMessage && (
                    <AlertMessage
                        message={alertMessage.message}
                        variant={alertMessage.variant}
                        onClose={() => setAlertMessage(null)}
                        fixed={false}
                    />
                )}
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar size={20} />
                        Create Audit Cycle
                    </DialogTitle>
                    <DialogDescription>
                        Create an audit cycle for this engagement. The engagement status will change to ACTIVE after creation.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Year End Date <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="date"
                            value={yearEndDate}
                            onChange={(e) => setYearEndDate(e.target.value)}
                            required
                            className="w-full"
                        />
                        <p className="text-xs text-gray-500">
                            The financial year end date for this audit cycle.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !yearEndDate}
                        >
                            {isLoading ? "Creating..." : "Create Audit Cycle"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

