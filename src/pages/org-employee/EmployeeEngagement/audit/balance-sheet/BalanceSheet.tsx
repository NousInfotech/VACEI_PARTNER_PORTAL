import { useState, useRef, useEffect } from "react";
import { Scale, ChevronDown, Download, ChevronsDown, ChevronsUp, AlertTriangle } from "lucide-react";
import { Button } from "../../../../../ui/Button";
import { useETBData } from "../hooks/useETBData";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BalanceSheetProps {
    engagementId?: string;
}

export default function BalanceSheet({ engagementId }: BalanceSheetProps) {
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const downloadRef = useRef<HTMLDivElement>(null);

    // Fetch and process ETB data
    const { data: etbData, isLoading } = useETBData(engagementId);
    const balanceSheet = etbData?.balanceSheet;

    // Calculate values from data
    const totalAssets = balanceSheet?.current_year?.totals?.total_assets?.value || 0;
    const totalEquityAndLiabilities = balanceSheet?.current_year?.totals?.total_equity_and_liabilities?.value || 0;
    const difference = totalAssets - totalEquityAndLiabilities;
    const isBalanced = balanceSheet?.current_year?.balanced ?? false;

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

    const handleDownloadPDF = (detailed: boolean = false) => {
        if (!balanceSheet) return;

        setIsDownloadOpen(false);

        try {
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pageWidth = pdf.internal.pageSize.getWidth();

            // Header
            pdf.setFontSize(16);
            pdf.setFont("helvetica", "bold");
            pdf.text("Balance Sheet", pageWidth / 2, 20, { align: "center" });

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "normal");
            const yearText = `As at Dec 31, ${balanceSheet.current_year.year}`;
            pdf.text(yearText, pageWidth / 2, 28, { align: "center" });

            // Build table data
            const tableData: any[] = [];

            // ASSETS Section
            tableData.push([
                { content: "ASSETS", styles: { fontStyle: "bold", fontSize: 11 } },
                "",
                "",
                "",
            ]);
            tableData.push([
                { content: "Assets", styles: { fontStyle: "bold" } },
                "",
                formatNumber(balanceSheet.current_year.totals.assets.value),
                formatNumber(balanceSheet.prior_year.totals.assets.value),
            ]);
            tableData.push([
                { content: "Total Assets", styles: { fontStyle: "bold" } },
                "",
                { content: formatNumber(balanceSheet.current_year.totals.total_assets.value), styles: { fontStyle: "bold", halign: "right" } },
                { content: formatNumber(balanceSheet.prior_year.totals.total_assets.value), styles: { fontStyle: "bold", halign: "right" } },
            ]);

            // Spacing
            tableData.push(["", "", "", ""]);

            // EQUITY AND LIABILITIES Section
            tableData.push([
                { content: "EQUITY AND LIABILITIES", styles: { fontStyle: "bold", fontSize: 11 } },
                "",
                "",
                "",
            ]);
            tableData.push([
                { content: "LIABILITIES", styles: { fontStyle: "bold" } },
                "",
                "",
                "",
            ]);
            tableData.push([
                { content: "Liabilities", styles: { fontStyle: "bold" } },
                "",
                formatNumber(balanceSheet.current_year.totals.liabilities.value),
                formatNumber(balanceSheet.prior_year.totals.liabilities.value),
            ]);

            // Spacing
            tableData.push(["", "", "", ""]);

            // EQUITY
            tableData.push([
                { content: "EQUITY", styles: { fontStyle: "bold" } },
                "",
                "",
                "",
            ]);
            tableData.push([
                { content: "Equity", styles: { fontStyle: "bold" } },
                "",
                formatNumber(balanceSheet.current_year.totals.equity.value),
                formatNumber(balanceSheet.prior_year.totals.equity.value),
            ]);
            tableData.push([
                { content: "Total Equity", styles: { fontStyle: "bold" } },
                "",
                { content: formatNumber(balanceSheet.current_year.totals.equity.value), styles: { fontStyle: "bold", halign: "right" } },
                { content: formatNumber(balanceSheet.prior_year.totals.equity.value), styles: { fontStyle: "bold", halign: "right" } },
            ]);
            tableData.push([
                { content: "Total Equity and Liabilities", styles: { fontStyle: "bold" } },
                "",
                { content: formatNumber(balanceSheet.current_year.totals.total_equity_and_liabilities.value), styles: { fontStyle: "bold", halign: "right" } },
                { content: formatNumber(balanceSheet.prior_year.totals.total_equity_and_liabilities.value), styles: { fontStyle: "bold", halign: "right" } },
            ]);

            // Balance Check
            const balanceCheckCY = balanceSheet.current_year.totals.total_assets.value - balanceSheet.current_year.totals.total_equity_and_liabilities.value;
            const balanceCheckPY = balanceSheet.prior_year.totals.total_assets.value - balanceSheet.prior_year.totals.total_equity_and_liabilities.value;
            const balanceColor = isBalanced ? [200, 255, 200] : [255, 200, 200];
            tableData.push([
                { content: "Balance Check (Assets = Liabilities + Equity)", styles: { fontStyle: "bold" } },
                "",
                { content: formatNumber(balanceCheckCY), styles: { fontStyle: "bold", halign: "right", fillColor: balanceColor } },
                { content: formatNumber(balanceCheckPY), styles: { fontStyle: "bold", halign: "right", fillColor: balanceColor } },
            ]);

            // Generate table using autoTable
            autoTable(pdf, {
                startY: 35,
                head: [[
                    { content: "Description", styles: { halign: 'left' } },
                    { content: "Notes", styles: { halign: 'center' } },
                    { content: String(balanceSheet.current_year.year), styles: { halign: 'right' } },
                    { content: String(balanceSheet.prior_year.year), styles: { halign: 'right' } },
                ]],
                body: tableData,
                theme: "plain",
                headStyles: { 
                    fillColor: [253, 230, 138], 
                    textColor: [0, 0, 0], 
                    fontStyle: "bold", 
                    lineWidth: { bottom: 0 }, 
                    lineColor: [0, 0, 0] 
                },
                styles: { 
                    fontSize: 9, 
                    textColor: [0, 0, 0], 
                    lineColor: [0, 0, 0] 
                },
                columnStyles: {
                    0: { cellWidth: 'auto', textColor: [0, 0, 0] },
                    1: { cellWidth: 20, halign: 'center', textColor: [0, 0, 0] },
                    2: { cellWidth: 'auto', halign: 'right', textColor: [0, 0, 0] },
                    3: { cellWidth: 'auto', halign: 'right', textColor: [0, 0, 0] },
                },
            });

            const fileName = detailed 
                ? `Balance-Sheet-Detailed-${balanceSheet.current_year.year}.pdf`
                : `Balance-Sheet-${balanceSheet.current_year.year}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        }
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
                        <p className="text-gray-500 mt-1">
                            {balanceSheet?.current_year?.year 
                                ? `As at Dec 31, ${balanceSheet.current_year.year}`
                                : 'Loading...'}
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
                                <button 
                                    onClick={() => handleDownloadPDF(true)}
                                    className="w-full text-left px-4 py-3 text-sm text-[#0F172A] hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                    <Scale size={18} className="text-gray-400" />
                                    <span>
                                        Download Balance Sheet<br />
                                        <span className="text-gray-500">(Detailed)</span>
                                    </span>
                                </button>
                                <button 
                                    onClick={() => handleDownloadPDF(false)}
                                    className="w-full text-left px-4 py-3 text-sm text-[#0F172A] hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
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
                    <div className="px-6 py-3 text-right">
                        {balanceSheet?.current_year?.year || 'Current Year'}
                    </div>
                    <div className="px-6 py-3 text-right">
                        {balanceSheet?.prior_year?.year || 'Prior Year'}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 bg-white p-6 text-center text-gray-400 text-sm">
                        Loading balance sheet data...
                    </div>
                ) : !balanceSheet ? (
                    <div className="flex-1 bg-white p-6 text-center text-gray-400 text-sm">
                        No data available for display yet.
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {/* ASSETS Section */}
                        <div className="bg-gray-200/50 px-6 py-3 font-bold text-xs text-gray-700 uppercase tracking-wider">
                            ASSETS
                        </div>

                        {/* Assets Total */}
                        <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm text-gray-700">
                            <div className="font-medium">Assets</div>
                            <div></div>
                            <div className="text-right font-bold">{formatNumber(balanceSheet.current_year.totals.assets.value)}</div>
                            <div className="text-right text-gray-500">{formatNumber(balanceSheet.prior_year.totals.assets.value)}</div>
                        </div>

                        {/* Total Assets */}
                        <div className="grid grid-cols-[1fr_80px_120px_120px] bg-[rgb(253,230,138)] px-6 py-3 text-sm font-bold border-y border-yellow-200">
                            <div>Total Assets</div>
                            <div></div>
                            <div className="text-right">{formatNumber(balanceSheet.current_year.totals.total_assets.value)}</div>
                            <div className="text-right">{formatNumber(balanceSheet.prior_year.totals.total_assets.value)}</div>
                        </div>

                        {/* EQUITY AND LIABILITIES Section */}
                        <div className="bg-gray-200/50 px-6 py-3 font-bold text-xs text-gray-700 uppercase tracking-wider mt-4">
                            EQUITY AND LIABILITIES
                        </div>

                        {/* LIABILITIES */}
                        <div className="bg-gray-100/50 px-6 py-2 font-bold text-xs text-gray-600 uppercase tracking-wider">
                            LIABILITIES
                        </div>

                        <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm text-gray-700">
                            <div className="font-medium">Liabilities</div>
                            <div></div>
                            <div className="text-right font-bold">{formatNumber(balanceSheet.current_year.totals.liabilities.value)}</div>
                            <div className="text-right text-gray-500">{formatNumber(balanceSheet.prior_year.totals.liabilities.value)}</div>
                        </div>

                        {/* EQUITY */}
                        <div className="bg-gray-100/50 px-6 py-2 font-bold text-xs text-gray-600 uppercase tracking-wider mt-4">
                            EQUITY
                        </div>

                        <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm text-gray-700">
                            <div className="font-medium">Equity</div>
                            <div></div>
                            <div className="text-right font-bold">{formatNumber(balanceSheet.current_year.totals.equity.value)}</div>
                            <div className="text-right text-gray-500">{formatNumber(balanceSheet.prior_year.totals.equity.value)}</div>
                        </div>

                        {/* Total Equity */}
                        <div className="grid grid-cols-[1fr_80px_120px_120px] bg-[rgb(253,230,138)]/50 px-6 py-3 text-sm font-bold border-y border-yellow-200">
                            <div>Total Equity</div>
                            <div></div>
                            <div className="text-right">{formatNumber(balanceSheet.current_year.totals.equity.value)}</div>
                            <div className="text-right">{formatNumber(balanceSheet.prior_year.totals.equity.value)}</div>
                        </div>

                        {/* Total Equity and Liabilities */}
                        <div className="grid grid-cols-[1fr_80px_120px_120px] bg-[rgb(253,230,138)] px-6 py-3 text-sm font-bold border-y border-yellow-200 mt-4">
                            <div>Total Equity and Liabilities</div>
                            <div></div>
                            <div className="text-right">{formatNumber(balanceSheet.current_year.totals.total_equity_and_liabilities.value)}</div>
                            <div className="text-right">{formatNumber(balanceSheet.prior_year.totals.total_equity_and_liabilities.value)}</div>
                        </div>

                        {/* Balance Check Row */}
                        <div className={`grid grid-cols-[1fr_80px_120px_120px] px-6 py-3 text-sm font-bold border-t-2 ${isBalanced ? "bg-green-50 border-green-500 text-green-900" : "bg-red-50 border-red-500 text-gray-900"
                            }`}>
                            <div>Balance Check (Assets = Liabilities + Equity)</div>
                            <div></div>
                            <div className="text-right">{formatNumber(difference)}</div>
                            <div className="text-right">{formatNumber(balanceSheet.prior_year.totals.total_assets.value - balanceSheet.prior_year.totals.total_equity_and_liabilities.value)}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
