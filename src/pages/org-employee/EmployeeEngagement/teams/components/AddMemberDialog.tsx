import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../../ui/Dialog";
import { Button } from "../../../../../ui/Button";
import { X } from "lucide-react";

interface AddMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>Add Team Member</DialogTitle>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <input
                            id="name"
                            required
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. john@company.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="role" className="text-sm font-medium text-gray-700">
                            Role
                        </label>
                        <input
                            id="role"
                            required
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. Tax Consultant"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="department" className="text-sm font-medium text-gray-700">
                            Department
                        </label>
                        <input
                            id="department"
                            required
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. Advisory"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Adding..." : "Add Member"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
