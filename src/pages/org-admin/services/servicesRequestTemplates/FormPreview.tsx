import React from 'react';
import { X, CornerDownRight } from 'lucide-react';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { Button } from '../../../../ui/Button';
import type {
  ServiceRequestTemplate,
  FormField,
} from '../../../../types/service-request-template';
import {
  isOptionWithQuestions,
  getOptionLabel,
} from '../../../../types/service-request-template';

interface FormPreviewProps {
  template: ServiceRequestTemplate;
  onClose: () => void;
}

const PreviewField: React.FC<{ field: FormField }> = ({ field }) => {
  return (
    <ShadowCard className="p-8 border-l-8 border-l-primary border border-gray-100 bg-white rounded-2xl hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <label className="text-lg font-semibold text-gray-900 flex gap-2">
            {field.question}
            {field.required && <span className="text-red-500 font-bold">*</span>}
          </label>
        </div>

        {field.placeholder && (
          <p className="text-xs text-gray-400 italic flex items-center gap-1">
            <CornerDownRight className="h-3 w-3" />
            {field.placeholder}
          </p>
        )}

        <div className="mt-4">
          {field.input_type === 'text' && (
            <input
              type="text"
              placeholder={field.placeholder || 'Your answer'}
              disabled
              className="w-full border-b-2 border-gray-100 py-2 outline-none focus:border-primary transition-colors bg-transparent text-gray-400 cursor-not-allowed"
            />
          )}

          {field.input_type === 'number' && (
            <input
              type="number"
              placeholder={field.placeholder || '0'}
              disabled
              className="w-64 border-b-2 border-gray-100 py-2 outline-none focus:border-primary transition-colors bg-transparent text-gray-400 cursor-not-allowed"
            />
          )}

          {field.input_type === 'text_area' && (
            <textarea
              placeholder={field.placeholder || 'Long answer text'}
              disabled
              rows={3}
              className="w-full border-b-2 border-gray-100 py-2 outline-none focus:border-primary transition-colors bg-transparent text-gray-400 cursor-not-allowed resize-none"
            />
          )}

          {field.input_type === 'radio' && (
            <div className="space-y-4">
              {(field.options || []).map((option, i) => {
                const isComplex = isOptionWithQuestions(option);
                return (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-3 group">
                      <div className="h-5 w-5 rounded-full border-2 border-gray-200 group-hover:border-primary transition-colors" />
                      <span className="text-gray-600 font-medium">
                        {getOptionLabel(option)}
                      </span>
                    </div>
                    {isComplex && option.questions && option.questions.length > 0 && (
                      <div className="ml-8 space-y-4 border-l-2 border-primary/10 pl-6 py-2">
                        <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">
                          Conditional Questions
                        </p>
                        {option.questions.map((q, qidx) => (
                          <PreviewField key={qidx} field={q} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {field.input_type === 'month' && (
            <div className="flex items-center gap-4">
              <div className="w-64 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-sm text-gray-400 italic">
                {field.isRange
                  ? 'From: Month'
                  : field.minMonth && field.maxMonth
                    ? `Month (${field.minMonth.substring(0, 3)} - ${field.maxMonth.substring(0, 3)})`
                    : 'Select Month'}
                <CornerDownRight className="h-4 w-4 rotate-90" />
              </div>
              {field.isRange && (
                <>
                  <div className="text-gray-300 font-bold">to</div>
                  <div className="w-64 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-sm text-gray-400 italic">
                    To: Month
                    <CornerDownRight className="h-4 w-4 rotate-90" />
                  </div>
                </>
              )}
            </div>
          )}

          {field.input_type === 'select' && (
            <div className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-sm text-gray-400 italic">
              Select an option
              <CornerDownRight className="h-4 w-4 rotate-90" />
            </div>
          )}

          {field.input_type === 'year' && (
            <div className="flex items-center gap-4">
              <div className="w-64 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-sm text-gray-400 italic">
                {field.isRange
                  ? 'From: Year'
                  : field.minYear && field.maxYear
                    ? `Year (${field.minYear} - ${field.maxYear})`
                    : 'Select Year'}
                <CornerDownRight className="h-4 w-4 rotate-90" />
              </div>
              {field.isRange && (
                <>
                  <div className="text-gray-300 font-bold">to</div>
                  <div className="w-64 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-sm text-gray-400 italic">
                    To: Year
                    <CornerDownRight className="h-4 w-4 rotate-90" />
                  </div>
                </>
              )}
            </div>
          )}

          {field.input_type === 'month_year' && (
            <div
              className={`space-y-4 ${
                field.isRange
                  ? 'p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200'
                  : ''
              }`}
            >
              {field.isRange && (
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-2">
                  Start Period
                </p>
              )}
              <div className="flex gap-4">
                <div className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-sm text-gray-400 italic">
                  {field.isRange
                    ? 'Month'
                    : field.minMonth && field.maxMonth
                      ? `Month (${field.minMonth.substring(0, 3)} - ${field.maxMonth.substring(0, 3)})`
                      : 'Month'}
                  <CornerDownRight className="h-4 w-4 rotate-90" />
                </div>
                <div className="w-32 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-sm text-gray-400 italic">
                  {field.isRange
                    ? 'Year'
                    : field.minYear && field.maxYear
                      ? `${field.minYear}-${field.maxYear}`
                      : 'Year'}
                  <CornerDownRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
              {field.isRange && (
                <>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-2">
                    End Period
                  </p>
                  <div className="flex gap-4">
                    <div className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-sm text-gray-400 italic">
                      Month
                      <CornerDownRight className="h-4 w-4 rotate-90" />
                    </div>
                    <div className="w-32 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-sm text-gray-400 italic">
                      Year
                      <CornerDownRight className="h-4 w-4 rotate-90" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {field.input_type === 'checklist' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                  Multi-select (Additive)
                </p>
              </div>
              <div className="space-y-4">
                {(field.options || []).map((option, i) => {
                  const isComplex = isOptionWithQuestions(option);
                  return (
                    <div key={i} className="space-y-3">
                      <div className="flex items-center gap-3 group">
                        <div className="h-5 w-5 rounded border-2 border-gray-200 group-hover:border-primary transition-colors" />
                        <span className="text-gray-600 font-medium">
                          {getOptionLabel(option)}
                        </span>
                      </div>
                      {isComplex && option.questions && option.questions.length > 0 && (
                        <div className="ml-8 space-y-4 border-l-2 border-primary/10 pl-6 py-2">
                          <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">
                            Conditional Questions
                          </p>
                          {option.questions.map((q, qidx) => (
                            <PreviewField key={qidx} field={q} />
                          ))}
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
    </ShadowCard>
  );
};

export const FormPreview: React.FC<FormPreviewProps> = ({ template, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#f0ebf8] w-full max-w-3xl h-full flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-white px-8 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CornerDownRight className="h-5 w-5 text-primary rotate-90" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Form Preview</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                Standard View
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 scrollbar-hide">
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-2 bg-primary rounded-t-xl" />
            <ShadowCard className="p-10 border border-gray-100 bg-white rounded-2xl shadow-sm">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {template.service?.replace(/_/g, ' ') || 'General Section'}
              </h1>
              <div className="h-1 w-20 bg-primary/20 rounded-full mb-6" />
              <p className="text-gray-500 font-medium">
                This is how the section will appear to the client. Responses are not saved in
                preview mode.
              </p>
            </ShadowCard>
          </div>

          {template.formFields.map((field, index) => (
            <PreviewField key={index} field={field} />
          ))}

          <div className="flex items-center justify-between py-8">
            <Button
              disabled
              className="rounded-xl px-10 py-3 font-bold opacity-50"
            >
              Submit Form
            </Button>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Preview Mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;

