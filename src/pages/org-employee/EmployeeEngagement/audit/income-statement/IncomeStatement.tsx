import { useState, useRef, useEffect } from "react";
import { FileText, ChevronDown, Download, ChevronsDown, ChevronsUp } from "lucide-react";
import { Button } from "../../../../../ui/Button";

export default function IncomeStatement() {
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDownloadOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="p-6 space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start shrink-0">
                <div className="flex gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg h-fit">
                        <FileText size={24} className="text-gray-900" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Income Statement</h2>
                        <p className="text-gray-500 mt-1">
                            Client Company Test • For the year ended 2026
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" className="gap-2 text-gray-600">
                        <ChevronsDown size={18} />
                        Expand All
                    </Button>

                    <Button variant="ghost" className="gap-2 text-gray-600">
                        <ChevronsUp size={18} />
                        Collapse All
                    </Button>

                    {/* Download Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <Button
                            className="gap-2 bg-[#D97706] hover:bg-[#B45309] text-white border-transparent"
                            onClick={() => setIsDownloadOpen((prev) => !prev)}
                        >
                            <Download size={18} />
                            Download PDF
                            <ChevronDown size={16} />
                        </Button>

                        {isDownloadOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <FileText size={16} className="text-gray-400" />
                                    Download Income Statement (Detailed)
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <FileText size={16} className="text-gray-400" />
                                    Download Income Statement
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white">
                <div className="grid grid-cols-[1fr_80px_120px_120px] bg-[rgb(253,230,138)] font-bold text-gray-900 text-sm">
                    <div className="px-6 py-3">Description</div>
                    <div className="px-6 py-3">Notes</div>
                    <div className="px-6 py-3 text-right">2026</div>
                    <div className="px-6 py-3 text-right">2025</div>
                </div>

                <div className="flex-1 bg-white p-6 text-center text-gray-400 text-sm">
                    No data available for display yet.
                </div>
            </div>
        </div>
    );
}
