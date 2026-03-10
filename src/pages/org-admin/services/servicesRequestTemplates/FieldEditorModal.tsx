import React, { useState } from 'react';
import { Button } from '../../../../ui/Button';
import { ShadowCard } from '../../../../ui/ShadowCard';
import {
  Trash2,
  ChevronDown,
  Plus,
  Settings2,
  X,
  Save,
} from 'lucide-react';
import { Dropdown } from '../../../common/Dropdown';
import PillTab from '../../../common/PillTab';
import { Badge } from '@/ui/badge';
import { useTemplates } from '../../context/ServicesContext';
import {
  type FormField,
  type InputType,
  getOptionLabel,
  isOptionWithQuestions,
} from '../../../../types/service-request-template';

interface ModalNestedEditorProps {
  field: FormField;
  path: string;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  depth: number;
  inputTypeItems: (
    onChange: (type: InputType) => void,
  ) => { id: string; label: string; icon: React.ReactNode; onClick: () => void }[];
  expandedOptions: Record<string, boolean>;
  setExpandedOptions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const ModalNestedEditor: React.FC<ModalNestedEditorProps> = ({
  field,
  path,
  onUpdate,
  onRemove,
  depth,
  inputTypeItems,
  expandedOptions,
  setExpandedOptions,
}) => {
  const toggleOptionType = (optIdx: number) => {
    if (!field.options) return;
    const option = field.options[optIdx];
    const newOptions = [...field.options];

    if (typeof option === 'string') {
      newOptions[optIdx] = { value: option, label: option, questions: [] };
      onUpdate({ options: newOptions });
      setExpandedOptions((prev) => ({ ...prev, [`${path}_${optIdx}`]: true }));
    } else {
      setExpandedOptions((prev) => ({
        ...prev,
        [`${path}_${optIdx}`]: !prev[`${path}_${optIdx}`],
      }));
    }
  };

  const removeOptionLogic = (optIdx: number) => {
    if (!field.options) return;
    const option = field.options[optIdx];
    if (typeof option !== 'string') {
      const newOptions = [...field.options];
      newOptions[optIdx] = option.value;
      onUpdate({ options: newOptions });
      setExpandedOptions((prev) => ({ ...prev, [`${path}_${optIdx}`]: false }));
    }
  };

  return (
    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 space-y-4 relative group/nested shadow-sm">
      <div className="flex items-center justify-between">
        <Badge  className="scale-75 origin-left">
          Level {depth} Nested Q
        </Badge>
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <Badge >Question Text</Badge>
          <input
            type="text"
            value={field.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-primary/20 outline-none"
            placeholder="Enter question..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Badge >Type</Badge>
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
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between text-xs font-bold uppercase text-gray-700"
                >
                  <span className="truncate">{field.input_type.replace('_', ' ')}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Badge >Placeholder</Badge>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:border-primary/20 outline-none"
              placeholder="Hint..."
            />
          </div>
        </div>

        {['radio', 'select', 'checklist'].includes(field.input_type) && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Badge >Options</Badge>
              <button
                type="button"
                onClick={() =>
                  onUpdate({ options: [...(field.options || []), ''] })
                }
                className="text-primary font-bold text-[9px] uppercase tracking-widest hover:underline"
              >
                + Add Option
              </button>
            </div>
            <div className="space-y-2">
              {field.options?.map((opt, oIdx) => {
                const isComp = isOptionWithQuestions(opt);
                return (
                  <div key={oIdx} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={getOptionLabel(opt)}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newOpts = [...(field.options || [])];
                          if (typeof opt === 'string') newOpts[oIdx] = val;
                          else newOpts[oIdx] = { ...opt, value: val, label: val };
                          onUpdate({ options: newOpts });
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none"
                        placeholder={`Option ${oIdx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleOptionType(oIdx)}
                        className={`p-2 rounded-lg border transition-all ${
                          isComp
                            ? expandedOptions[`${path}_${oIdx}`]
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                        title={
                          isComp
                            ? expandedOptions[`${path}_${oIdx}`]
                              ? 'Collapse conditional questions'
                              : 'Expand conditional questions'
                            : 'Add conditional questions'
                        }
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate({
                            options: field.options!.filter((_, i) => i !== oIdx),
                          })
                        }
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {isComp && expandedOptions[`${path}_${oIdx}`] && (
                      <div className="ml-4 pl-4 border-l-2 border-primary/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge >Nested Questions</Badge>
                          <button
                            type="button"
                            onClick={() => removeOptionLogic(oIdx)}
                            className="text-red-500 font-bold text-[8px] uppercase tracking-widest hover:underline"
                          >
                            Remove Logic
                          </button>
                        </div>
                        {opt.questions?.map((nq, nqIdx) => (
                          <ModalNestedEditor
                            key={nqIdx}
                            field={nq}
                            path={`${path}_opt${oIdx}_q${nqIdx}`}
                            onUpdate={(u) => {
                              const newQs = opt.questions!.map((q, i) =>
                                i === nqIdx ? { ...q, ...u } : q,
                              );
                              const newOpts = [...(field.options || [])];
                              newOpts[oIdx] = { ...opt, questions: newQs };
                              onUpdate({ options: newOpts });
                            }}
                            onRemove={() => {
                              const newQs = opt.questions!.filter(
                                (_, i) => i !== nqIdx,
                              );
                              const newOpts = [...(field.options || [])];
                              newOpts[oIdx] = { ...opt, questions: newQs };
                              onUpdate({ options: newOpts });
                            }}
                            depth={depth + 1}
                            inputTypeItems={inputTypeItems}
                            expandedOptions={expandedOptions}
                            setExpandedOptions={setExpandedOptions}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newQs = [
                              ...(opt.questions || []),
                              {
                                question: '',
                                input_type: 'text',
                                required: true,
                              } as FormField,
                            ];
                            const newOpts = [...(field.options || [])];
                            newOpts[oIdx] = { ...opt, questions: newQs };
                            onUpdate({ options: newOpts });
                          }}
                          className="text-primary font-bold text-[8px] uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Level {depth + 1} Question
                        </button>
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
};

interface FieldEditorModalProps {
  field: FormField;
  onSave: (updatedField: FormField) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
  field: initialField,
  onSave,
  onClose,
  isLoading = false,
}) => {
  const { inputTypeIcons, inputTypeItems, requiredTabs } = useTemplates();
  const [field, setField] = useState<FormField>({ ...initialField });
  const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>({});

  const updateField = (updates: Partial<FormField>) => {
    setField((prev) => ({ ...prev, ...updates }));
  };

  const toggleOptionType = (optIdx: number) => {
    if (!field.options) return;
    const option = field.options[optIdx];
    const newOptions = [...field.options];

    if (typeof option === 'string') {
      newOptions[optIdx] = { value: option, label: option, questions: [] };
      updateField({ options: newOptions });
      setExpandedOptions((prev) => ({ ...prev, [`main_${optIdx}`]: true }));
    } else {
      setExpandedOptions((prev) => ({
        ...prev,
        [`main_${optIdx}`]: !prev[`main_${optIdx}`],
      }));
    }
  };

  const removeOptionLogic = (optIdx: number) => {
    if (!field.options) return;
    const option = field.options[optIdx];
    if (typeof option !== 'string') {
      const newOptions = [...field.options];
      newOptions[optIdx] = option.value;
      updateField({ options: newOptions });
      setExpandedOptions((prev) => ({ ...prev, [`main_${optIdx}`]: false }));
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
      updateField({ options: newOptions });
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
      updateField({ options: newOptions });
    }
  };

  const removeNestedField = (optIdx: number, nestedIdx: number) => {
    if (!field.options) return;
    const option = field.options[optIdx];
    if (typeof option !== 'string' && option.questions) {
      const newQuestions = option.questions.filter((_, i) => i !== nestedIdx);
      const newOptions = [...field.options];
      newOptions[optIdx] = { ...option, questions: newQuestions };
      updateField({ options: newOptions });
    }
  };

  const handleAddOption = () => {
    const options = field.options || [];
    updateField({ options: [...options, ''] });
  };

  const handleUpdateOption = (index: number, value: string) => {
    if (field.options) {
      const newOptions = [...field.options];
      const option = newOptions[index];
      if (typeof option === 'string') {
        newOptions[index] = value;
      } else {
        newOptions[index] = { ...option, value, label: value };
      }
      updateField({ options: newOptions });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (field.options) {
      updateField({ options: field.options.filter((_, i) => i !== index) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(field);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <ShadowCard className="w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Save className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Edit Field Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar"
        >
          <div className="space-y-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
            <div className="flex items-center justify-between">
              <Badge >Main Field</Badge>
              <div className="flex-1 max-w-[160px]">
                <PillTab
                  tabs={requiredTabs}
                  activeTab={field.required ? 'required' : 'optional'}
                  onTabChange={(id: string) => updateField({ required: id === 'required' })}
                  className="scale-95 origin-right"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Badge>Question Text</Badge>
                <input
                  type="text"
                  value={field.question}
                  onChange={(e) => updateField({ question: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-primary/20 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm"
                  placeholder="Enter your question..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Input Type
                  </label>
                  <Dropdown
                    fullWidth
                    items={inputTypeItems((type: InputType) =>
                      updateField({
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
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-sm font-bold text-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = inputTypeIcons[field.input_type];
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
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateField({ placeholder: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-sm font-medium"
                    placeholder="Optional hint..."
                  />
                </div>
              </div>

              {['year', 'month', 'month_year'].includes(field.input_type) && (
                <div className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => updateField({ isRange: !field.isRange })}
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
                  <span className="text-sm font-medium text-gray-700">
                    Enable Period Selection (e.g. From 2024 - To 2026)
                  </span>
                </div>
              )}

              {['year', 'month_year'].includes(field.input_type) && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Earliest Year (Min)
                    </label>
                    <input
                      type="number"
                      value={field.minYear || ''}
                      onChange={(e) =>
                        updateField({
                          minYear: parseInt(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-sm font-medium"
                      placeholder="e.g. 2020"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Latest Year (Max)
                    </label>
                    <input
                      type="number"
                      value={field.maxYear || ''}
                      onChange={(e) =>
                        updateField({
                          maxYear: parseInt(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-sm font-medium"
                      placeholder="e.g. 2030"
                    />
                  </div>
                </div>
              )}

              {['month', 'month_year'].includes(field.input_type) && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Earliest Month (Min)
                    </label>
                    <Dropdown
                      fullWidth
                      label={field.minMonth || 'Select Month'}
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
                        onClick: () => updateField({ minMonth: month }),
                      }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Latest Month (Max)
                    </label>
                    <Dropdown
                      fullWidth
                      label={field.maxMonth || 'Select Month'}
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
                        onClick: () => updateField({ maxMonth: month }),
                      }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {['radio', 'select', 'checklist'].includes(field.input_type) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Options & Sub-questions
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-primary font-bold text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Option
                </button>
              </div>

              <div className="space-y-6">
                {field.options?.map((option, idx) => {
                  const isComp = isOptionWithQuestions(option);
                  return (
                    <div
                      key={idx}
                      className="space-y-3 p-4 bg-gray-50/30 rounded-2xl border border-gray-100"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={getOptionLabel(option)}
                          onChange={(e) => handleUpdateOption(idx, e.target.value)}
                          className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary/20 transition-all"
                          placeholder={`Option ${idx + 1}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => toggleOptionType(idx)}
                          className={`p-2.5 rounded-xl border transition-all ${
                            isComp
                              ? expandedOptions[`main_${idx}`]
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-primary/10 border-primary/20 text-primary'
                              : 'bg-white border-gray-200 text-gray-400 hover:text-primary'
                          }`}
                          title={
                            isComp
                              ? expandedOptions[`main_${idx}`]
                                ? 'Collapse conditional questions'
                                : 'Expand conditional questions'
                              : 'Add conditional questions'
                          }
                        >
                          <Settings2 className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      {isComp && expandedOptions[`main_${idx}`] && (
                        <div className="ml-6 pl-6 border-l-2 border-primary/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              Conditional Questions
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => removeOptionLogic(idx)}
                                className="text-red-500 font-bold text-[9px] uppercase tracking-widest hover:underline"
                              >
                                Remove Logic
                              </button>
                              <button
                                type="button"
                                onClick={() => addNestedField(idx)}
                                className="text-primary font-bold text-[9px] uppercase tracking-widest hover:underline flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Nested Q
                              </button>
                            </div>
                          </div>
                          {isOptionWithQuestions(option) &&
                            option.questions?.map((nq: FormField, nqIdx: number) => (
                              <ModalNestedEditor
                                key={nqIdx}
                                field={nq}
                                path={`field_opt${idx}_q${nqIdx}`}
                                onUpdate={(u) => updateNestedField(idx, nqIdx, u)}
                                onRemove={() => removeNestedField(idx, nqIdx)}
                                depth={1}
                                inputTypeItems={inputTypeItems}
                                expandedOptions={expandedOptions}
                                setExpandedOptions={setExpandedOptions}
                              />
                            ))}
                          {(!isOptionWithQuestions(option) ||
                            !option.questions ||
                            option.questions.length === 0) && (
                            <p className="text-[10px] text-gray-300 italic py-1">
                              No nested questions yet
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-2xl px-8 h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-2xl px-12 h-12 font-bold min-w-[160px]"
            >
              {isLoading ? 'Saving...' : 'Update Configuration'}
            </Button>
          </div>
        </form>
      </ShadowCard>
    </div>
  );
};

