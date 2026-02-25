interface SummaryCardProps {
    label: string;
    value: string;
}

function SummaryCard({ label, value }: SummaryCardProps) {
    return (
        <div className="bg-card border border-gray-200 rounded-lg p-4 flex flex-col justify-center h-24 shadow-sm text-card-foreground">
            <span className="text-xs text-muted-foreground font-medium mb-1">{label}</span>
            <span className="text-xl font-semibold text-foreground">{value}</span>
        </div>
    );
}

interface ClassificationSummaryProps {
    currentYear: number;
    priorYear: number;
    adjustments: number;
    finalBalance: number;
}

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

export default function ClassificationSummary({ currentYear, priorYear, adjustments, finalBalance }: ClassificationSummaryProps) {
    return (
        <div className="grid grid-cols-4 gap-4">
            <SummaryCard label="Current Year" value={formatNumber(currentYear)} />
            <SummaryCard label="Prior Year" value={formatNumber(priorYear)} />
            <SummaryCard label="Adjustments" value={formatNumber(adjustments)} />
            <SummaryCard label="Final Balance" value={formatNumber(finalBalance)} />
        </div>
    );
}
