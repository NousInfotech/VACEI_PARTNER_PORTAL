import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "../../../../../../ui/Button";
import ProcedureQuestions from "./ProcedureQuestions";
import ProcedureAnswers from "./ProcedureAnswers";
import ProcedureSteps from "./ProcedureSteps";

interface ViewProceduresProps {
    title: string;
}

export default function ViewProcedures({ title }: ViewProceduresProps) {
    const [activeSubTab, setActiveSubTab] = useState<'Questions' | 'Answers' | 'Procedures'>('Questions');

    return (
        <div className="space-y-6">
            {/* Helper Text */}
            <p className="text-sm text-gray-500">
                View and manage generated procedures for this classification.
            </p>

            {/* Main Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>GlobalTech Annual Audit</span>
                            <span>•</span>
                            <span>Mode: HYBRID</span>
                            <span>•</span>
                            <span>Materiality: €20.00</span>
                            <span>•</span>
                            <span>Year End: 2026-01-01</span>
                        </div>
                    </div>
                    <Button variant="outline" className="gap-2 text-xs">
                        <Sparkles size={14} />
                        Generate New Questions
                    </Button>
                </div>

                {/* Sub Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50/50">
                    {(['Questions', 'Answers', 'Procedures'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveSubTab(tab)}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeSubTab === tab
                                ? 'border-gray-900 text-gray-900 bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeSubTab === 'Questions' && <ProcedureQuestions />}
                    {activeSubTab === 'Answers' && <ProcedureAnswers />}
                    {activeSubTab === 'Procedures' && <ProcedureSteps />}
                </div>
            </div>
        </div>
    );
}
