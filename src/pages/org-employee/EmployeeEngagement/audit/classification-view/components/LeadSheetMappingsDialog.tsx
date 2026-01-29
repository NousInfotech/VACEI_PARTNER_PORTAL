import { X, Info } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/Dialog";
import { Button } from "@/ui/Button";

interface LeadSheetMappingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LeadSheetMappingsDialog({ isOpen, onClose }: LeadSheetMappingsDialogProps) {
    // Mock data for the mappings view
    const mappings = [
        {
            id: '1',
            code: '1',
            accountName: 'Cash and cash equivalents',
            classification: 'Assets > Non-current > Intangible assets > Intangible assets - Cost',
            mappingCount: 2,
            items: [
                {
                    range: 'Sheet1!B2:D3',
                    workbook: 'Unknown',
                    refFiles: 1
                },
                {
                    range: 'Sheet1!A2:D4',
                    workbook: 'Unique Ltd.xlsx',
                    refFiles: 1,
                    isHighlighted: true // To match the pink background in screenshot
                }
            ]
        },
        {
            id: '2',
            code: '2',
            accountName: 'Accruals',
            classification: 'Equity > Equity > Share capital',
            mappingCount: 0,
            items: []
        },
        {
            id: '3',
            code: '3',
            accountName: 'FSS & NI DUE',
            classification: '',
            mappingCount: 0,
            items: []
        },
        {
            id: '4',
            code: '4',
            accountName: "Shareholders' Loan",
            classification: '',
            mappingCount: 0,
            items: []
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <DialogTitle className="text-xl font-bold">Lead Sheet Mappings</DialogTitle>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-4 bg-gray-50 flex-1 custom-scrollbar">
                    {mappings.map(group => (
                        <div key={group.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">{group.code} - {group.accountName}</h3>
                                    {group.classification ? (
                                        <p className="text-xs text-gray-500 mt-1">Classification: {group.classification}</p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1 italic">Classification: </p>
                                    )}
                                </div>
                                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
                                    {group.mappingCount} mapping(s)
                                </span>
                            </div>

                            <div className="p-3 bg-white">
                                {group.items.length > 0 ? (
                                    <div className="space-y-3">
                                        {group.items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-lg border flex items-center justify-between ${item.isHighlighted
                                                        ? 'bg-pink-50 border-pink-100'
                                                        : 'bg-gray-50 border-gray-100'
                                                    }`}
                                            >
                                                <div>
                                                    <div className={`text-sm font-medium ${item.isHighlighted ? 'text-pink-900' : 'text-gray-700'}`}>
                                                        Range: {item.range}
                                                    </div>
                                                    <div className={`text-xs mt-1 ${item.isHighlighted ? 'text-pink-700' : 'text-gray-500'}`}>
                                                        Workbook: {item.workbook}
                                                    </div>
                                                    {item.refFiles > 0 && (
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <div className={`text-xs font-medium px-2 py-0.5 rounded border ${item.isHighlighted
                                                                    ? 'bg-pink-100 border-pink-200 text-pink-800'
                                                                    : 'bg-white border-gray-200 text-gray-600'
                                                                }`}>
                                                                {item.refFiles} reference file
                                                            </div>
                                                            <button className={`text-xs flex items-center gap-1 hover:underline ${item.isHighlighted ? 'text-pink-700' : 'text-gray-600'}`}>
                                                                <Info size={12} /> View Files
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline px-2">Select</button>
                                                    <button className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline px-2">Edit</button>
                                                    <button className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline px-2">Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic p-1">No mappings for this row</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
