import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/Dialog";
import { Button } from "@/ui/Button";
import NotesSection from "./NotesSection";

interface NotesDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotesDialog({ isOpen, onClose }: NotesDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <div className="flex items-center justify-between mb-4">
                    <DialogTitle className="text-xl font-bold">Add Notes</DialogTitle>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <NotesSection />

                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white">Save</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
