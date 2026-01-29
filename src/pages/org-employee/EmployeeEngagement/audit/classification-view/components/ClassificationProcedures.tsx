import { useState } from "react";
import { Sparkles, Eye } from "lucide-react";
import ViewProcedures from "./ViewProcedures";
import MaterialityStep from "./MaterialityStep";
import ClassificationSelectionStep from "./ClassificationSelectionStep";

interface ClassificationProceduresProps {
    title: string;
}

type Mode = 'generate' | 'view';
type WizardStep = 'materiality' | 'classifications';

export default function ClassificationProcedures({ title }: ClassificationProceduresProps) {
    const [mode, setMode] = useState<Mode>('generate');
    const [wizardStep, setWizardStep] = useState<WizardStep>('materiality');
    const [materialityAmount, setMaterialityAmount] = useState<string>('0');

    const handleMaterialityProceed = (amount: string) => {
        setMaterialityAmount(amount || '0');
        setWizardStep('classifications');
    };

    const handleClassificationProceed = () => {
        setMode('view');
    };

    const handleBackToMateriality = () => {
        setWizardStep('materiality');
    };

    return (
        <div className="space-y-8">
            {/* Header */}


            <div className="flex items-center bg-gray-50 p-1.5 rounded-xl border border-gray-100 w-full">
                <button
                    onClick={() => { setMode('generate'); setWizardStep('materiality'); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${mode === 'generate'
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                        }`}
                >
                    <Sparkles size={16} />
                    Generate Procedures
                </button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button
                    onClick={() => setMode('view')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${mode === 'view'
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                        }`}
                >
                    <Eye size={16} />
                    View Procedures
                </button>
            </div>

            {mode === 'generate' && (
                <>
                    {wizardStep === 'materiality' && (
                        <MaterialityStep onProceed={handleMaterialityProceed} />
                    )}
                    {wizardStep === 'classifications' && (
                        <ClassificationSelectionStep
                            mode="manual"
                            stepLabel="Step 2 of 3"
                            materialityAmount={materialityAmount}
                            onProceed={handleClassificationProceed}
                            onBack={handleBackToMateriality}
                        />
                    )}
                </>
            )}

            {mode === 'view' && (
                <ViewProcedures title={title} />
            )}
        </div>
    );
}
