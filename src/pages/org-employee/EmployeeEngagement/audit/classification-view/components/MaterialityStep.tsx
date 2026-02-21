import { Calculator, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../../ui/Button";

interface MaterialityStepProps {
    onProceed: (amount: string) => void;
}

export default function MaterialityStep({ onProceed }: MaterialityStepProps) {
    const [amount, setAmount] = useState<string>('');

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">1 / 3 — Set Materiality</h2>

            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator size={20} className="text-gray-900" />
                        <h3 className="font-semibold text-gray-900">Set Materiality Threshold</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Define the materiality threshold for selecting accounts from the Extended Trial Balance. Only accounts with final balances equal to or greater than this amount will be automatically selected for audit procedures.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">Materiality Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter materiality amount"
                            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3">
                    <Info className="shrink-0 text-gray-500" size={20} />
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">Materiality Guidelines:</span> Materiality is typically set as a percentage of key financial statement items (e.g., 5% of net income, 0.5-1% of total assets, or 0.5-1% of revenue). Consider the entity's size, nature, and risk profile when setting materiality.
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    <p className="font-medium text-gray-900">What happens next?</p>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
                        <li>All ETB accounts with final balance ≥ €{amount || 'X'} will be pre-selected</li>
                        <li>You can manually adjust selections in the next step</li>
                        <li>Selected accounts will be used for classification-based procedure generation</li>
                    </ul>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={() => onProceed(amount)} className="bg-gray-600 hover:bg-gray-700 text-white px-6">
                    Proceed to Classifications →
                </Button>
            </div>
        </div>
    );
}
