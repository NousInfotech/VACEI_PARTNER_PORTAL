import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Trash2, FileText, Layers, CheckSquare, GripVertical, Info, LayoutGrid
} from 'lucide-react';
import { Button } from '../../../ui/Button';
import PageHeader from '../../common/PageHeader';
import { ShadowCard } from '../../../ui/ShadowCard';
import AlertMessage from '../../common/AlertMessage';
import { apiGet, apiPost, apiPostFormData } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import { ALL_SERVICES, SERVICES_LABELS } from '../../../types/template';
import type {
  TemplateType, TemplateModuleType, Services,
  MilestoneContentItem, ChecklistUINode, TemplateApiResponse,
  RequestedDocumentType, RequestedDocumentCount
} from '../../../types/template';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '../../../context/auth-context-core';

// ─── Helpers ────────────────────────────────────────────────────

function flattenChecklist(nodes: ChecklistUINode[], parentId: string | null = null, level: 1 | 2 | 3 = 1) {
  const items: { id: string; title: string; parentId: string | null; level: 1 | 2 | 3 }[] = [];
  nodes.forEach(node => {
    items.push({ id: node.id, title: node.title, parentId, level });
    if (node.children.length > 0 && level < 3) {
      items.push(...flattenChecklist(node.children, node.id, (level + 1) as 1 | 2 | 3));
    }
  });
  return items;
}

// ─── Sub-components ──────────────────────────────────────────────

type MultipleItem = { 
  _id: string; 
  label: string; 
  instruction: string; 
  templateFile: File | null; 
  isMandatory: boolean;
  templateFileId?: string | null;
};

type DocRowData = {
  _id: string;
  documentName: string;
  type: RequestedDocumentType;
  count: RequestedDocumentCount;
  isMandatory: boolean;
  templateFileId?: string | null;
  description: string;
  templateFile: File | null;
  templateInstructions: string;
  multipleItems: MultipleItem[];
};

interface DocRowProps {
  doc: DocRowData;
  index: number;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onRemove: (id: string) => void;
}

