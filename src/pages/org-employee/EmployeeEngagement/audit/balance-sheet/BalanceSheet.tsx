import { useState, useRef, useEffect } from "react";
import { Scale, ChevronDown, Download, ChevronsDown, ChevronsUp, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "../../../../../ui/Button";

export default function BalanceSheet() {
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const downloadRef = useRef<HTMLDivElement>(null);

    // State for collapsible sections
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        "non-current": true,
        "intangible-assets": true,
        "equity": true,
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Mock values
    const totalAssets = 265769;
    const totalLiabilities = 0;
    const totalEquity = 5285;
    const totalEquityAndLiabilities = totalEquity + totalLiabilities;
    const difference = totalAssets - totalEquityAndLiabilities;
    const isBalanced = difference === 0;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
                setIsDownloadOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const renderExapandIcon = (isOpen: boolean) => {
        return isOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-400" />;
    };

    return (
        <div className="p-6 space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start shrink-0">
                <div className="flex gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg h-fit">
                        <Scale size={24} className="text-gray-900" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Balance Sheet</h2>
                        <p className="text-gray-500 mt-1">Client Company Test • As at Dec 31, 2026</p>
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

                    <div className="relative" ref={downloadRef}>
                        <Button
                            className="gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white border-transparent"
                            onClick={() => setIsDownloadOpen((prev) => !prev)}
                        >
                            <Download size={18} />
                            Download PDF
                            <ChevronDown size={16} />
                        </Button>

                        {isDownloadOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <button className="w-full text-left px-4 py-3 text-sm text-[#0F172A] hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                    <Scale size={18} className="text-gray-400" />
                                    <span>
                                        Download Balance Sheet<br />
                                        <span className="text-gray-500">(Detailed)</span>
                                    </span>
                                </button>
                                <button className="w-full text-left px-4 py-3 text-sm text-[#0F172A] hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                    <Scale size={18} className="text-gray-400" />
                                    <span>Download Balance Sheet</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {!isBalanced && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-red-900">Balance Sheet does not balance!</h4>
                        <p className="text-sm text-red-700 mt-1">
                            The accounting equation (Assets = Liabilities + Equity) is not satisfied. Please review your classifications.
                        </p>
                    </div>
                </div>
            )}

            {/* Content Table */}
            <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_80px_120px_120px] bg-[rgb(253,230,138)] font-bold text-gray-900 text-sm">
                    <div className="px-6 py-3">Description</div>
                    <div className="px-6 py-3">Notes</div>
                    <div className="px-6 py-3 text-right">2026</div>
                    <div className="px-6 py-3 text-right">2025</div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* ASSETS Section */}
                    <div className="bg-gray-200/50 px-6 py-3 font-bold text-xs text-gray-700 uppercase tracking-wider">
                        ASSETS
                    </div>

                    <div className="divide-y divide-gray-50">
                        {/* Non-current Header - Clickable */}
                        <div
                            className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-3 text-sm font-medium hover:bg-gray-50 cursor-pointer select-none"
                            onClick={() => toggleSection('non-current')}
                        >
                            <div className="flex items-center gap-2">
                                {renderExapandIcon(openSections['non-current'])}
                                Non-current
                            </div>
                            <div></div>
                            <div className="text-right font-bold">{formatNumber(265769)}</div>
                            <div className="text-right font-bold">{formatNumber(217685)}</div>
                        </div>

                        {/* Collapsible Content for Non-current */}
                        {openSections['non-current'] && (
                            <>
                                {/* Intangible Assets Group - Clickable */}
                                <div
                                    className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 pl-10 cursor-pointer select-none"
                                    onClick={() => toggleSection('intangible-assets')}
                                >
                                    <div className="flex items-center gap-2">
                                        {renderExapandIcon(openSections['intangible-assets'])}
                                        Intangible assets
                                    </div>
                                    <div></div>
                                    <div className="text-right">{formatNumber(265769)}</div>
                                    <div className="text-right">{formatNumber(217685)}</div>
                                </div>

                                {/* Collapsible Content for Intangible Assets */}
                                {openSections['intangible-assets'] && (
                                    <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm text-gray-500 hover:bg-gray-50 pl-16">
                                        <div className="flex items-center gap-2">
                                            Intangible assets - Cost
                                        </div>
                                        <div></div>
                                        <div className="text-right">{formatNumber(265769)}</div>
                                        <div className="text-right">{formatNumber(217685)}</div>
                                    </div>
                                )}

                                {/* Cash Row */}
                                <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm text-gray-500 hover:bg-gray-50 pl-10">
                                    <div className="ml-6">Cash and cash equivalents</div>
                                    <div>1</div>
                                    <div className="text-right">{formatNumber(285769)}</div>
                                    <div className="text-right">{formatNumber(217685)}</div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Total Assets */}
                    <div className="grid grid-cols-[1fr_80px_120px_120px] bg-[rgb(253,230,138)] px-6 py-3 text-sm font-bold border-y border-yellow-200">
                        <div>Total Assets</div>
                        <div></div>
                        <div className="text-right">{formatNumber(totalAssets)}</div>
                        <div className="text-right">{formatNumber(217685)}</div>
                    </div>

                    {/* EQUITY AND LIABILITIES Section */}
                    <div className="bg-gray-200/50 px-6 py-3 font-bold text-xs text-gray-700 uppercase tracking-wider mt-4">
                        EQUITY AND LIABILITIES
                    </div>

                    <div className="bg-gray-100/50 px-6 py-2 font-bold text-xs text-gray-600 uppercase tracking-wider">
                        EQUITY
                    </div>

                    <div className="divide-y divide-gray-50">
                        {/* Equity Group - Clickable */}
                        <div
                            className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-3 text-sm font-medium hover:bg-gray-50 cursor-pointer select-none"
                            onClick={() => toggleSection('equity')}
                        >
                            <div className="flex items-center gap-2">
                                {renderExapandIcon(openSections['equity'])}
                                Equity
                            </div>
                            <div></div>
                            <div className="text-right font-bold">{formatNumber(5285)}</div>
                            <div className="text-right font-bold">{formatNumber(4285)}</div>
                        </div>

                        {/* Collapsible Content for Equity */}
                        {openSections['equity'] && (
                            <>
                                {/* Share Capital Row */}
                                <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm text-gray-500 hover:bg-gray-50 pl-10">
                                    <div className="flex items-center gap-2 ml-6">
                                        Share capital
                                    </div>
                                    <div></div>
                                    <div className="text-right">{formatNumber(5285)}</div>
                                    <div className="text-right">{formatNumber(4285)}</div>
                                </div>

                                {/* Accruals Row */}
                                <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm text-gray-500 hover:bg-gray-50 pl-10">
                                    <div className="ml-6">Accruals</div>
                                    <div>2</div>
                                    <div className="text-right">{formatNumber(5285)}</div>
                                    <div className="text-right">{formatNumber(4285)}</div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Total Equity */}
                    <div className="grid grid-cols-[1fr_80px_120px_120px] bg-[rgb(253,230,138)]/50 px-6 py-3 text-sm font-bold border-y border-yellow-200">
                        <div>Total Equity</div>
                        <div></div>
                        <div className="text-right">{formatNumber(totalEquity)}</div>
                        <div className="text-right">{formatNumber(4285)}</div>
                    </div>

                    {/* Total Equity and Liabilities */}
                    <div className="grid grid-cols-[1fr_80px_120px_120px] bg-[rgb(253,230,138)] px-6 py-3 text-sm font-bold border-y border-yellow-200 mt-4">
                        <div>Total Equity and Liabilities</div>
                        <div></div>
                        <div className="text-right">{formatNumber(totalEquityAndLiabilities)}</div>
                        <div className="text-right">{formatNumber(4285)}</div>
                    </div>

                    {/* Balance Check Row */}
                    <div className={`grid grid-cols-[1fr_80px_120px_120px] px-6 py-3 text-sm font-bold border-t-2 ${isBalanced ? "bg-green-50 border-green-500 text-green-900" : "bg-red-50 border-red-500 text-gray-900"
                        }`}>
                        <div>Balance Check (Assets = Liabilities + Equity)</div>
                        <div></div>
                        <div className="text-right">{formatNumber(difference)}</div>
                        <div className="text-right">{formatNumber(213400)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
