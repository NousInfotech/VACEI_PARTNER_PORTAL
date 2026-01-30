import { CheckCircle2, Circle, Clock, ArrowRight, Download, Upload } from 'lucide-react';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { VATCycleStatus } from './types';
import { MOCK_VAT_CYCLES } from './data';
import { cn } from '../../../../lib/utils';

const STATUS_STEPS = [
    { id: VATCycleStatus.DRAFT, label: 'Draft', description: 'Period created' },
    { id: VATCycleStatus.DATA_COLLECTING, label: 'Data Collection', description: 'Gathering invoices' },
    { id: VATCycleStatus.REVIEW_IN_PROGRESS, label: 'Review', description: 'Accountant reviewing' },
    { id: VATCycleStatus.READY_TO_FILE, label: 'Ready to File', description: 'Confirmed numbers' },
    { id: VATCycleStatus.FILED, label: 'Filed', description: 'Submitted to authority' },
    { id: VATCycleStatus.COMPLETED, label: 'Completed', description: 'Cycle closed' },
];

export default function VATCycleView() {
    const currentCycle = MOCK_VAT_CYCLES[0];
    const historyCycles = MOCK_VAT_CYCLES.slice(1);

    const currentStepIndex = (() => {
        if (currentCycle.status === VATCycleStatus.PAYMENT_PENDING || currentCycle.status === VATCycleStatus.PAID) {
            return 4;
        }
        return STATUS_STEPS.findIndex(s => s.id === currentCycle.status);
    })();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Status Card */}
                <div className="lg:col-span-2 space-y-6">
                    <ShadowCard className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">VAT Return - {currentCycle.id}</h3>
                                <p className="text-sm text-gray-500">Period: {currentCycle.periodStart} to {currentCycle.periodEnd}</p>
                            </div>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                                currentCycle.status === VATCycleStatus.COMPLETED ? "bg-green-100 text-green-700" :
                                    currentCycle.status === VATCycleStatus.CLARIFICATION_NEEDED ? "bg-red-100 text-red-700" :
                                        "bg-blue-100 text-blue-700"
                            )}>
                                {currentCycle.status.replace(/_/g, " ")}
                            </span>
                        </div>

                        {/* Visual Timeline */}
                        <div className="relative mb-8 px-2">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-500"
                                style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                            />

                            <div className="relative flex justify-between w-full">
                                {STATUS_STEPS.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex;
                                    const isCurrent = index === currentStepIndex;

                                    return (
                                        <div key={step.id} className="flex flex-col items-center gap-2 group cursor-default">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center border-4 z-10 transition-all",
                                                isCompleted ? "bg-blue-500 border-blue-100 text-white" : "bg-white border-gray-100 text-gray-300",
                                                isCurrent && "ring-4 ring-blue-50 scale-110"
                                            )}>
                                                {isCompleted ? <CheckCircle2 size={14} strokeWidth={3} /> : <Circle size={14} strokeWidth={3} />}
                                            </div>
                                            <div className="absolute -bottom-10 flex flex-col items-center w-24 text-center">
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wide transition-colors",
                                                    isCompleted ? "text-blue-600" : "text-gray-400"
                                                )}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mt-12 flex gap-4 items-start">
                            <Clock className="text-blue-500 mt-0.5 shrink-0" size={18} />
                            <div>
                                <h4 className="font-bold text-sm text-blue-900">Current Stage: {STATUS_STEPS[currentStepIndex]?.label}</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                    {STATUS_STEPS[currentStepIndex]?.description}.
                                    {currentCycle.status === VATCycleStatus.REVIEW_IN_PROGRESS && " The accountant is currently reviewing the uploaded documents and invoices."}
                                </p>
                            </div>
                        </div>
                    </ShadowCard>

                    <ShadowCard className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Required Actions</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-500 border border-gray-200 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">Upload Additional Invoices</h4>
                                        <p className="text-xs text-gray-500">3 pending requests for clarification</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-500 border border-gray-200 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                        <Download size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">Download Draft Report</h4>
                                        <p className="text-xs text-gray-500">Preview the current VAT calculations</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </ShadowCard>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <ShadowCard className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Key Deadlines</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                                    <CalendarIcon day="31" month="Oct" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Filing Deadline</p>
                                    <p className="font-bold text-gray-900">{currentCycle.filingDeadline}</p>
                                    <p className="text-xs text-red-500 font-medium mt-1">Due in 5 days</p>
                                </div>
                            </div>
                            <div className="w-full h-px bg-gray-100" />
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                                    <CalendarIcon day="28" month="Nov" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payment Deadline</p>
                                    <p className="font-bold text-gray-900">{currentCycle.paymentDeadline}</p>
                                </div>
                            </div>
                        </div>
                    </ShadowCard>

                    <ShadowCard className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Cycle History</h3>
                        <div className="space-y-1">
                            {historyCycles.map(cycle => (
                                <div key={cycle.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{cycle.id}</p>
                                            <p className="text-xs text-gray-500">Liability: €{cycle.totalLiability?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                                </div>
                            ))}
                        </div>
                    </ShadowCard>
                </div>
            </div>
        </div>
    );
}

function CalendarIcon({ day, month }: { day: string; month: string }) {
    return (
        <div className="flex flex-col items-center justify-center w-8 h-8 bg-white border border-current rounded-md overflow-hidden text-[10px] leading-none">
            <span className="w-full bg-current text-white text-center py-0.5 font-bold uppercase" style={{ fontSize: '8px' }}>{month}</span>
            <span className="font-bold py-1">{day}</span>
        </div>
    );
}
