import { useState } from "react";
import { RotateCcw, Save, Edit2, X, Check } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

export default function ProcedureAnswers() {
    const [isEditing, setIsEditing] = useState(false);
    const [answerText, setAnswerText] = useState("To verify the existence of intangible assets recorded at a total of 265,769, the following procedures were performed: A sample of 10% of the total intangible assets was selected, which amounts to 26,577. The sample was drawn from the intangible asset register, focusing on assets with significant values. The selected sample included the following transactions: 1) Purchase of software for 15,000 on 2023-01-15, 2) Development costs for a new product totaling 12,000 incurred on 2023-03-10, 3) Licensing agreement for 5,000 dated 2023-06-20. Each selected transaction was supported by appropriate documentation such as purchase agreements and valuation reports. The documentation was reviewed for authenticity and completeness. No exceptions were found in the sample, confirming the existence of the intangible assets. Supporting documentation included purchase agreements and valuation reports stored in the linked Excel files (workbookId: 69208e9162e36b51bb0c84e9).");
    const [tempText, setTempText] = useState(answerText);

    const handleStartEdit = () => {
        setTempText(answerText);
        setIsEditing(true);
    };

    const handleSave = () => {
        setAnswerText(tempText);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempText(answerText);
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg">
                <Button variant="outline" className="gap-2 text-xs bg-white text-gray-900 hover:bg-gray-100 border-gray-200">
                    <RotateCcw size={14} />
                    Regenerate Answers
                </Button>
                <Button className="gap-2 text-xs bg-[#0F172A] hover:bg-[#1E293B] text-white">
                    <Save size={14} />
                    Save Answers
                </Button>
            </div>

            {/* Answer Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                {/* Question Text */}
                <h4 className="text-sm font-semibold text-gray-900 mb-4 leading-relaxed">
                    1. What procedures have been performed to verify the existence of intangible assets recorded at a total of 265,769, ensuring that the balance is supported by appropriate documentation such as purchase agreements or valuation reports? Please provide a sample of at least 10% of the intangible assets, ensuring that the total value of the sample exceeds the materiality threshold of 5,000.
                </h4>

                {/* Answer Content */}
                <div className="text-sm text-gray-600 leading-relaxed space-y-4">
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={tempText}
                                onChange={(e) => setTempText(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[200px]"
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={handleCancel} className="gap-1 text-xs">
                                    <X size={14} /> Cancel
                                </Button>
                                <Button size="sm" onClick={handleSave} className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white">
                                    <Check size={14} /> Save Changes
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p>{answerText}</p>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                    {!isEditing && (
                        <button
                            onClick={handleStartEdit}
                            className="flex items-center gap-2 text-xs text-black font-medium hover:text-gray-700 transition-colors"
                        >
                            <Edit2 size={14} />
                            Edit Answer
                        </button>
                    )}

                    <div className="flex gap-2 ml-auto">
                        <span className="px-2.5 py-1 bg-[#0F172A] text-white text-[10px] font-bold rounded-full">
                            IFRS
                        </span>
                        <span className="px-2.5 py-1 bg-[#0F172A] text-white text-[10px] font-bold rounded-full">
                            ISA 500
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
