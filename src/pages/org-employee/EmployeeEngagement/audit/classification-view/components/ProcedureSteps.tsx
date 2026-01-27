import { useState } from "react";
import { FileText, RotateCcw, Plus, Save, Edit2, Trash2, Check, X } from "lucide-react";
import { Button } from "../../../../../../ui/Button";

interface Procedure {
    id: number;
    text: string;
    isCompleted: boolean;
}

export default function ProcedureSteps() {
    const [procedures, setProcedures] = useState<Procedure[]>([
        {
            id: 1,
            text: "Conduct a detailed review of all intangible asset purchase agreements and valuation reports totaling €265,769, ensuring at least 100% of transactions over €50,000 are verified for existence and accuracy through supporting documentation - ISA 500",
            isCompleted: false
        }
    ]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");

    const handleAddProcedure = () => {
        const newId = -Date.now();
        const newProcedure: Procedure = { id: newId, text: "", isCompleted: false };
        setProcedures(prev => [...prev, newProcedure]);
        setEditingId(newId);
        setEditText("");
    };

    const handleDelete = (id: number) => {
        setProcedures(prev => prev.filter(p => p.id !== id));
    };

    const toggleComplete = (id: number) => {
        setProcedures(prev => prev.map(p =>
            p.id === id ? { ...p, isCompleted: !p.isCompleted } : p
        ));
    };

    const startEdit = (id: number, text: string) => {
        setEditingId(id);
        setEditText(text);
    };

    const saveEdit = (id: number) => {
        if (!editText.trim()) return;

        setProcedures(prev => prev.map(p =>
            p.id === id
                ? { ...p, id: id < 0 ? Date.now() : id, text: editText }
                : p
        ));
        setEditingId(null);
    };

    const cancelEdit = (id: number) => {
        if (id < 0) {
            setProcedures(prev => prev.filter(p => p.id !== id));
        }
        setEditingId(null);
        setEditText("");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Audit Recommendations</h3>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 text-xs bg-white text-gray-700 hover:bg-gray-50">
                        <FileText size={14} />
                        Reviews
                    </Button>
                    <Button variant="outline" className="gap-2 text-xs bg-white text-gray-700 hover:bg-gray-50">
                        <RotateCcw size={14} />
                        Regenerate Procedures
                    </Button>
                    <Button variant="outline" onClick={handleAddProcedure} className="gap-2 text-xs bg-white text-gray-700 hover:bg-gray-50">
                        <Plus size={14} />
                        Add Procedures
                    </Button>
                    <Button className="gap-2 text-xs bg-[#0F172A] hover:bg-[#1E293B] text-white">
                        <Save size={14} />
                        Save Procedures
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {procedures.map((proc) => (
                    <div key={proc.id} className="p-4 flex items-start gap-4 group hover:bg-gray-50/50 transition-colors">
                        <div className="mt-1">
                            <button
                                onClick={() => toggleComplete(proc.id)}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${proc.isCompleted
                                    ? 'bg-[#0F172A] border-[#0F172A] text-white'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {proc.isCompleted && <Check size={12} strokeWidth={3} />}
                            </button>
                        </div>
                        <div className="flex-1">
                            {editingId === proc.id ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        rows={3}
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => saveEdit(proc.id)} className="gap-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white">
                                            <Check size={12} /> Save
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => cancelEdit(proc.id)} className="gap-1 h-7 text-xs">
                                            <X size={12} /> Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className={`text-sm leading-relaxed font-medium transition-colors cursor-pointer ${proc.isCompleted ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-900'
                                    }`} onClick={() => toggleComplete(proc.id)}>
                                    {proc.text}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => startEdit(proc.id, proc.text)}
                                className="p-1.5 text-black hover:text-gray-700 rounded transition-colors"
                                disabled={editingId !== null}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(proc.id)}
                                className="p-1.5 text-black hover:text-gray-700 rounded transition-colors"
                                disabled={editingId !== null}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
