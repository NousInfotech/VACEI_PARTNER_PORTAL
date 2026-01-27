import { useState } from "react";
import { Plus, RotateCcw, Download, Save, Edit2, Trash2, Check, X } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

export default function ProcedureQuestions() {
    const [questions, setQuestions] = useState([
        {
            id: 1,
            text: "What procedures have been performed to verify the existence of intangible assets recorded at a total of 265,769, ensuring that the balance is supported by appropriate documentation such as purchase agreements or valuation reports? Please provide a sample of at least 10% of the intangible assets, ensuring that the total value of the sample exceeds the materiality threshold of 5,000.",
            tags: ["IFRS", "ISA 500"]
        }
    ]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");

    const handleAddQuestion = () => {
        const newId = -Date.now();
        const newQuestion = { id: newId, text: "", tags: ["Draft"] };
        setQuestions(prev => [...prev, newQuestion]);
        setEditingId(newId);
        setEditText("");
    };

    const handleDelete = (id: number) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    const startEdit = (id: number, text: string) => {
        setEditingId(id);
        setEditText(text);
    };

    const saveEdit = (id: number) => {
        if (!editText.trim()) return;

        setQuestions(prev => prev.map(q =>
            q.id === id
                ? { ...q, id: id < 0 ? Date.now() : id, text: editText, tags: id < 0 ? ["New"] : q.tags }
                : q
        ));
        setEditingId(null);
    };

    const cancelEdit = (id: number) => {
        if (id < 0) {
            setQuestions(prev => prev.filter(q => q.id !== id));
        }
        setEditingId(null);
        setEditText("");
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={handleAddQuestion} className="gap-2 text-xs">
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
                                {editingId === q.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            rows={4}
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => saveEdit(q.id)} className="gap-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white">
                                                <Check size={12} /> Save
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => cancelEdit(q.id)} className="gap-1 h-7 text-xs">
                                                <X size={12} /> Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => startEdit(q.id, q.text)}
                                    className="p-1.5 text-black hover:text-gray-700 rounded"
                                    disabled={editingId !== null}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    className="p-1.5 text-black hover:text-gray-700 rounded"
                                    disabled={editingId !== null}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
