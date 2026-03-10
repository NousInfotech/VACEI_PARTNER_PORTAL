import React, { useState } from 'react';
import {
  Trash2,
  ChevronDown,
  Plus,
  Edit2,
  Check,
  X,
  ChevronUp,
  Settings2,
} from 'lucide-react';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { Badge } from '@/ui/badge';
import { Dropdown } from '../../../common/Dropdown';
import PillTab from '../../../common/PillTab';
import type {
  FormField,
  InputType,
  FormFieldOption,
} from '../../../../types/service-request-template';
import {
  isOptionWithQuestions,
  getOptionLabel,
} from '../../../../types/service-request-template';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';

interface FieldCardProps {
  field: FormField;
  index: number;
  isEdit: boolean;
  isGlobalEdit: boolean;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  onEditStart?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  isPending?: boolean;
  inputTypeIcons: Record<InputType, React.ComponentType<{ className?: string }>>;
  inputTypeItems: (
    onChange: (type: InputType) => void,
  ) => { id: string; label: string; icon: React.ReactNode; onClick: () => void }[];
  requiredTabs: { id: string; label: string }[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function ViewNestedQuestions({
  option,
  depth,
}: {
  option: FormFieldOption;
  depth: number;
}) {
  if (!isOptionWithQuestions(option) || !option.questions || option.questions.length === 0)
    return null;

  return (
    <div className="ml-8 space-y-6 border-l-2 border-primary/10 pl-6 py-2">
      <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest leading-none mb-1">
        {depth === 0 ? 'Conditional Questions' : `Level ${depth + 1} Nesting`}
      </p>
      {option.questions.map((q, qidx) => (
        <div
          key={qidx}
          className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="scale-75 origin-left">
                Q {qidx + 1}
              </Badge>
              <span className="text-xs font-bold text-gray-900">{q.question}</span>
            </div>
            {q.required && (
              <Badge variant="destructive" className="scale-50 origin-right">
                Required
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 ml-6">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="scale-75">
                Type:
              </Badge>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                {q.input_type}
              </span>
            </div>
          </div>
          {['radio', 'select', 'checklist'].includes(q.input_type) &&
            q.options &&
            q.options.length > 0 && (
              <div className="ml-6 space-y-4">
                {q.options.map((nestedOpt, nOptIdx) => (
                  <div key={nOptIdx} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-gray-300" />
                      <span className="text-[10px] font-bold text-gray-500">
                        {getOptionLabel(nestedOpt)}
                      </span>
                    </div>
                    <ViewNestedQuestions option={nestedOpt} depth={depth + 1} />
                  </div>
                ))}
              </div>
            )}
        </div>
      ))}
    </div>
  );
}

interface NestedFieldEditorProps {
  field: FormField;
  index: number;
  depth: number;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  inputTypeIcons: Record<InputType, React.ComponentType<{ className?: string }>>;
  inputTypeItems: (
    onChange: (type: InputType) => void,
  ) => { id: string; label: string; icon: React.ReactNode; onClick: () => void }[];
  requiredTabs: { id: string; label: string }[];
}

function NestedFieldEditor({
  field,
  index,
  depth,
  onUpdate,
  onRemove,
  inputTypeIcons,
  inputTypeItems,
  requiredTabs,
}: NestedFieldEditorProps) {
  const [expandedOptions, setExpandedOptions] = useState<Record<number, boolean>>({});

  const toggleOptionType = (optIdx: number) => {
    if (!field.options) return;
    const option = field.options[optIdx];
    const newOptions = [...field.options];

    if (typeof option === 'string') {
      newOptions[optIdx] = { value: option, label: option, questions: [] };
      onUpdate({ options: newOptions });
      setExpandedOptions((prev) => ({ ...prev, [optIdx]: true }));
    } else {
      setExpandedOptions((prev) => ({ ...prev, [optIdx]: !prev[optIdx] }));
    }
  };

  const removeOptionLogic = (optIdx: number) => {
    if (!field.options) return;
    const option = field.options[optIdx];
    if (typeof option !== 'string') {
      const newOptions = [...field.options];
      newOptions[optIdx] = option.value;
      onUpdate({ options: newOptions });
      setExpandedOptions((prev) => ({ ...prev, [optIdx]: false }));
    }
  };

  const addNestedField = (optIdx: number) => {
    if (!field.options) return;
    const option = field.options[optIdx];
    if (typeof option !== 'string') {
      const newQuestions = [
        ...(option.questions || []),
        { question: '', input_type: 'text', required: true } as FormField,
      ];
      const newOptions = [...field.options];
      newOptions[optIdx] = { ...option, questions: newQuestions };
      onUpdate({ options: newOptions });
    }
  };

  const updateNestedField = (
    optIdx: number,
    nestedIdx: number,
    updates: Partial<FormField>,
  ) => {
    if (!field.options) return;
    const option = field.options[optIdx];
    if (typeof option !== 'string' && option.questions) {
      const newQuestions = option.questions.map((q, i) =>
        i === nestedIdx ? { ...q, ...updates } : q,
      );
      const newOptions = [...field.options];
      newOptions[optIdx] = { ...option, questions: newQuestions };
      onUpdate({ options: newOptions });
    }
  };

  const removeNestedField = (optIdx: number, nestedIdx: number) => {
    if (!field.options) return;
    const option = field.options[optIdx];
    if (typeof option !== 'string' && option.questions) {
      const newQuestions = option.questions.filter((_, i) => i !== nestedIdx);
      const newOptions = [...field.options];
      newOptions[optIdx] = { ...option, questions: newQuestions };
      onUpdate({ options: newOptions });
    }
  };

  const isMainField = depth === 0;

  return (
    <div
      className={`space-y-6 ${
        !isMainField
          ? 'p-6 bg-gray-50/30 rounded-2xl border border-gray-100 relative group/nested'
          : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant={isMainField ? 'default' : 'outline'}
            className={!isMainField ? 'scale-75 origin-left' : ''}
          >
            {isMainField ? `Field ${index + 1}` : `Nested Q ${index + 1}`}
          </Badge>
          <div className="flex-1">
            <PillTab
              tabs={requiredTabs}
              activeTab={field.required ? 'required' : 'optional'}
              onTabChange={(id: string) => onUpdate({ required: id === 'required' })}
            />
          </div>
        </div>
        {!isMainField && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-gray-300 opacity-0 group-hover/nested:opacity-100 hover:text-red-500 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex gap-1.5 flex-col items-start w-full">
          <Badge variant="outline" className="ml-1">
            Question Text
          </Badge>
          <input
            type="text"
            value={field.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 outline-none focus:border-primary/20 rounded-2xl transition-all font-medium text-sm text-gray-700"
            placeholder="Enter question..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-1.5 flex-col items-start w-full">
            <Badge variant="outline" className="ml-1">
              Input Type
            </Badge>
            <Dropdown
              fullWidth
              items={inputTypeItems((type: InputType) =>
                onUpdate({
                  input_type: type,
                  options: ['radio', 'select', 'checklist'].includes(type)
                    ? field.options?.length
                      ? field.options
                      : ['Option 1']
                    : undefined,
                }),
              )}
              trigger={
                <button
                  type="button"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl flex items-center justify-between text-xs font-bold text-gray-700"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = inputTypeIcons[field.input_type];
                      if (!Icon) return <div className="h-4 w-4" />;
                      return <Icon className="h-4 w-4 text-primary" />;
                    })()}
                    <span className="uppercase">
                      {field.input_type.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              }
            />
          </div>
          <div className="flex gap-1.5 flex-col items-start w-full">
            <Badge variant="outline" className="ml-1">
              Placeholder
            </Badge>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-primary/20 transition-all text-sm font-medium"
              placeholder="Optional hint..."
            />
          </div>
        </div>

        {['year', 'month', 'month_year'].includes(field.input_type) && (
          <div className="flex items-center gap-3 py-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <button
              type="button"
              onClick={() => onUpdate({ isRange: !field.isRange })}
              className={`h-6 w-11 rounded-full transition-colors relative ${
                field.isRange ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <div
                className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  field.isRange ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">
              Enable Period Selection (e.g. From 2024 - To 2026)
            </span>
          </div>
        )}

        {['year', 'month_year'].includes(field.input_type) && (
          <div className="grid grid-cols-2 gap-4 pb-2">
            <div className="space-y-1.5">
              <Badge variant="outline" className="ml-1">
                Earliest Year (Min)
              </Badge>
              <input
                type="number"
                value={field.minYear || ''}
                onChange={(e) =>
                  onUpdate({ minYear: parseInt(e.target.value) || undefined })
                }
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-primary/20 outline-none text-sm font-medium"
                placeholder="e.g. 2020"
              />
            </div>
            <div className="space-y-1.5">
              <Badge variant="outline" className="ml-1">
                Latest Year (Max)
              </Badge>
              <input
                type="number"
                value={field.maxYear || ''}
                onChange={(e) =>
                  onUpdate({ maxYear: parseInt(e.target.value) || undefined })
                }
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-primary/20 outline-none text-sm font-medium"
                placeholder="e.g. 2030"
              />
            </div>
          </div>
        )}

        {['month', 'month_year'].includes(field.input_type) && (
          <div className="grid grid-cols-2 gap-4 pb-2">
            <div className="space-y-1.5">
              <Badge variant="outline" className="ml-1">
                Earliest Month (Min)
              </Badge>
              <Dropdown
                fullWidth
                items={[
                  'January',
                  'February',
                  'March',
                  'April',
                  'May',
                  'June',
                  'July',
                  'August',
                  'September',
                  'October',
                  'November',
                  'December',
                ].map((month) => ({
                  id: month,
                  label: month,
                  onClick: () => onUpdate({ minMonth: month }),
                }))}
                trigger={
                  <button
                    type="button"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-xs font-bold text-gray-700"
                  >
                    <span className="uppercase">{field.minMonth || 'Select'}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                }
              />
            </div>
            <div className="space-y-1.5">
              <Badge variant="outline" className="ml-1">
                Latest Month (Max)
              </Badge>
              <Dropdown
                fullWidth
                items={[
                  'January',
                  'February',
                  'March',
                  'April',
                  'May',
                  'June',
                  'July',
                  'August',
                  'September',
                  'October',
                  'November',
                  'December',
                ].map((month) => ({
                  id: month,
                  label: month,
                  onClick: () => onUpdate({ maxMonth: month }),
                }))}
                trigger={
                  <button
                    type="button"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-xs font-bold text-gray-700"
                  >
                    <span className="uppercase">{field.maxMonth || 'Select'}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                }
              />
            </div>
          </div>
        )}

        {['radio', 'select', 'checklist'].includes(field.input_type) && (
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Options List</Badge>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    options: field.options && field.options.length > 0
                      ? [...(field.options || []), '']
                      : [''],
                  })
                }
                className="text-primary font-bold text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Option
              </button>
            </div>
            <div className="space-y-4">
              {field.options?.map((option, optIdx) => {
                const isComplex = isOptionWithQuestions(option);
                return (
                  <div key={optIdx} className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={getOptionLabel(option)}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newOptions = [...(field.options || [])];
                          if (typeof option === 'string') newOptions[optIdx] = val;
                          else newOptions[optIdx] = { ...option, value: val, label: val };
                          onUpdate({ options: newOptions });
                        }}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none"
                      />
                      <div className="flex gap-2 text-left">
                        <button
                          type="button"
                          onClick={() => toggleOptionType(optIdx)}
                          className={`p-2.5 rounded-xl transition-all border ${
                            isComplex
                              ? expandedOptions[optIdx]
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-primary/10 border-primary/20 text-primary'
                              : 'bg-white border-gray-200 text-gray-400 hover:text-primary'
                          }`}
                          title={
                            isComplex
                              ? expandedOptions[optIdx]
                                ? 'Collapse conditional questions'
                                : 'Expand conditional questions'
                              : 'Add conditional questions'
                          }
                        >
                          <Settings2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdate({
                              options: (field.options || []).filter((_, i) => i !== optIdx),
                            })
                          }
                          className="p-2.5 text-gray-400 hover:text-red-500 bg-white border border-gray-200 rounded-xl transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {isComplex && expandedOptions[optIdx] && (
                      <div className="ml-8 p-6 bg-white border border-dashed border-gray-200 rounded-3xl space-y-6">
                        <div className="flex items-center justify-between">
                          <h6 className="text-xs font-bold text-gray-500 uppercase">
                            Conditional Questions for &quot;{getOptionLabel(option)}&quot;
                          </h6>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => removeOptionLogic(optIdx)}
                              className="text-red-500 font-bold text-[9px] uppercase tracking-widest hover:underline"
                            >
                              Remove Logic
                            </button>
                            <button
                              type="button"
                              onClick={() => addNestedField(optIdx)}
                              className="text-primary font-bold text-[9px] uppercase tracking-widest hover:underline flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add Question
                            </button>
                          </div>
                        </div>
                        <div className="space-y-6">
                          {option.questions?.map((nestedField, nestedIdx) => (
                            <NestedFieldEditor
                              key={nestedIdx}
                              field={nestedField}
                              index={nestedIdx}
                              depth={depth + 1}
                              onUpdate={(u) =>
                                updateNestedField(optIdx, nestedIdx, u)
                              }
                              onRemove={() => removeNestedField(optIdx, nestedIdx)}
                              inputTypeIcons={inputTypeIcons}
                              inputTypeItems={inputTypeItems}
                              requiredTabs={requiredTabs}
                            />
                          ))}
                          {(!option.questions || option.questions.length === 0) && (
                            <p className="text-[10px] text-gray-300 italic text-center py-2">
                              No conditional questions added
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const FieldCard: React.FC<FieldCardProps> = ({
  field,
  index,
  isEdit,
  isGlobalEdit,
  onUpdate,
  onRemove,
  onEditStart,
  onCancel,
  onSave,
  isPending,
  inputTypeIcons,
  inputTypeItems,
  requiredTabs,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteInitial = () => {
    if (!field.question?.trim()) {
      onRemove();
    } else {
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    setIsDeleteModalOpen(false);
    onRemove();
  };

  if (!isEdit) {
    return (
      <ShadowCard className="p-6 border border-gray-300 group transition-all relative hover:shadow-md">
        <div className="flex flex-col gap-4">
          <div
            className="flex items-start justify-between cursor-pointer select-none"
            onClick={onToggleCollapse}
          >
            <div className="flex items-center gap-3">
              <Badge variant="default">Field {index + 1}</Badge>
              {field.required ? (
                <Badge variant="destructive">Required</Badge>
              ) : (
                <Badge variant="outline">Optional</Badge>
              )}
              <h4 className="text-sm font-bold text-gray-700 truncate max-w-[200px] lg:max-w-md">
                {isCollapsed ? field.question : ''}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              {!isGlobalEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditStart?.();
                  }}
                  className="p-1.5 opacity-0 group-hover:opacity-100 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-all shadow-sm"
                  title="Edit single field"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.();
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-all shadow-sm border border-gray-100"
                title={isCollapsed ? 'Expand Field' : 'Collapse Field'}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6 pt-4 border-t border-gray-50">
              <div className="flex flex-col gap-1 items-start">
                <Badge variant="outline">Question</Badge>
                <h4 className="text-md font-bold text-gray-900">{field.question}</h4>
              </div>
              <div className="flex flex-col gap-1 items-start">
                <Badge variant="outline">Input Type</Badge>
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase text-gray-900 text-sm tracking-tight">
                    {field.input_type.replace(/_/g, ' ')}
                  </span>
                  {field.isRange && (
                    <Badge variant="default" className="scale-75 origin-left">
                      Range Enabled
                    </Badge>
                  )}
                </div>
              </div>
              {field.isRange && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="flex flex-col gap-1 items-start">
                    <Badge variant="outline">Configuration Boundary</Badge>
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      {[
                        field.minMonth,
                        field.minYear,
                        (field.minMonth ||
                          field.minYear ||
                          field.maxMonth ||
                          field.maxYear) &&
                          'to',
                        field.maxMonth,
                        field.maxYear,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    </span>
                  </div>
                </div>
              )}
              {field.placeholder && (
                <div className="flex flex-col gap-1 items-start">
                  <Badge variant="outline">Placeholder</Badge>
                  <span className="font-bold text-gray-900 text-sm">
                    {field.placeholder}
                  </span>
                </div>
              )}
              {field.options && field.options.length > 0 && (
                <div className="flex flex-col gap-3 items-start w-full">
                  <Badge variant="outline">
                    Options List{' '}
                    {field.input_type === 'checklist' && '(Additive)'}
                  </Badge>
                  <div className="flex flex-col gap-4 w-full">
                    {field.options.map((opt, optIdx: number) => {
                      return (
                        <div key={optIdx} className="space-y-4">
                          <div className="px-4 py-2 bg-white border border-gray-100 rounded-[14px] shadow-sm flex items-center gap-3 w-fit">
                            <div className="flex items-center justify-center p-0.5 rounded-full bg-gray-100">
                              <div className="h-1.5 w-1.5 rounded-full bg-black" />
                            </div>
                            <span className="text-xs font-bold text-gray-600">
                              {getOptionLabel(opt)}
                            </span>
                          </div>

                          <ViewNestedQuestions option={opt} depth={0} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ShadowCard>
    );
  }

  return (
    <>
      <ShadowCard className="p-6 border border-gray-400 bg-white z-30 transition-all relative focus-within:z-40">
        <div className="flex gap-8 items-start">
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default">
                  {isGlobalEdit ? `Editing Field ${index + 1}` : 'Editing Field'}
                </Badge>
              </div>
              <div className="flex gap-2">
                {!isGlobalEdit ? (
                  <>
                    <button
                      onClick={onCancel}
                      className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                      title="Cancel"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button
                      onClick={onSave}
                      disabled={isPending}
                      className="p-2 bg-primary text-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 px-4 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {isPending ? 'Saving...' : 'Save'}
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleDeleteInitial}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all"
                    title="Remove field"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <NestedFieldEditor
                field={field}
                index={index}
                depth={0}
                onUpdate={onUpdate}
                onRemove={onRemove}
                inputTypeIcons={inputTypeIcons}
                inputTypeItems={inputTypeItems}
                requiredTabs={requiredTabs}
              />

              {field.input_type === 'text' && (
                <div className="flex gap-1.5 flex-col items-start w-full">
                  <Badge variant="outline" className="ml-1">
                    Max Length (Optional)
                  </Badge>
                  <input
                    type="number"
                    value={field.maxLength || ''}
                    onChange={(e) =>
                      onUpdate({ maxLength: parseInt(e.target.value) || undefined })
                    }
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 focus:border-primary/20 rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm text-gray-700"
                    placeholder="No limit"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </ShadowCard>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Form Field"
        itemName={`Field ${index + 1}`}
        description={
          <span>
            Are you sure you want to remove the field{' '}
            <span className="font-bold text-gray-900">
              &quot;{field.question || 'Untitled Field'}&quot;
            </span>
            ? This action cannot be undone.
          </span>
        }
      />
    </>
  );
};

