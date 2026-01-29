import { Bot, User, BrainCircuit } from "lucide-react";

interface GenerateProceduresProps {
    onProceed: () => void;
}

export default function GenerateProcedures({ onProceed }: GenerateProceduresProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Approach</h2>
                <p className="text-gray-500 max-w-md mx-auto">Select how you'd like to generate your procedures</p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full max-w-2xl">
                {/* Manual */}
                <button
                    onClick={onProceed}
                    className="flex items-center gap-6 p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                >
                    <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                        <User className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Manual</h3>
                        <p className="text-sm text-gray-500">Predefined templates</p>
                    </div>
                </button>

                {/* AI */}
                <button
                    onClick={onProceed}
                    className="flex items-center gap-6 p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                >
                    <div className="w-12 h-12 rounded-xl bg-gray-500 flex items-center justify-center shrink-0">
                        <Bot className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">AI</h3>
                        <p className="text-sm text-gray-500">AI-powered generation</p>
                    </div>
                </button>

                {/* Hybrid */}
                <button
                    onClick={onProceed}
                    className="flex items-center gap-6 p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                >
                    <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center shrink-0">
                        <BrainCircuit className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Hybrid</h3>
                        <p className="text-sm text-gray-500">AI + Manual control</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
