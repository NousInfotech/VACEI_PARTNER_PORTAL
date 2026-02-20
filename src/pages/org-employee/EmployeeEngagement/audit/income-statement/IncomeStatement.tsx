import { useState, useRef, useEffect } from "react";
import { FileText, ChevronDown, Download, ChevronsDown, ChevronsUp } from "lucide-react";
import { Button } from "../../../../../ui/Button";
import { useETBData } from "../hooks/useETBData";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface IncomeStatementProps {
    engagementId?: string;
}

export default function IncomeStatement({ engagementId }: IncomeStatementProps) {
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // Fetch and process ETB data
    const { data: etbData, isLoading } = useETBData(engagementId);
    const incomeStatement = etbData?.incomeStatement;

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleDownloadPDF = (detailed: boolean = false) => {
        if (!incomeStatement) return;

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
            pdf.text("Income Statement", pageWidth / 2, 20, { align: "center" });

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "normal");
            const yearText = `For the year ended ${incomeStatement.current_year.year}`;
            pdf.text(yearText, pageWidth / 2, 28, { align: "center" });

            // Build table data
            const tableData: any[] = [];

            // Revenue
            if (incomeStatement.current_year.breakdowns['Revenue']) {
                tableData.push([
                    "Revenue",
                    "",
                    formatCurrency(incomeStatement.current_year.breakdowns['Revenue'].value),
                    formatCurrency(incomeStatement.prior_year.breakdowns['Revenue']?.value || 0),
                ]);
            }

            // Cost of sales
            if (incomeStatement.current_year.breakdowns['Cost of sales']) {
                tableData.push([
                    "Cost of sales",
                    "",
                    formatCurrency(incomeStatement.current_year.breakdowns['Cost of sales'].value),
                    formatCurrency(incomeStatement.prior_year.breakdowns['Cost of sales']?.value || 0),
                ]);
            }

            // Gross Profit
            if (incomeStatement.current_year.breakdowns['Revenue'] && incomeStatement.current_year.breakdowns['Cost of sales']) {
                const grossProfitCY = incomeStatement.current_year.breakdowns['Revenue'].value + incomeStatement.current_year.breakdowns['Cost of sales'].value;
                const grossProfitPY = (incomeStatement.prior_year.breakdowns['Revenue']?.value || 0) + (incomeStatement.prior_year.breakdowns['Cost of sales']?.value || 0);
                tableData.push([
                    { content: "Gross Profit", styles: { fontStyle: "bold" } },
                    "",
                    { content: formatCurrency(grossProfitCY), styles: { fontStyle: "bold", halign: "right" } },
                    { content: formatCurrency(grossProfitPY), styles: { fontStyle: "bold", halign: "right" } },
                ]);
            }

            // Operating Expenses
            ['Sales and marketing expenses', 'Administrative expenses'].forEach((key) => {
                if (incomeStatement.current_year.breakdowns[key]) {
                    tableData.push([
                        key,
                        "",
                        formatCurrency(incomeStatement.current_year.breakdowns[key].value),
                        formatCurrency(incomeStatement.prior_year.breakdowns[key]?.value || 0),
                    ]);
                }
            });

            // Other items
            ['Other operating income', 'Investment income', 'Investment losses', 'Finance costs', 'Share of profit of subsidiary', 'PBT Expenses', 'Income tax expense'].forEach((key) => {
                if (incomeStatement.current_year.breakdowns[key]) {
                    tableData.push([
                        key,
                        "",
                        formatCurrency(incomeStatement.current_year.breakdowns[key].value),
                        formatCurrency(incomeStatement.prior_year.breakdowns[key]?.value || 0),
                    ]);
                }
            });

            // Net Result
            const netResultLabel = incomeStatement.current_year.resultType === 'net_profit' ? 'Net Profit' : 'Net Loss';
            tableData.push([
                { content: netResultLabel, styles: { fontStyle: "bold" } },
                "",
                { content: formatCurrency(Math.abs(incomeStatement.current_year.net_result)), styles: { fontStyle: "bold", halign: "right" } },
                { content: formatCurrency(Math.abs(incomeStatement.prior_year.net_result)), styles: { fontStyle: "bold", halign: "right" } },
            ]);

            // Generate table using autoTable
            autoTable(pdf, {
                startY: 35,
                head: [[
                    { content: "Description", styles: { halign: 'left' } },
                    { content: "Notes", styles: { halign: 'center' } },
                    { content: String(incomeStatement.current_year.year), styles: { halign: 'right' } },
                    { content: String(incomeStatement.prior_year.year), styles: { halign: 'right' } },
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
                ? `Income-Statement-Detailed-${incomeStatement.current_year.year}.pdf`
                : `Income-Statement-${incomeStatement.current_year.year}.pdf`;
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
                        <FileText size={24} className="text-gray-900" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Income Statement</h2>
                        <p className="text-gray-500 mt-1">
                            {incomeStatement?.current_year?.year 
                                ? `For the year ended ${incomeStatement.current_year.year}`
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
                                <button 
                                    onClick={() => handleDownloadPDF(true)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <FileText size={16} className="text-gray-400" />
                                    Download Income Statement (Detailed)
                                </button>
                                <button 
                                    onClick={() => handleDownloadPDF(false)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
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
                    <div className="px-6 py-3 text-right">
                        {incomeStatement?.current_year?.year || 'Current Year'}
                    </div>
                    <div className="px-6 py-3 text-right">
                        {incomeStatement?.prior_year?.year || 'Prior Year'}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 bg-white p-6 text-center text-gray-400 text-sm">
                        Loading income statement data...
                    </div>
                ) : !incomeStatement ? (
                <div className="flex-1 bg-white p-6 text-center text-gray-400 text-sm">
                    No data available for display yet.
                </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {/* Revenue */}
                        {incomeStatement.current_year.breakdowns['Revenue'] && (
                            <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm border-b border-gray-100">
                                <div className="text-gray-900 font-medium">Revenue</div>
                                <div></div>
                                <div className="text-right text-gray-900">
                                    {formatCurrency(incomeStatement.current_year.breakdowns['Revenue'].value)}
                                </div>
                                <div className="text-right text-gray-500">
                                    {formatCurrency(incomeStatement.prior_year.breakdowns['Revenue']?.value || 0)}
                                </div>
                            </div>
                        )}

                        {/* Cost of sales */}
                        {incomeStatement.current_year.breakdowns['Cost of sales'] && (
                            <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm border-b border-gray-100">
                                <div className="text-gray-900 font-medium">Cost of sales</div>
                                <div></div>
                                <div className="text-right text-gray-900">
                                    {formatCurrency(incomeStatement.current_year.breakdowns['Cost of sales'].value)}
                                </div>
                                <div className="text-right text-gray-500">
                                    {formatCurrency(incomeStatement.prior_year.breakdowns['Cost of sales']?.value || 0)}
                                </div>
                            </div>
                        )}

                        {/* Gross Profit */}
                        {incomeStatement.current_year.breakdowns['Revenue'] && incomeStatement.current_year.breakdowns['Cost of sales'] && (
                            <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-3 text-sm font-bold border-b-2 border-gray-300 bg-gray-50">
                                <div className="text-gray-900">Gross Profit</div>
                                <div></div>
                                <div className="text-right text-gray-900">
                                    {formatCurrency(
                                        incomeStatement.current_year.breakdowns['Revenue'].value +
                                        incomeStatement.current_year.breakdowns['Cost of sales'].value
                                    )}
                                </div>
                                <div className="text-right text-gray-500">
                                    {formatCurrency(
                                        (incomeStatement.prior_year.breakdowns['Revenue']?.value || 0) +
                                        (incomeStatement.prior_year.breakdowns['Cost of sales']?.value || 0)
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Operating Expenses */}
                        {['Sales and marketing expenses', 'Administrative expenses'].map((key) => {
                            if (!incomeStatement.current_year.breakdowns[key]) return null;
                            return (
                                <div key={key} className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm border-b border-gray-100">
                                    <div className="text-gray-700">{key}</div>
                                    <div></div>
                                    <div className="text-right text-gray-900">
                                        {formatCurrency(incomeStatement.current_year.breakdowns[key].value)}
                                    </div>
                                    <div className="text-right text-gray-500">
                                        {formatCurrency(incomeStatement.prior_year.breakdowns[key]?.value || 0)}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Other items */}
                        {['Other operating income', 'Investment income', 'Investment losses', 'Finance costs', 'Share of profit of subsidiary', 'PBT Expenses', 'Income tax expense'].map((key) => {
                            if (!incomeStatement.current_year.breakdowns[key]) return null;
                            return (
                                <div key={key} className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-2 text-sm border-b border-gray-100">
                                    <div className="text-gray-700">{key}</div>
                                    <div></div>
                                    <div className="text-right text-gray-900">
                                        {formatCurrency(incomeStatement.current_year.breakdowns[key].value)}
                                    </div>
                                    <div className="text-right text-gray-500">
                                        {formatCurrency(incomeStatement.prior_year.breakdowns[key]?.value || 0)}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Net Result */}
                        <div className="grid grid-cols-[1fr_80px_120px_120px] px-6 py-4 text-sm font-bold border-t-2 border-gray-300 bg-[rgb(253,230,138)]">
                            <div className="text-gray-900">
                                {incomeStatement.current_year.resultType === 'net_profit' ? 'Net Profit' : 'Net Loss'}
                            </div>
                            <div></div>
                            <div className={`text-right ${incomeStatement.current_year.resultType === 'net_profit' ? 'text-green-700' : 'text-red-700'}`}>
                                {formatCurrency(Math.abs(incomeStatement.current_year.net_result))}
                            </div>
                            <div className={`text-right ${incomeStatement.prior_year.resultType === 'net_profit' ? 'text-green-700' : 'text-red-700'}`}>
                                {formatCurrency(Math.abs(incomeStatement.prior_year.net_result))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
