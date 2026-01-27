import { useState } from "react";
import { Sparkles, Eye } from "lucide-react";
import GenerateProcedures from "./GenerateProcedures";
import ViewProcedures from "./ViewProcedures";

interface ClassificationProceduresProps {
    title: string;
}

export default function ClassificationProcedures({ title }: ClassificationProceduresProps) {
    const [mode, setMode] = useState<'generate' | 'view'>('generate');

    return (
        <div className="space-y-6">
            {/* Top Navigation / Mode Toggle */}
            <div className="flex justify-between items-center bg-gray-50 p-1 rounded-lg border border-gray-200">
                <button
                    onClick={() => setMode('generate')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'generate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Sparkles size={16} />
                    Generate Procedures
                </button>
                <button
                    onClick={() => setMode('view')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'view' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Eye size={16} />
                    View Procedures
                </button>
            </div>

            {mode === 'generate' && (
                <GenerateProcedures onProceed={() => console.log("Proceeding to next step")} />
            )}

            {mode === 'view' && (
                <ViewProcedures title={title} />
            )}
        </div>
    );
}
