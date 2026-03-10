import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CornerDownRight,
  CheckCircle2,
  MessageSquare,
  Send,
  X,
  Calendar,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../../ui/Button';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { Skeleton } from '../../../../ui/Skeleton';
import { apiGet } from '../../../../config/base';
import { endPoints } from '../../../../config/endPoint';
import type {
  ServiceRequestTemplate,
  FormField,
  FormFieldOption,
} from '../../../../types/service-request-template';
import {
  isOptionWithQuestions,
  getOptionLabel,
} from '../../../../types/service-request-template';
import { Dropdown } from '../../../common/Dropdown';

type PreviewObjectBase = {
  selection?: string | string[];
  start?: string | DateValue;
  end?: string | DateValue;
  month?: string;
  year?: string;
};

type PreviewValue =
  | string
  | number
  | string[]
  | (PreviewObjectBase & Record<string, unknown>)
  | null
  | undefined;

interface DateValue {
  month?: string;
  year?: string;
}

interface RangeValue {
  start?: string | DateValue;
  end?: string | DateValue;
}

const PreviewField: React.FC<{
  field: FormField;
  value: PreviewValue;
  onValueChange: (val: PreviewValue) => void;
  depth?: number;
}> = ({ field, value, onValueChange, depth = 0 }) => {
  const isSelected = (label: string) => {
    const selection =
      value && typeof value === 'object' && !Array.isArray(value)
        ? value.selection
        : value;

    if (field.input_type === 'checklist') {
      return Array.isArray(selection) && selection.includes(label);
    }
    return selection === label;
  };

  const handleOptionChange = (label: string) => {
    if (field.input_type === 'checklist') {
      let current: string[] = [];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const sel = value.selection;
        if (Array.isArray(sel)) {
          current = sel;
        } else if (typeof sel === 'string') {
          current = [sel];
        }
      } else if (Array.isArray(value)) {
        current = value;
      } else if (typeof value === 'string') {
        current = [value];
      }

      const nextSelection = current.includes(label)
        ? current.filter((v) => v !== label)
        : [...current, label];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        onValueChange({ ...value, selection: nextSelection });
      } else {
        onValueChange(nextSelection);
      }
    } else {
      onValueChange(label);
    }
  };

  const renderNestedQuestions = (option: FormFieldOption, optIdx: number) => {
    if (!isOptionWithQuestions(option) || !option.questions || option.questions.length === 0)
      return null;

    const selected = isSelected(getOptionLabel(option));
    if (!selected) return null;

    return (
      <div className="ml-10 mt-6 space-y-8 border-l-2 border-primary/10 pl-8 py-2 animate-in slide-in-from-left-2 duration-300">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-3 w-3 text-primary/40" />
          <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">
            Conditional Questions for &quot;{getOptionLabel(option)}&quot;
          </p>
        </div>
        {option.questions.map((q, qidx) => (
          <PreviewField
            key={qidx}
            field={q}
            value={
              value && typeof value === 'object' && !Array.isArray(value)
                ? (value as { [key: string]: PreviewValue })[`q_${optIdx}_${qidx}`]
                : null
            }
            onValueChange={(val) => {
              const base: { [key: string]: PreviewValue } =
                value && typeof value === 'object' && !Array.isArray(value)
                  ? { ...(value as { [key: string]: PreviewValue }) }
                  : { selection: value as string | string[] | undefined };

              base[`q_${optIdx}_${qidx}`] = val;
              onValueChange(base);
            }}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  };

  return (
    <ShadowCard
      className={`p-8 border-l-8 ${
        depth > 0 ? 'bg-gray-50/30' : 'bg-white'
      } border-l-primary border border-gray-100 rounded-2xl hover:shadow-md transition-shadow`}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <label className="text-lg font-bold text-gray-900 flex gap-2">
            {field.question}
            {field.required && <span className="text-red-500">*</span>}
          </label>
        </div>

        {field.placeholder && (
          <p className="text-xs text-gray-400 italic flex items-center gap-1 font-medium">
            <CornerDownRight className="h-3 w-3" />
            {field.placeholder}
          </p>
        )}

        <div className="mt-4">
          {field.input_type === 'text' && (
            <input
              type="text"
              value={
                value && typeof value === 'object' && !Array.isArray(value)
                  ? value.selection || ''
                  : typeof value === 'string'
                    ? value
                    : ''
              }
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={field.placeholder || 'Enter your answer...'}
            />
          )}

          {field.input_type === 'date' && (
            <div className="relative w-64">
              <input
                type="date"
                value={
                  value && typeof value === 'object' && !Array.isArray(value)
                    ? value.selection || ''
                    : typeof value === 'string'
                      ? value
                      : ''
                }
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full border-b-2 border-gray-100 py-3 pl-10 outline-none focus:border-primary transition-all bg-transparent text-gray-900 font-bold placeholder:text-gray-300 appearance-none"
              />
              <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
            </div>
          )}

          {field.input_type === 'month' && (
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Dropdown
                  fullWidth
                  label={
                    field.isRange
                      ? value &&
                        typeof value === 'object' &&
                        !Array.isArray(value) &&
                        typeof (value as PreviewObjectBase).start === 'string'
                        ? `From: ${(value as PreviewObjectBase).start}`
                        : 'From: Month'
                      : value && typeof value === 'string'
                        ? value
                        : 'Select Month'
                  }
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
                  ]
                    .filter((month) => {
                      const months = [
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
                      ];
                      const minIdx = field.minMonth
                        ? months.indexOf(field.minMonth)
                        : 0;
                      const maxIdx = field.maxMonth
                        ? months.indexOf(field.maxMonth)
                        : 11;
                      const currIdx = months.indexOf(month);
                      return currIdx >= minIdx && currIdx <= maxIdx;
                    })
                    .map((month) => ({
                      id: month,
                      label: month,
                      onClick: () => {
                        if (field.isRange) {
                          const current =
                            value && typeof value === 'object' && !Array.isArray(value)
                              ? value
                              : {};
                          onValueChange({ ...current, start: month });
                        } else {
                          onValueChange(month);
                        }
                      },
                    }))}
                />
              </div>
              {field.isRange && (
                <>
                  <div className="text-gray-400 font-bold">to</div>
                  <div className="w-64">
                    <Dropdown
                      fullWidth
                      label={
                        value &&
                        typeof value === 'object' &&
                        !Array.isArray(value) &&
                        typeof (value as PreviewObjectBase).end === 'string'
                          ? `To: ${(value as PreviewObjectBase).end}`
                          : 'To: Month'
                      }
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
                      ]
                        .filter((month) => {
                          const months = [
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
                          ];
                          const minIdx = field.minMonth
                            ? months.indexOf(field.minMonth)
                            : 0;
                          const maxIdx = field.maxMonth
                            ? months.indexOf(field.maxMonth)
                            : 11;
                          const currIdx = months.indexOf(month);
                          return currIdx >= minIdx && currIdx <= maxIdx;
                        })
                        .map((month) => ({
                          id: month,
                          label: month,
                          onClick: () => {
                            const current =
                              value &&
                              typeof value === 'object' &&
                              !Array.isArray(value)
                                ? value
                                : {};
                            onValueChange({ ...current, end: month });
                          },
                        }))}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {field.input_type === 'year' && (
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Dropdown
                  fullWidth
                  label={
                    field.isRange
                      ? value &&
                        typeof value === 'object' &&
                        !Array.isArray(value) &&
                        typeof (value as PreviewObjectBase).start === 'string'
                        ? `From: ${(value as PreviewObjectBase).start}`
                        : 'From: Year'
                      : value && typeof value === 'string'
                        ? value
                        : 'Select Year'
                  }
                  items={(() => {
                    const startYear =
                      field.minYear || new Date().getFullYear() - 10;
                    const endYear =
                      field.maxYear || new Date().getFullYear() + 10;
                    const length = Math.max(0, endYear - startYear + 1);
                    return Array.from({ length }, (_, i) => {
                      const year = String(startYear + i);
                      return {
                        id: year,
                        label: year,
                        onClick: () => {
                          if (field.isRange) {
                            const current =
                              value &&
                              typeof value === 'object' &&
                              !Array.isArray(value)
                                ? value
                                : {};
                            onValueChange({ ...current, start: year });
                          } else {
                            onValueChange(year);
                          }
                        },
                      };
                    });
                  })()}
                />
              </div>
              {field.isRange && (
                <>
                  <div className="text-gray-400 font-bold">to</div>
                  <div className="w-64">
                    <Dropdown
                      fullWidth
                      label={
                        value &&
                        typeof value === 'object' &&
                        !Array.isArray(value) &&
                        typeof (value as PreviewObjectBase).end === 'string'
                          ? `To: ${(value as PreviewObjectBase).end}`
                          : 'To: Year'
                      }
                      items={(() => {
                        const startYear =
                          field.minYear || new Date().getFullYear() - 10;
                        const endYear =
                          field.maxYear || new Date().getFullYear() + 10;
                        const length = Math.max(0, endYear - startYear + 1);
                        return Array.from({ length }, (_, i) => {
                          const year = String(startYear + i);
                          return {
                            id: year,
                            label: year,
                            onClick: () => {
                              const current =
                                value &&
                                typeof value === 'object' &&
                                !Array.isArray(value)
                                  ? value
                                  : {};
                              onValueChange({ ...current, end: year });
                            },
                          };
                        });
                      })()}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {field.input_type === 'month_year' && (
            <div
              className={`flex flex-col gap-6 ${
                field.isRange
                  ? 'p-6 bg-primary/5 rounded-3xl border border-primary/10'
                  : ''
              }`}
            >
              {field.isRange && (
                <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest leading-none">
                  Start Period
                </p>
              )}
              <div className="flex gap-4">
                <div className="w-48">
                  <Dropdown
                    fullWidth
                    label={(() => {
                      const target = field.isRange
                        ? (value as RangeValue)?.start
                        : value;
                      return target &&
                        typeof target === 'object' &&
                        !Array.isArray(target) &&
                        (target as DateValue).month
                        ? (target as DateValue).month
                        : 'Month';
                    })()}
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
                    ]
                      .filter((month) => {
                        const months = [
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
                        ];
                        const target = field.isRange
                          ? (value as RangeValue)?.start
                          : value;
                        const currentYear =
                          target &&
                          typeof target === 'object' &&
                          !Array.isArray(target)
                            ? Number((target as DateValue).year)
                            : null;

                        let minIdx = 0;
                        let maxIdx = 11;
                        if (
                          currentYear &&
                          field.minYear &&
                          currentYear === field.minYear &&
                          field.minMonth
                        )
                          minIdx = months.indexOf(field.minMonth);
                        if (
                          currentYear &&
                          field.maxYear &&
                          currentYear === field.maxYear &&
                          field.maxMonth
                        )
                          maxIdx = months.indexOf(field.maxMonth);

                        const currIdx = months.indexOf(month);
                        return currIdx >= minIdx && currIdx <= maxIdx;
                      })
                      .map((month) => ({
                        id: month,
                        label: month,
                        onClick: () => {
                          const target = field.isRange
                            ? (value as RangeValue)?.start
                            : (value as DateValue);
                          const current =
                            target &&
                            typeof target === 'object' &&
                            !Array.isArray(target)
                              ? target
                              : {};
                          const next = { ...current, month };
                          if (field.isRange) {
                            onValueChange({ ...(value as RangeValue), start: next });
                          } else {
                            onValueChange(next);
                          }
                        },
                      }))}
                  />
                </div>
                <div className="w-32">
                  <Dropdown
                    fullWidth
                    label={(() => {
                      const target = field.isRange
                        ? (value as RangeValue)?.start
                        : value;
                      return target &&
                        typeof target === 'object' &&
                        !Array.isArray(target) &&
                        (target as DateValue).year
                        ? (target as DateValue).year
                        : 'Year';
                    })()}
                    items={(() => {
                      const startYear =
                        field.minYear || new Date().getFullYear() - 10;
                      const endYear =
                        field.maxYear || new Date().getFullYear() + 10;
                      const length = Math.max(0, endYear - startYear + 1);
                      return Array.from({ length }, (_, i) => {
                        const year = String(startYear + i);
                        return {
                          id: year,
                          label: year,
                          onClick: () => {
                            const target = field.isRange
                              ? (value as RangeValue)?.start
                              : (value as DateValue);
                            const current =
                              target &&
                              typeof target === 'object' &&
                              !Array.isArray(target)
                                ? target
                                : {};
                            const next = { ...current, year };
                            if (field.isRange) {
                              onValueChange({ ...(value as RangeValue), start: next });
                            } else {
                              onValueChange(next);
                            }
                          },
                        };
                      });
                    })()}
                  />
                </div>
              </div>

              {field.isRange && (
                <>
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-primary/10" />
                    <span className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">
                      End Period
                    </span>
                    <div className="h-px flex-1 bg-primary/10" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-48">
                      <Dropdown
                        fullWidth
                        label={(() => {
                          const range =
                            value &&
                            typeof value === 'object' &&
                            !Array.isArray(value)
                              ? (value as RangeValue)
                              : undefined;
                          const endValue = range?.end;
                          const endMonth =
                            endValue &&
                            typeof endValue === 'object' &&
                            !Array.isArray(endValue)
                              ? (endValue as DateValue).month
                              : undefined;
                          return endMonth ?? 'Month';
                        })()}
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
                        ]
                          .filter((month) => {
                            const months = [
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
                            ];
                            const range =
                              value &&
                              typeof value === 'object' &&
                              !Array.isArray(value)
                                ? (value as RangeValue)
                                : undefined;
                            const target = range?.end;
                            const currentYear =
                              target &&
                              typeof target === 'object' &&
                              !Array.isArray(target)
                                ? Number((target as DateValue).year)
                                : null;

                            let minIdx = 0;
                            let maxIdx = 11;
                            if (
                              currentYear &&
                              field.minYear &&
                              currentYear === field.minYear &&
                              field.minMonth
                            )
                              minIdx = months.indexOf(field.minMonth);
                            if (
                              currentYear &&
                              field.maxYear &&
                              currentYear === field.maxYear &&
                              field.maxMonth
                            )
                              maxIdx = months.indexOf(field.maxMonth);

                            const currIdx = months.indexOf(month);
                            return currIdx >= minIdx && currIdx <= maxIdx;
                          })
                          .map((month) => ({
                            id: month,
                            label: month,
                            onClick: () => {
                              const target = (value as RangeValue)?.end;
                              const current =
                                target &&
                                typeof target === 'object' &&
                                !Array.isArray(target)
                                  ? target
                                  : {};
                              onValueChange({
                                ...(value as RangeValue),
                                end: { ...current, month },
                              });
                            },
                          }))}
                      />
                    </div>
                    <div className="w-32">
                      <Dropdown
                        fullWidth
                        label={(() => {
                          const range =
                            value &&
                            typeof value === 'object' &&
                            !Array.isArray(value)
                              ? (value as RangeValue)
                              : undefined;
                          const endValue = range?.end;
                          const endYear =
                            endValue &&
                            typeof endValue === 'object' &&
                            !Array.isArray(endValue)
                              ? (endValue as DateValue).year
                              : undefined;
                          return endYear ?? 'Year';
                        })()}
                        items={(() => {
                          const startYear =
                            field.minYear || new Date().getFullYear() - 10;
                          const endYear =
                            field.maxYear || new Date().getFullYear() + 10;
                          const length = Math.max(0, endYear - startYear + 1);
                          return Array.from({ length }, (_, i) => {
                            const year = String(startYear + i);
                            return {
                              id: year,
                              label: year,
                              onClick: () => {
                                const target = (value as RangeValue)?.end;
                                const current =
                                  target &&
                                  typeof target === 'object' &&
                                  !Array.isArray(target)
                                    ? target
                                    : {};
                                onValueChange({
                                  ...(value as RangeValue),
                                  end: { ...current, year },
                                });
                              },
                            };
                          });
                        })()}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {field.input_type === 'number' && (
            <input
              type="number"
              value={
                value && typeof value === 'object' && !Array.isArray(value)
                  ? value.selection || ''
                  : typeof value === 'string' || typeof value === 'number'
                    ? String(value)
                    : ''
              }
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={field.placeholder || '0'}
              className="w-64 border-b-2 border-gray-100 py-3 outline-none focus:border-primary transition-all bg-transparent text-gray-900 font-bold placeholder:text-gray-300"
            />
          )}

          {field.input_type === 'text_area' && (
            <textarea
              value={
                value && typeof value === 'object' && !Array.isArray(value)
                  ? value.selection || ''
                  : typeof value === 'string'
                    ? value
                    : ''
              }
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={field.placeholder || 'Long answer text here...'}
              rows={3}
              className="w-full border-b-2 border-gray-100 py-3 outline-none focus:border-primary transition-all bg-transparent text-gray-900 font-bold placeholder:text-gray-300 resize-none"
            />
          )}

          {['radio', 'checklist'].includes(field.input_type) && (
            <div className="space-y-4">
              {field.input_type === 'checklist' && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Multi-select (Additive)
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {(field.options || []).map((option, i) => {
                  const label = getOptionLabel(option);
                  const selected = isSelected(label);

                  return (
                    <div key={i} className="space-y-4 text-left">
                      <button
                        type="button"
                        onClick={() => handleOptionChange(label)}
                        className="flex items-center gap-4 group w-full text-left"
                      >
                        <div
                          className={`h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                            selected
                              ? field.input_type === 'radio'
                                ? 'border-primary bg-primary/5'
                                : 'border-primary bg-primary'
                              : 'border-gray-200 group-hover:border-primary/50'
                          }`}
                        >
                          {selected &&
                            (field.input_type === 'radio' ? (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary animate-in zoom-in-50" />
                            ) : (
                              <div className="h-3 w-3 bg-white rounded-sm animate-in zoom-in-50" />
                            ))}
                        </div>
                        <span
                          className={`font-bold transition-colors ${
                            selected ? 'text-primary' : 'text-gray-600'
                          }`}
                        >
                          {label}
                        </span>
                      </button>
                      {renderNestedQuestions(option, i)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {field.input_type === 'select' && (
            <div className="space-y-6">
              {(() => {
                const selection =
                  value && typeof value === 'object' && !Array.isArray(value)
                    ? value.selection
                    : value;

                const dropdownLabel =
                  Array.isArray(selection)
                    ? selection.join(', ')
                    : selection != null
                      ? String(selection)
                      : 'Select an option';

                return (
                  <Dropdown
                    fullWidth
                    label={dropdownLabel}
                    items={(field.options || []).map((opt, i) => ({
                      id: i,
                      label: getOptionLabel(opt),
                      onClick: () => handleOptionChange(getOptionLabel(opt)),
                    }))}
                  />
                );
              })()}
              {(field.options || []).map((option, i) => (
                <div key={i}>{renderNestedQuestions(option, i)}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ShadowCard>
  );
};

const SuccessModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    />
    <div className="relative bg-white w-full max-w-lg rounded-[48px] p-12 text-center shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Submission Successful!</h2>
      <p className="text-gray-500 font-medium mb-10 leading-relaxed">
        This is a demo of how the client will see their response confirmation. In production,
        this data would be sent to the dashboard.
      </p>
      <Button
        onClick={onClose}
        className="w-full rounded-3xl py-4 font-bold text-lg shadow-xl shadow-primary/20"
      >
        Got it, Thanks!
      </Button>
      <button
        onClick={onClose}
        className="absolute top-8 right-8 p-2 text-gray-300 hover:text-gray-900 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  </div>
);

const TemplatePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, PreviewValue>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: template, isLoading } = useQuery({
    queryKey: ['service-request-template', id],
    queryFn: async () => {
      const response = await apiGet<{ data: ServiceRequestTemplate }>(
        endPoints.SERVICE_REQUEST_TEMPLATE.GET_BY_ID(id!),
      );
      return response.data;
    },
    enabled: !!id,
  });

  const handleAnswerChange = (index: number, value: PreviewValue) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7ff] flex items-center justify-center p-8">
        <div className="w-full max-w-3xl space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-60 w-full rounded-2xl" />
          <Skeleton className="h-60 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!id || !template) {
    return (
      <div className="min-h-screen bg-[#f5f7ff] flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Template Not Found</h2>
        <Button onClick={() => navigate(-1)} variant="secondary">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0ebf8] flex flex-col items-center py-4 md:py-12 px-4 selection:bg-primary selection:text-white">
      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}

      <div className="w-full max-w-6xl flex flex-col gap-8">
        <div className="flex justify-start">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="bg-white border-none shadow-sm rounded-xl px-6 py-2.5 hover:bg-white/80 transition-all font-bold group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Template
          </Button>
        </div>

        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-4 bg-primary rounded-t-3xl" />
          <ShadowCard className="p-12 border-none bg-white rounded-3xl shadow-md">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              {template.service?.replace(/_/g, ' ') || 'General Section'}
            </h1>
            <div className="flex items-center gap-6 text-gray-500 font-medium">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Preview Mode
                </span>
              </div>
              <p className="leading-relaxed max-w-2xl">
                This interactive demo shows exactly how the form will function for clients.
              </p>
            </div>
          </ShadowCard>
        </div>

        <div className="space-y-8 pb-24">
          {template.formFields.map((field, index) => (
            <PreviewField
              key={index}
              field={field}
              value={answers[index]}
              onValueChange={(val) => handleAnswerChange(index, val)}
            />
          ))}

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-gray-200">
            <div className="flex flex-col">
              <h4 className="text-xl font-bold text-gray-900 mb-1">Ready to test?</h4>
              <p className="text-gray-400 font-medium">
                Click submit to see the success state
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                  Sandbox Environment
                </p>
                <p className="text-[9px] text-gray-300 font-medium">
                  Responses are not saved
                </p>
              </div>
              <Button
                onClick={() => setShowSuccess(true)}
                className="rounded-[24px] px-16 py-4 font-bold text-lg shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                <Send className="h-5 w-5" />
                Submit Form
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;

