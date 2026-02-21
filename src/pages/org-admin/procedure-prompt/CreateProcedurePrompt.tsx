import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  ArrowLeft, 
  Save, 
  Globe, 
  Building, 
  Type, 
  FileText,
  Layers,
  Tag
} from 'lucide-react';
import { Button } from '../../../ui/Button';
import { PageHeader } from '../../common/PageHeader';
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import { ShadowCard } from '../../../ui/ShadowCard';
import AlertMessage from '../../common/AlertMessage';
import { useAuth } from '../../../context/auth-context-core';
import { 
  ProcedurePromptScope, 
  ProcedurePromptCategory, 
  ProcedureType,
} from '../../../types/procedure-prompt';
import type { CreateProcedurePromptData } from '../../../types/procedure-prompt';

const CreateProcedurePrompt: React.FC = () => {
  const navigate = useNavigate();
  const { organizationMember } = useAuth();
  const orgId = organizationMember?.organizationId;
  const [alert, setAlert] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);
  
  const [formData, setFormData] = useState<CreateProcedurePromptData>({
    title: '',
    description: '',
    prompt: '',
    scopeType: ProcedurePromptScope.ORGANIZATIONAL, // Default to organizational for Org Admin
    procedureType: ProcedureType.PLANNING,
    category: ProcedurePromptCategory.QUESTIONS,
    organizationId: orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProcedurePromptData) => apiPost(endPoints.PROCEDURE_PROMPT.CREATE, data as any),
    onSuccess: () => {
      setAlert({ message: 'Procedure prompt created successfully', variant: 'success' });
      setTimeout(() => navigate('/dashboard/procedure-prompts'), 1500);
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to create procedure prompt';
      setAlert({ message, variant: 'danger' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.prompt) {
      setAlert({ message: 'Title and Prompt text are required', variant: 'danger' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Procedure Prompt" 
        icon={MessageSquare}
        description="Define a new AI prompt for audit procedures."
        actions={
          <Button variant="header" onClick={() => navigate('/dashboard/procedure-prompts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        }
      />

      {alert && (
        <AlertMessage 
          message={alert.message} 
          variant={alert.variant} 
          onClose={() => setAlert(null)} 
        />
      )}

      <ShadowCard className="p-8 border border-gray-100 shadow-sm rounded-3xl bg-white mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                Prompt Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Planning Phase Questions"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Scope Type
              </label>
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-600 flex items-center gap-2">
                <Building className="h-3 w-3" />
                ORGANIZATIONAL ({organizationMember?.organization?.name})
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Procedure Type
              </label>
              <select
                name="procedureType"
                value={formData.procedureType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium appearance-none"
              >
                <option value={ProcedureType.PLANNING}>PLANNING</option>
                <option value={ProcedureType.FIELDWORK}>FIELDWORK</option>
                <option value={ProcedureType.COMPLETION}>COMPLETION</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium appearance-none"
              >
                <option value={ProcedurePromptCategory.QUESTIONS}>QUESTIONS</option>
                <option value={ProcedurePromptCategory.ANSWERS}>ANSWERS</option>
                <option value={ProcedurePromptCategory.RECOMMENDATIONS}>RECOMMENDATIONS</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Provide a brief description of what this prompt is used for..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Prompt Text
            </label>
            <textarea
              name="prompt"
              value={formData.prompt}
              onChange={handleChange}
              rows={8}
              placeholder="Enter the complete AI prompt text here..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium resize-y"
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-2xl px-8"
              onClick={() => navigate('/dashboard/procedure-prompts')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="rounded-2xl px-12"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Prompt
                </>
              )}
            </Button>
          </div>
        </form>
      </ShadowCard>
    </div>
  );
};

export default CreateProcedurePrompt;
