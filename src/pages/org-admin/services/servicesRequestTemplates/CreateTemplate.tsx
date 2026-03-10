import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Settings2,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { Button } from '../../../../ui/Button';
import type { CreateTemplateDto, FormField } from '../../../../types/service-request-template';
import AlertMessage from '../../../common/AlertMessage';
import PageHeader from '../../../common/PageHeader';
import { ShadowCard } from '../../../../ui/ShadowCard';
import { TemplatesProvider, useTemplates } from '../../context/ServicesContext';
import { TemplateSettingsCard } from './TemplateSettingsCard';
import { FieldCard } from './FieldCard';

const CreateTemplateContent: React.FC = () => {
  const navigate = useNavigate();
  const {
    templates,
    createMutation,
    inputTypeIcons,
    inputTypeItems,
    requiredTabs,
    serviceOptions,
    customServices,
  } = useTemplates();

  const [alert, setAlert] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);
  const [formData, setFormData] = useState<CreateTemplateDto>({
    service: null,
    type: 'SERVICE', // Changed default from GENERAL to SERVICE
    isActive: true,
    formFields: [{ question: '', input_type: 'text', required: true }],
  });

  const templatedServices = useMemo(() => {
    return templates.map(t => ({
      service: t.service as string | null,
      customServiceCycleId: t.customServiceCycleId
    }));
  }, [templates]);

  // Removed auto-selection of first available service to address user feedback
  // about unexpected default value "ACCOUNTING".

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleUpdateTemplate = (updates: Partial<CreateTemplateDto>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...formData.formFields];
    newFields[index] = { ...newFields[index], ...updates };
    handleUpdateTemplate({ formFields: newFields });
  };

  const addField = () => {
    handleUpdateTemplate({
      formFields: [
        { question: '', input_type: 'text', required: true },
        ...formData.formFields,
      ],
    });
  };

  const removeField = (index: number) => {
    handleUpdateTemplate({
      formFields: formData.formFields.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    if (!formData.formFields.length) {
      setAlert({ message: 'Please add at least one form field', variant: 'danger' });
      return;
    }

    const invalidFields = formData.formFields.some((f) => !f.question.trim());
    if (invalidFields) {
      setAlert({ message: 'Please fill in all question texts', variant: 'danger' });
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setAlert({ message: 'Template created successfully', variant: 'success' });
      setTimeout(() => navigate('/dashboard/service-request-templates'), 1500);
    } catch (err) {
      setAlert({
        message: (err as Error).message || 'Failed to create template',
        variant: 'danger',
      });
    }
  };

  return (
    <div className="space-y-6" ref={containerRef}>
      <PageHeader
        title="Create New Template"
        icon={FileText}
        description="Define form fields for a new service section"
        actions={
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/dashboard/service-request-templates')} variant="header">
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || !formData.service}
              variant="header"
            >
              <Save className="h-5 w-5 mr-2" />
              {createMutation.isPending ? 'Saving...' : 'Create Template'}
            </Button>
          </div>
        }
      />

      {alert && (
        <div className="animate-in fade-in slide-in-from-top duration-300">
          <AlertMessage
            message={alert.message}
            variant={alert.variant}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <div className="space-y-6">
        <TemplateSettingsCard
          formData={formData}
          isEdit={true}
          onUpdate={handleUpdateTemplate}
          serviceOptions={serviceOptions}
          customServices={customServices}
          hideMetadata={true}
          templatedServices={templatedServices}
        />

        <ShadowCard className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Form Fields
            </h3>

            <Button onClick={addField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          <div className="space-y-4">
            {formData.formFields.map((field, index) => (
              <FieldCard
                key={index}
                field={field}
                index={index}
                isEdit={true}
                isGlobalEdit={true}
                onUpdate={(updates) => updateField(index, updates)}
                onRemove={() => removeField(index)}
                inputTypeIcons={inputTypeIcons}
                inputTypeItems={inputTypeItems}
                requiredTabs={requiredTabs}
                isCollapsed={false}
              />
            ))}

            {formData.formFields.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[32px]">
                <p className="text-gray-400 font-medium">
                  No fields added yet. Click &apos;Add Field&apos; to start.
                </p>
              </div>
            )}
          </div>
        </ShadowCard>
      </div>
    </div>
  );
};

const CreateTemplate: React.FC = () => (
  <TemplatesProvider>
    <CreateTemplateContent />
  </TemplatesProvider>
);

export default CreateTemplate;

