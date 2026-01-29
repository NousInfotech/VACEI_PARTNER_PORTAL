import { Calculator, Info, ArrowLeft, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../../ui/Button";

interface CompletionMaterialityStepProps {
    onProceed: (amount: string) => void;
    onBack?: () => void;
    mode?: 'manual' | 'ai' | 'hybrid';
}

export default function CompletionMaterialityStep({ onProceed, onBack, mode = 'manual' }: CompletionMaterialityStepProps) {
    const [amount, setAmount] = useState<string>('');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors mr-2"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded uppercase flex items-center gap-1 border border-gray-200">
                        {mode === 'manual' && <span className="w-2 h-2 rounded-full bg-gray-500"></span>}
                        {mode === 'ai' && <Sparkles size={10} className="text-purple-500" />}
                        {mode} Mode
                    </span>
                    <h2 className="text-xl font-semibold text-gray-900">Set Materiality</h2>
                </div>
                <div className="text-sm text-gray-500 font-medium">Step 1 of 4</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator size={20} className="text-gray-900" />
                        <h3 className="font-semibold text-gray-900">Set Completion Materiality</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Define the materiality threshold for completion procedures. This will be used to assess the significance of findings and final review procedures.
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
                    <Info className="flex-shrink-0 text-gray-500" size={20} />
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">Completion Materiality:</span> This threshold will be used throughout the completion phase to assess the significance of audit findings, unadjusted errors, and final review procedures.
                    </p>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={() => onProceed(amount)} className="bg-gray-600 hover:bg-gray-700 text-white px-6">
                    Proceed to Sections →
                </Button>
            </div>
        </div>
    );
}