const DocRow: React.FC<DocRowProps> = ({ doc, index, onUpdate, onRemove }) => {
  const isTemplate = doc.type === 'TEMPLATE';
  const isMultiple = doc.count === 'MULTIPLE';

  const updateMultipleItem = (idx: number, field: string, value: unknown) => {
    const updated = doc.multipleItems.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onUpdate(doc._id, 'multipleItems', updated);
  };
  const addMultipleItem = () => onUpdate(doc._id, 'multipleItems', [...doc.multipleItems, { _id: uuidv4(), label: '', instruction: '', templateFile: null, isMandatory: true }]);
  const removeMultipleItem = (idx: number) => onUpdate(doc._id, 'multipleItems', doc.multipleItems.filter((_, i) => i !== idx));

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Row header */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <GripVertical className="h-3.5 w-3.5" />
          Document #{index + 1}
          <button type="button" onClick={() => onRemove(doc._id)} className="ml-auto p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Row 1: Name + Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Document Name *</label>
            <input
              value={doc.documentName}
              onChange={(e) => onUpdate(doc._id, 'documentName', e.target.value)}
              placeholder="e.g. Passport Copy"
              className="w-full h-9 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Type</label>
            <select
              value={doc.type}
              onChange={(e) => onUpdate(doc._id, 'type', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            >
              <option value="DIRECT">Direct Upload</option>
              <option value="TEMPLATE">Template Based</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Description</label>
          <textarea
            value={doc.description}
            onChange={(e) => onUpdate(doc._id, 'description', e.target.value)}
            placeholder="e.g. Please provide a clear copy of the front and back..."
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/10 transition-all resize-none"
          />
        </div>

        {/* Row 2: Copy Mode + Mandatory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Copy Mode</label>
            <select
              value={doc.count}
              onChange={(e) => onUpdate(doc._id, 'count', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            >
              <option value="SINGLE">Single Copy</option>
              <option value="MULTIPLE">Multiple Copies (Group)</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id={`mandatory-${doc._id}`}
              checked={doc.isMandatory}
              onChange={(e) => onUpdate(doc._id, 'isMandatory', e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <label htmlFor={`mandatory-${doc._id}`} className="text-sm font-medium text-gray-700 cursor-pointer">Mark as Mandatory</label>
          </div>
        </div>

        {/* Template Config — only when TEMPLATE + SINGLE */}
        {isTemplate && !isMultiple && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
              <Info className="h-4 w-4" /> Template Configuration
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Template File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                  onChange={(e) => onUpdate(doc._id, 'templateFile', e.target.files?.[0] || null)}
                  className="w-full text-xs text-blue-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 rounded-xl border border-blue-200 bg-white px-2 py-1.5 cursor-pointer"
                />
                {doc.templateFile && (
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 px-1">
                    <CheckSquare className="h-3 w-3" /> Selected: {doc.templateFile.name}
                  </p>
                )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Instructions</label>
              <textarea
                value={doc.templateInstructions}
                onChange={(e) => onUpdate(doc._id, 'templateInstructions', e.target.value)}
                placeholder="How should they fill this?"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-200 outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Multiple Copy Labels — only when MULTIPLE */}
        {isMultiple && (
          <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                <LayoutGrid className="h-4 w-4" /> Multiple Copy Labels
              </div>
              <button
                type="button"
                onClick={addMultipleItem}
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-white border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Label
              </button>
            </div>

            <div className="space-y-4">
              {doc.multipleItems.map((item, idx) => (
                <div key={item._id} className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Label {idx + 1}</label>
                      <input
                        value={item.label}
                        onChange={(e) => updateMultipleItem(idx, 'label', e.target.value)}
                        placeholder="e.g. Page 1"
                        className="w-full h-9 px-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>
                    {doc.multipleItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMultipleItem(idx)}
                        className="mt-6 p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className={`grid gap-3 ${isTemplate ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Instruction</label>
                      <input
                        value={item.instruction}
                        onChange={(e) => updateMultipleItem(idx, 'instruction', e.target.value)}
                        placeholder="Specific to this item..."
                        className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>
                    {isTemplate && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Template File</label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                          onChange={(e) => updateMultipleItem(idx, 'templateFile', e.target.files?.[0] || null)}
                          className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 cursor-pointer"
                        />
                        {item.templateFile && (
                          <p className="text-[9px] text-emerald-600 font-bold px-1 line-clamp-1">
                            Selected: {item.templateFile.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {doc.multipleItems.length === 0 && (
                <p className="text-xs text-purple-400 italic text-center py-3">Add at least one label for multiple copies.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────

type MilestoneStep = MilestoneContentItem & { _id: string };
type ChecklistL1 = ChecklistUINode;

const CreateTemplateForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const typeParam = (searchParams.get('type') as TemplateType) || 'DOCUMENT_REQUEST';
  const moduleTypeParam = (searchParams.get('moduleType') as TemplateModuleType) || 'ENGAGEMENT';

  const { organizationMember, selectedService, selectedServiceLabel } = useAuth();
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceCategory, setServiceCategory] = useState<Services | ''>((selectedService as Services) || '');
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [alert, setAlert] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  // Document rows
  const [docRows, setDocRows] = useState<DocRowData[]>([{
    _id: uuidv4(), documentName: '', type: 'DIRECT', count: 'SINGLE',
    isMandatory: true, description: '', templateFile: null, templateInstructions: '', multipleItems: [],
  }]);

  // Milestone steps
  const [milestoneSteps, setMilestoneSteps] = useState<MilestoneStep[]>([
    { _id: uuidv4(), title: '', description: '' },
  ]);

  // Checklist tree (2 levels shown, flattened on save)
  const [checklistNodes, setChecklistNodes] = useState<ChecklistL1[]>([
    { id: uuidv4(), title: '', children: [] },
  ]);

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => apiPost<TemplateApiResponse>(endPoints.TEMPLATE.CREATE, payload as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate('/dashboard/templates');
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message || 'Failed to create template';
      setAlert({ message: msg, variant: 'danger' });
    },
  });

  // ─── Doc row handlers ────────────────────────────────────────
  const updateDoc = (id: string, field: string, value: unknown) => {
    setDocRows(rows => rows.map(r => r._id === id ? { ...r, [field]: value } : r));
  };

  // ─── Checklist handlers ──────────────────────────────────────
  const addL1 = () => setChecklistNodes(n => [...n, { id: uuidv4(), title: '', children: [] }]);
  const removeL1 = (id: string) => setChecklistNodes(n => n.filter(x => x.id !== id));
  const updateL1 = (id: string, title: string) => setChecklistNodes(n => n.map(x => x.id === id ? { ...x, title } : x));
  const addL2 = (parentId: string) => setChecklistNodes(n => n.map(x => x.id === parentId
    ? { ...x, children: [...x.children, { id: uuidv4(), title: '', children: [] }] }
    : x));
  const removeL2 = (parentId: string, childId: string) => setChecklistNodes(n => n.map(x => x.id === parentId
    ? { ...x, children: x.children.filter(c => c.id !== childId) }
    : x));
  const updateL2 = (parentId: string, childId: string, title: string) => setChecklistNodes(n => n.map(x => x.id === parentId
    ? { ...x, children: x.children.map(c => c.id === childId ? { ...c, title } : c) }
    : x));
  const addL3 = (l1Id: string, l2Id: string) => setChecklistNodes(n => n.map(x => x.id === l1Id
    ? { ...x, children: x.children.map(c => c.id === l2Id ? { ...c, children: [...c.children, { id: uuidv4(), title: '', children: [] }] } : c) }
    : x));
  const removeL3 = (l1Id: string, l2Id: string, l3Id: string) => setChecklistNodes(n => n.map(x => x.id === l1Id
    ? { ...x, children: x.children.map(c => c.id === l2Id ? { ...c, children: c.children.filter(g => g.id !== l3Id) } : c) }
    : x));
  const updateL3 = (l1Id: string, l2Id: string, l3Id: string, title: string) => setChecklistNodes(n => n.map(x => x.id === l1Id
    ? { ...x, children: x.children.map(c => c.id === l2Id ? { ...c, children: c.children.map(g => g.id === l3Id ? { ...g, title } : g) } : c) }
    : x));

  // ─── Build content payload ───────────────────────────────────
  const buildContent = (
    uploadedFilesMap: Record<string, string>,
    multipleFilesMap: Record<string, Record<string, string>>
  ): unknown => {
    if (typeParam === 'DOCUMENT_REQUEST') {
      return {
        title: docTitle || name || 'Document Request',
        description: docDescription || null,
        documents: docRows.map(r => ({
          documentName: r.documentName,
          description: r.description || null,
          type: r.type,
          count: r.count,
          isMandatory: r.isMandatory,
          templateFileId: uploadedFilesMap[r._id] || null,
          templateInstructions: r.templateInstructions || null,
          multipleItems: (r.multipleItems || []).map(m => ({
            label: m.label,
            instruction: m.instruction || null,
            templateFileId: multipleFilesMap[r._id]?.[m._id] || null
          })),
        })),
      };
    }
    if (typeParam === 'MILESTONES') {
      return { steps: milestoneSteps.map(s => ({ title: s.title.trim(), description: s.description?.trim() || null })) };
    }
    if (typeParam === 'CHECKLIST') {
      return { items: flattenChecklist(checklistNodes) };
    }
    return null;
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlert({ message: 'Template name is required', variant: 'danger' });
      return;
    }
    if (typeParam === 'DOCUMENT_REQUEST') {
      if (docRows.some(r => !r.documentName.trim())) {
        setAlert({ message: 'All document rows must have a name', variant: 'danger' });
        return;
      }
    }

    try {
      setIsUploading(true);
      const uploadedFileIds: Record<string, string> = {};
      const multipleFileIds: Record<string, Record<string, string>> = {};

      let folderId = '';
      if (typeParam === 'DOCUMENT_REQUEST') {
        const hasFiles = docRows.some(r => 
          (r.type === 'TEMPLATE' && r.templateFile) || 
          (r.count === 'MULTIPLE' && r.multipleItems.some(m => m.templateFile))
        );

        if (hasFiles) {
          const res = await apiGet<{ data: { folderId: string } }>(endPoints.TEMPLATE.UPLOAD_FOLDER);
          folderId = res.data.folderId;
        }

        for (const row of docRows) {
          if (row.type === 'TEMPLATE' && row.templateFile) {
            const formData = new FormData();
            formData.append('file', row.templateFile);
            formData.append('folderId', folderId);
            const uploadRes = await apiPostFormData<{ data: { id: string } }>(endPoints.LIBRARY.FILE_UPLOAD, formData);
            uploadedFileIds[row._id] = uploadRes.data.id;
          }

          if (row.count === 'MULTIPLE') {
            multipleFileIds[row._id] = {};
            for (const mItem of row.multipleItems) {
              if (mItem.templateFile) {
                const formData = new FormData();
                formData.append('file', mItem.templateFile);
                formData.append('folderId', folderId);
                const uploadRes = await apiPostFormData<{ data: { id: string } }>(endPoints.LIBRARY.FILE_UPLOAD, formData);
                multipleFileIds[row._id][mItem._id] = uploadRes.data.id;
              }
            }
          }
        }
      }

      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        type: typeParam,
        moduleType: moduleTypeParam,
        content: buildContent(uploadedFileIds, multipleFileIds),
      };
      if (moduleTypeParam === 'ENGAGEMENT' && serviceCategory) {
        payload.serviceCategory = serviceCategory;
      }
      if (organizationMember?.organizationId) {
        payload.organizationId = organizationMember.organizationId;
      }

      createMutation.mutate(payload);
    } catch (error: any) {
      setAlert({ message: error.message || 'Error uploading files', variant: 'danger' });
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Header info ─────────────────────────────────────────────
  const typeInfo = {
    DOCUMENT_REQUEST: { label: 'Document Request', icon: FileText, color: 'text-primary bg-primary/5' },
    MILESTONES: { label: 'Milestone', icon: Layers, color: 'text-amber-600 bg-amber-50' },
    CHECKLIST: { label: 'Checklist', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50' },
  }[typeParam];
  const TypeIcon = typeInfo.icon;
  const moduleLabel = { ENGAGEMENT: 'Engagement', KYC: 'KYC', INCORPORATION: 'Incorporation' }[moduleTypeParam];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Template"
        icon={FileText}
        description={`Creating a new ${typeInfo.label} template for ${moduleLabel}.`}
        actions={
          <Button variant="outline" onClick={() => navigate('/dashboard/templates')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      {alert && <AlertMessage message={alert.message} variant={alert.variant} onClose={() => setAlert(null)} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meta section */}
        <ShadowCard className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-2xl ${typeInfo.color}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-base">Template Details</h2>
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-primary">{typeInfo.label}</span> · <span className="font-semibold">{moduleLabel}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Template Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard KYC Document Request"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition-all text-sm font-medium text-gray-800"
              />
            </div>
            {moduleTypeParam === 'ENGAGEMENT' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Service Category</label>
                {selectedService ? (
                  <div className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-100 flex items-center justify-between text-sm font-medium text-gray-800 cursor-not-allowed">
                    {selectedServiceLabel || SERVICES_LABELS[selectedService as Services] || selectedService}
                  </div>
                ) : (
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value as Services | '')}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition-all text-sm font-medium text-gray-800"
                  >
                    <option value="">Select service category</option>
                    {ALL_SERVICES.map(s => (
                      <option key={s} value={s}>{SERVICES_LABELS[s]}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what this template is used for..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition-all text-sm font-medium text-gray-800 resize-none"
            />
          </div>
        </ShadowCard>

        {/* ── DOCUMENT REQUEST content ── */}
        {typeParam === 'DOCUMENT_REQUEST' && (
          <ShadowCard className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-800 text-base">Document List</h2>
                <p className="text-xs text-gray-500 mt-0.5">Define the documents clients need to upload</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Request Title *</label>
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Onboarding Documents"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition-all text-sm font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Request Description</label>
                <input
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  placeholder="Brief description of this request group"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition-all text-sm font-medium text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-3">
              {docRows.map((doc, i) => (
                <DocRow
                  key={doc._id}
                  doc={doc}
                  index={i}
                  onUpdate={updateDoc}
                  onRemove={(id) => setDocRows(rows => rows.filter(r => r._id !== id))}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDocRows(rows => [...rows, { _id: uuidv4(), documentName: '', type: 'DIRECT', count: 'SINGLE', isMandatory: true, description: '', templateFile: null, templateInstructions: '', multipleItems: [] }])}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2.5 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 w-full justify-center"
            >
              <Plus className="h-4 w-4" /> Add Document Row
            </button>
          </ShadowCard>
        )}

        {/* ── MILESTONE content ── */}
        {typeParam === 'MILESTONES' && (
          <ShadowCard className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="font-bold text-gray-800 text-base">Milestone Steps</h2>
              <p className="text-xs text-gray-500 mt-0.5">Define the milestone steps in order</p>
            </div>

            <div className="space-y-3">
              {milestoneSteps.map((step, i) => (
                <div key={step._id} className="flex gap-3 items-start p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={step.title}
                      onChange={(e) => setMilestoneSteps(s => s.map(x => x._id === step._id ? { ...x, title: e.target.value } : x))}
                      placeholder="Step title *"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium text-gray-800"
                    />
                    <input
                      value={step.description || ''}
                      onChange={(e) => setMilestoneSteps(s => s.map(x => x._id === step._id ? { ...x, description: e.target.value } : x))}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium text-gray-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMilestoneSteps(s => s.filter(x => x._id !== step._id))}
                    disabled={milestoneSteps.length === 1}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMilestoneSteps(s => [...s, { _id: uuidv4(), title: '', description: '' }])}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2.5 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 w-full justify-center"
            >
              <Plus className="h-4 w-4" /> Add Step
            </button>
          </ShadowCard>
        )}

        {/* ── CHECKLIST content ── */}
        {typeParam === 'CHECKLIST' && (
          <ShadowCard className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="font-bold text-gray-800 text-base">Checklist Structure</h2>
              <p className="text-xs text-gray-500 mt-0.5">Build a nested checklist (up to 3 levels deep)</p>
            </div>

            <div className="space-y-4">
              {checklistNodes.map((l1, l1i) => (
                <div key={l1.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Level 1 */}
                  <div className="flex items-center gap-3 p-3.5 bg-gray-50">
                    <div className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                      {l1i + 1}
                    </div>
                    <input
                      value={l1.title}
                      onChange={(e) => updateL1(l1.id, e.target.value)}
                      placeholder="Section title *"
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/10 outline-none transition-all font-semibold text-gray-800"
                    />
                    <button type="button" onClick={() => addL2(l1.id)} className="text-xs font-semibold text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors whitespace-nowrap">
                      + Sub-item
                    </button>
                    <button type="button" onClick={() => removeL1(l1.id)} disabled={checklistNodes.length === 1} className="p-1.5 text-red-400 hover:text-red-600 disabled:opacity-30">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Level 2 */}
                  {l1.children.length > 0 && (
                    <div className="pl-8 pr-4 py-3 space-y-2.5 border-t border-gray-100 bg-white">
                      {l1.children.map((l2, l2i) => (
                        <div key={l2.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-bold w-5">{l1i + 1}.{l2i + 1}</span>
                            <input
                              value={l2.title}
                              onChange={(e) => updateL2(l1.id, l2.id, e.target.value)}
                              placeholder="Sub-section title"
                              className="flex-1 px-3 py-1.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium text-gray-700"
                            />
                            <button type="button" onClick={() => addL3(l1.id, l2.id)} className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap">
                              + Item
                            </button>
                            <button type="button" onClick={() => removeL2(l1.id, l2.id)} className="p-1 text-red-400 hover:text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Level 3 */}
                          {l2.children.length > 0 && (
                            <div className="pl-10 space-y-1.5">
                              {l2.children.map((l3, l3i) => (
                                <div key={l3.id} className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400 font-bold w-8">{l1i+1}.{l2i+1}.{l3i+1}</span>
                                  <input
                                    value={l3.title}
                                    onChange={(e) => updateL3(l1.id, l2.id, l3.id, e.target.value)}
                                    placeholder="Checklist item"
                                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium text-gray-700"
                                  />
                                  <button type="button" onClick={() => removeL3(l1.id, l2.id, l3.id)} className="p-1 text-red-400 hover:text-red-600">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addL1}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2.5 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 w-full justify-center"
            >
              <Plus className="h-4 w-4" /> Add Section
            </button>
          </ShadowCard>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard/templates')}>
            Cancel
          </Button>
          <Button type="submit" variant="header" disabled={createMutation.isPending || isUploading}>
            {createMutation.isPending || isUploading ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTemplateForm;
