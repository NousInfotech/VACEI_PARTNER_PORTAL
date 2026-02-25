import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/ui/Dialog";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/input";
import { CSPItemType, CSPItemStatus, type CreateCspItemDto, type UpdateCspItemDto, type CspItem } from "@/api/cspService";
import { Textarea } from "@/ui/Textarea";

interface CSPItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateCspItemDto | UpdateCspItemDto) => Promise<void>;
    initialData?: CspItem | null;
    isLoading?: boolean;
}

export default function CSPItemModal({ isOpen, onClose, onSave, initialData, isLoading }: CSPItemModalProps) {
    const [formData, setFormData] = useState<Partial<CreateCspItemDto>>({
        type: CSPItemType.OTHER,
        status: CSPItemStatus.PENDING,
        title: "",
        dueDate: "",
        referenceNo: "",
        notes: "",
    });

    useEffect(() => {
        if (initialData && isOpen) {
            setFormData({
                type: initialData.type,
                status: initialData.status,
                title: initialData.title || "",
                dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "",
                referenceNo: initialData.referenceNo || "",
                notes: initialData.notes || "",
            });
        } else if (isOpen) {
            setFormData({
                type: CSPItemType.OTHER,
                status: CSPItemStatus.PENDING,
                title: "",
                dueDate: "",
                referenceNo: "",
                notes: "",
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value as any }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        };

        await onSave(payload as any);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit KYC Item" : "Create KYC Item"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Update the details of the KYC compliance item below." : "Add a new KYC compliance item to this cycle."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        >
                            {Object.values(CSPItemType).map((type) => (
                                <option key={type} value={type}>
                                    {type.replace(/_/g, " ")}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        >
                            {Object.values(CSPItemStatus).map((status) => (
                                <option key={status} value={status}>
                                    {status.replace(/_/g, " ")}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Title (Optional)</label>
                        <Input
                            name="title"
                            value={formData.title || ""}
                            onChange={handleChange}
                            placeholder="Brief description"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Due Date</label>
                        <Input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Reference Number (Optional)</label>
                        <Input
                            name="referenceNo"
                            value={formData.referenceNo || ""}
                            onChange={handleChange}
                            placeholder="E.g., Filing ID or Document No"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                        <Textarea
                            name="notes"
                            value={formData.notes || ""}
                            onChange={handleChange}
                            placeholder="Add any additional notes here..."
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : initialData ? "Update Item" : "Create Item"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
