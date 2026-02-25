import { Bot, User, Users } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/ui/card";

interface GenerateProceduresProps {
    onProceed: (mode: 'manual' | 'ai' | 'hybrid') => void;
}

const APPROACHES = [
    { id: 'manual' as const, title: 'Manual', description: 'Predefined templates', icon: User, color: 'bg-primary' },
    { id: 'ai' as const, title: 'AI', description: 'AI-powered generation', icon: Bot, color: 'bg-accent' },
    { id: 'hybrid' as const, title: 'Hybrid', description: 'AI + Manual control', icon: Users, color: 'bg-secondary' },
];

export default function GenerateProcedures({ onProceed }: GenerateProceduresProps) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h3 className="font-heading text-2xl font-bold text-foreground text-gray-900 mb-2">Choose Your Approach</h3>
                <p className="text-muted-foreground font-body text-gray-500 text-sm">Select how you&apos;d like to generate your procedures</p>
            </div>

            <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
                {APPROACHES.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Card
                            key={item.id}
                            className="w-full cursor-pointer transition-all duration-200 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                            onClick={() => onProceed(item.id)}
                        >
                            <CardHeader className="p-4">
                                <div className="flex flex-row items-center gap-4">
                                    <div className={`shrink-0 p-3 rounded-lg ${item.color} text-white`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="font-heading text-lg font-bold text-gray-900 mb-0.5">{item.title}</CardTitle>
                                        <p className="text-muted-foreground font-body text-sm text-gray-600">{item.description}</p>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
