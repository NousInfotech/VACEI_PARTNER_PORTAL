import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  MessageSquare, 
  ArrowLeft, 
  Save, 
  Globe, 
  Building, 
  Type, 
  FileText,
  Layers,
  Tag,
  Loader2
} from 'lucide-react';
import { Button } from '../../../ui/Button';
import { PageHeader } from '../../common/PageHeader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiGet, apiPut } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import { ShadowCard } from '../../../ui/ShadowCard';
import AlertMessage from '../../common/AlertMessage';
import { Skeleton } from '../../../ui/Skeleton';
import { 
  ProcedurePromptCategory, 
  ProcedureType,
} from '../../../types/procedure-prompt';
import type { 
  ProcedurePrompt,
  UpdateProcedurePromptData 
} from '../../../types/procedure-prompt';

const EditProcedurePrompt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);
  
  const [formData, setFormData] = useState<UpdateProcedurePromptData>({
    title: '',
    description: '',
    prompt: '',
    procedureType: ProcedureType.PLANNING,
    category: ProcedurePromptCategory.QUESTIONS,
  });

  const { data: promptData, isLoading: isPromptLoading } = useQuery({
    queryKey: ['procedure-prompt', id],
    queryFn: () => apiGet<{ data: ProcedurePrompt }>(endPoints.PROCEDURE_PROMPT.GET_BY_ID(id!)),
    enabled: !!id,
  });

  useEffect(() => {
    if (promptData?.data) {
      const p = promptData.data;
      setFormData({
        title: p.title,
        description: p.description,
        prompt: p.prompt,
        procedureType: p.procedureType,
        category: p.category,
      });
    }
  }, [promptData]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProcedurePromptData) => apiPut(endPoints.PROCEDURE_PROMPT.UPDATE(id!), data as any),
    onSuccess: () => {
      setAlert({ message: 'Procedure prompt updated successfully', variant: 'success' });
      setTimeout(() => navigate('/dashboard/procedure-prompts'), 1500);
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to update procedure prompt';
      setAlert({ message, variant: 'danger' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.prompt) {
      setAlert({ message: 'Title and Prompt text are required', variant: 'danger' });
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isPromptLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Procedure Prompt" icon={MessageSquare} />
        <ShadowCard className="p-8 border border-gray-100 shadow-sm rounded-3xl bg-white mx-auto space-y-6">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </ShadowCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Edit Procedure Prompt" 
        icon={MessageSquare}
        description="Modify existing AI prompt for audit procedures."
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
                Scope Type (Read-only)
              </label>
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-600 flex items-center gap-2">
                {promptData?.data?.scopeType === 'GLOBAL' ? <Globe className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                {promptData?.data?.scopeType} {promptData?.data?.organization?.name ? `- ${promptData.data.organization.name}` : ''}
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
              rows={12}
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {updateMutation.isPending ? 'Updating...' : 'Update Prompt'}
            </Button>
          </div>
        </form>
      </ShadowCard>
    </div>
  );
};

export default EditProcedurePrompt;
