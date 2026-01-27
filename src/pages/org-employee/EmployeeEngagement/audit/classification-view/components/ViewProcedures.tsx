import { useState } from "react";
import { Sparkles, Plus, RotateCcw, Download, Save, Edit2, Trash2 } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

interface ViewProceduresProps {
    title: string;
}

export default function ViewProcedures({ title }: ViewProceduresProps) {
    const [activeSubTab, setActiveSubTab] = useState<'Questions' | 'Answers' | 'Procedures'>('Questions');

    const questions = [
        {
            id: 1,
            text: "What procedures have been performed to verify the existence of intangible assets recorded at a total of 265,769, ensuring that the balance is supported by appropriate documentation such as purchase agreements or valuation reports? Please provide a sample of at least 10% of the intangible assets, ensuring that the total value of the sample exceeds the materiality threshold of 5,000.",
            tags: ["IFRS", "ISA 500"]
        }
    ];

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
                    {['Questions', 'Answers', 'Procedures'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveSubTab(tab as any)}
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
                    {activeSubTab === 'Questions' && (
                        <div className="space-y-6">
                            {/* Action Bar */}
                            <div className="flex justify-between items-center">
                                <Button variant="outline" className="gap-2 text-xs">
                                    <Plus size={14} />
                                    Add Question
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="gap-2 text-xs">
                                        <RotateCcw size={14} />
                                        Regenerate Questions
                                    </Button>
                                    <Button variant="outline" className="gap-2 text-xs">
                                        <Download size={14} />
                                        Export PDF
                                    </Button>
                                    <Button className="gap-2 text-xs bg-black hover:bg-gray-800 text-white">
                                        <Save size={14} />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-4">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="p-4 border border-gray-200 rounded-lg bg-white relative group">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900 leading-relaxed">
                                                    <span className="font-bold mr-1">{idx + 1}.</span>
                                                    {q.text}
                                                </p>
                                                <div className="flex gap-2 mt-3">
                                                    {q.tags.map(tag => (
                                                        <span key={tag} className="px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSubTab !== 'Questions' && (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            {activeSubTab} content placeholder
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
