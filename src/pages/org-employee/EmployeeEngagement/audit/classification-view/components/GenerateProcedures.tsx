import { Calculator, ArrowRight, Info } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

interface GenerateProceduresProps {
    onProceed: () => void;
}

export default function GenerateProcedures({ onProceed }: GenerateProceduresProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">1 / 3 — Set Materiality</h2>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8">
                {/* Header Section */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator className="text-gray-900" size={20} />
                        <h3 className="text-lg font-bold text-gray-900">Set Materiality Threshold</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Define the materiality threshold for selecting accounts from the Extended Trial Balance. Only accounts with final balances equal to or greater than this amount will be automatically selected for audit procedures.
                    </p>
                </div>

                {/* Input Section */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900">Materiality Amount</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-medium">€</span>
                        </div>
                        <input
                            type="number"
                            className="block w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter materiality amount"
                        />
                    </div>
                </div>

                {/* Guidelines Alert */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3">
                    <Info className="text-gray-500 shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm font-bold text-gray-900 mb-1">Materiality Guidelines:</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Materiality is typically set as a percentage of key financial statement items (e.g., 5% of net income, 0.5-1% of total assets, or 0.5-1% of revenue). Consider the entity's size, nature, and risk profile when setting materiality.
                        </p>
                    </div>
                </div>

                {/* What happens next */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">What happens next?</h4>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                            All ETB accounts with final balance ≥ $X will be pre-selected
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                            You can manually adjust selections in the next step
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                            Selected accounts will be used for classification-based procedure generation
                        </li>
                    </ul>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={onProceed} className="gap-2 bg-gray-500 hover:bg-gray-600 text-white">
                    Proceed to Classifications
                    <ArrowRight size={16} />
                </Button>
            </div>
        </div>
    );
}
