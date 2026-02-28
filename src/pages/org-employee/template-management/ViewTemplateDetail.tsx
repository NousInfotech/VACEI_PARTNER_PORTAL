import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, FileText, Layers, CheckSquare, Globe, Building,
  Loader2, Calendar, Tag, Shield, ChevronDown, ChevronRight, Download
} from 'lucide-react';
import { Button } from '../../../ui/Button';
import PageHeader from '../../common/PageHeader';
import { ShadowCard } from '../../../ui/ShadowCard';
import { apiGet } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import { SERVICES_LABELS } from '../../../types/template';
import type {
  Template, TemplateApiResponse, DocumentRequestContent, DocumentItem,
  ChecklistContent
} from '../../../types/template';
import { downloadFile } from '../../../utils/downloadUtils';

// ─── Helper: Badge ───────────────────────────────────────────────

const Badge: React.FC<{ label: string; className?: string }> = ({ label, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${className}`}>
    {label}
  </span>
);

// ─── Document Row View ───────────────────────────────────────────

type StoredDocItem = DocumentItem;

const handleDownload = async (fileId: string, fallbackName: string) => {
  try {
    const res = await apiGet<{ data: { url: string; fileName: string } }>(endPoints.LIBRARY.FILE_BY_ID(fileId) + '/download');
    await downloadFile(res.data.url, res.data.fileName || fallbackName);
  } catch (error) {
    console.error('Download failed:', error);
    alert('Failed to download template file.');
  }
};

const DocRowView: React.FC<{ doc: StoredDocItem; index: number }> = ({ doc, index }) => {
  const [expanded, setExpanded] = useState(false);
  const isMultiple = doc.count === 'MULTIPLE';
  const isTemplate = doc.type === 'TEMPLATE';
  const labels = doc.multipleItems || [];

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-start gap-4 p-4 bg-white hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => isMultiple && setExpanded(!expanded)}>
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
          {(index + 1).toString().padStart(2, '0')}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h4 className="font-bold text-gray-900 text-sm leading-tight">{doc.documentName}</h4>
              {doc.description && <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Badge
                label={doc.type === 'DIRECT' ? 'Direct Upload' : 'Template Based'}
                className={doc.type === 'DIRECT' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}
              />
              <Badge
                label={doc.count === 'SINGLE' ? 'Single Copy' : 'Multiple Copies'}
                className={doc.count === 'SINGLE' ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-amber-50 text-amber-600 border-amber-100'}
              />
              {doc.isMandatory ? (
                <Badge label="Mandatory" className="bg-red-50 text-red-600 border-red-100" />
              ) : (
                <Badge label="Optional" className="bg-green-50 text-green-600 border-green-100" />
              )}
            </div>
          </div>
        </div>

        {isMultiple && labels.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Template Instructions (TEMPLATE + SINGLE) */}
      {isTemplate && !isMultiple && (doc.templateInstructions || doc.templateFileId) && (
        <div className="border-t border-blue-100 bg-blue-50/50 px-4 py-3 space-y-2">
          {doc.templateFileId && (
            <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-gray-700">Template File Attached</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-[10px] gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => handleDownload(doc.templateFileId!, doc.documentName)}
              >
                <Download className="h-3 w-3" /> Download
              </Button>
            </div>
          )}
          {doc.templateInstructions && (
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Template Instructions</p>
              <p className="text-xs text-blue-800 font-medium">{doc.templateInstructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Multiple Copy Labels */}
      {isMultiple && expanded && labels.length > 0 && (
        <div className="border-t border-purple-100 bg-purple-50/30 p-4 space-y-2">
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Copy Labels ({labels.length})</p>
          <div className="space-y-2">
            {labels.map((item, i) => {
              const label = typeof item === 'string' ? item : (item.label || `Label ${i + 1}`);
              const instruction = typeof item === 'string' ? null : item.instruction;
              const fileId = typeof item === 'string' ? null : item.templateFileId;
              return (
                <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-purple-100">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-gray-900 text-xs">{label}</p>
                      {isTemplate && fileId && (
                        <button 
                          type="button"
                          onClick={() => handleDownload(fileId, label)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="Download Template"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {instruction && <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{instruction}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Checklist Tree View ─────────────────────────────────────────

const ChecklistTreeView: React.FC<{ items: ChecklistContent['items'] }> = ({ items }) => {
  const roots = items.filter(i => i.level === 1);

  const getChildren = (parentId: string, level: number) =>
    items.filter(i => i.parentId === parentId && i.level === level);

  return (
    <div className="space-y-3">
      {roots.map((l1) => (
        <div key={l1.id} className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-3.5 bg-gray-50">
            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-gray-800 text-sm">{l1.title}</span>
          </div>
          {getChildren(l1.id, 2).length > 0 && (
            <div className="pl-6 pr-4 py-3 space-y-2 border-t border-gray-100 bg-white">
              {getChildren(l1.id, 2).map((l2) => (
                <div key={l2.id} className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded bg-gray-200 text-gray-500 text-[8px] flex items-center justify-center shrink-0">
                      <ChevronRight className="h-2.5 w-2.5" />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">{l2.title}</span>
                  </div>
                  {getChildren(l2.id, 3).length > 0 && (
                    <div className="pl-8 space-y-1">
                      {getChildren(l2.id, 3).map((l3) => (
                        <div key={l3.id} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded border-2 border-gray-200 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          </div>
                          <span className="text-gray-600 text-xs font-medium">{l3.title}</span>
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
  );
};

// ─── Main ViewTemplateDetail ─────────────────────────────────────

const ViewTemplateDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: response, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => apiGet<TemplateApiResponse>(endPoints.TEMPLATE.GET_BY_ID(id!)),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const template: Template | undefined = response?.data;
  if (!template) return (
    <div className="text-center py-24 text-gray-400">
      <FileText className="h-12 w-12 opacity-30 mx-auto mb-3" />
      <p className="font-medium">Template not found</p>
    </div>
  );

  const typeConfig = {
    DOCUMENT_REQUEST: { label: 'Document Request', icon: FileText, bgColor: 'bg-primary/10', textColor: 'text-primary', badgeClass: 'bg-primary/5 text-primary border-primary/10' },
    MILESTONES: { label: 'Milestone', icon: Layers, bgColor: 'bg-amber-50', textColor: 'text-amber-600', badgeClass: 'bg-amber-50 text-amber-600 border-amber-100' },
    CHECKLIST: { label: 'Checklist', icon: CheckSquare, bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  }[template.type];

  const TypeIcon = typeConfig?.icon || FileText;
  const moduleLabel = { ENGAGEMENT: 'Engagement', KYC: 'KYC', INCORPORATION: 'Incorporation' }[template.moduleType] || template.moduleType;
  const ScopeIcon = template.organizationId ? Building : Globe;
  const scopeLabel = template.organizationId ? 'Local' : 'Global';
  const scopeStyle = template.organizationId ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100';

  // Content
  const content = template.content as Record<string, unknown> | unknown[] | null;

  const docContent = template.type === 'DOCUMENT_REQUEST' ? content as DocumentRequestContent | null : null;
  const milestoneSteps = template.type === 'MILESTONES' && content && !Array.isArray(content)
    ? ((content as { steps?: { title: string; description?: string | null }[] }).steps || [])
    : [];
  const checklistContent = template.type === 'CHECKLIST' ? content as ChecklistContent | null : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="View Template"
        icon={FileText}
        description="Full template details and content preview."
        actions={
          <div className="flex items-center gap-3">
            <Button variant="header" onClick={() => navigate(`/dashboard/templates/${id}/edit`)}>
              Edit Template
            </Button>
            <Button variant="header" onClick={() => navigate('/dashboard/templates')}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      {/* Template Header Card */}
      <ShadowCard className="rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white">
          <div className="flex items-start gap-5">
            <div className={`p-3.5 rounded-2xl shrink-0`}>
              <TypeIcon className={`h-6 w-6 `} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-white leading-tight">{template.name}</h1>
                  {template.description && (
                    <p className="text-sm text-white/70 mt-1.5 leading-relaxed max-w-2xl">{template.description}</p>
                  )}
                </div>
              </div>

              {/* Meta badges */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <Badge label={typeConfig?.label || template.type} className="bg-indigo-50 text-indigo-600 border-indigo-100" />
                <Badge label={moduleLabel} className="bg-indigo-50 text-indigo-600 border-indigo-100" />
                {template.serviceCategory && (
                  <Badge label={SERVICES_LABELS[template.serviceCategory]} className="bg-green-50 text-green-700 border-green-100" />
                )}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${scopeStyle}`}>
                  <ScopeIcon className="h-3 w-3" />
                  {scopeLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meta info row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-gray-100 border-t border-gray-100">
          {[
            { icon: Tag, label: 'Type', value: typeConfig?.label || template.type },
            { icon: Shield, label: 'Module', value: moduleLabel },
            { icon: ScopeIcon, label: 'Scope', value: `${scopeLabel} Template` },
            { icon: Calendar, label: 'Created', value: new Date(template.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-xl bg-gray-50 text-gray-500 shrink-0">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </ShadowCard>

      {/* Content Section */}
      <ShadowCard className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">

        {/* DOCUMENT REQUEST */}
        {template.type === 'DOCUMENT_REQUEST' && (
          <>
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/5 text-primary"><FileText className="h-4 w-4" /></div>
                <div>
                  <h2 className="font-bold text-gray-800 text-base">{docContent?.title || 'Document Request'}</h2>
                  {docContent?.description && <p className="text-xs text-gray-500 mt-0.5">{docContent.description}</p>}
                </div>
                <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {(docContent?.documents || []).length} document{(docContent?.documents || []).length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {(docContent?.documents || []).map((doc, i) => (
                <DocRowView key={i} doc={doc as StoredDocItem} index={i} />
              ))}
            </div>

            {(!docContent?.documents || docContent.documents.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <FileText className="h-8 w-8 opacity-30 mx-auto mb-2" />
                <p className="text-sm font-medium">No documents defined</p>
              </div>
            )}
          </>
        )}

        {/* MILESTONES */}
        {template.type === 'MILESTONES' && (
          <>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Layers className="h-4 w-4" /></div>
              <h2 className="font-bold text-gray-800 text-base">Milestone Steps</h2>
              <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {milestoneSteps.length} step{milestoneSteps.length !== 1 ? 's' : ''}
              </span>
            </div>

            {milestoneSteps.length > 0 ? (
              <div className="space-y-3">
                {milestoneSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 hover:bg-gray-50/50 transition-colors">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 text-sm font-bold flex items-center justify-center">
                        {(i + 1).toString().padStart(2, '0')}
                      </div>
                      {i < milestoneSteps.length - 1 && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-9 w-0.5 h-6 bg-amber-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <h4 className="font-bold text-gray-900 text-sm">{step.title}</h4>
                      {step.description && <p className="text-xs text-gray-500 mt-1 font-medium">{step.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Layers className="h-8 w-8 opacity-30 mx-auto mb-2" />
                <p className="text-sm font-medium">No milestone steps defined</p>
              </div>
            )}
          </>
        )}

        {/* CHECKLIST */}
        {template.type === 'CHECKLIST' && (
          <>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><CheckSquare className="h-4 w-4" /></div>
              <h2 className="font-bold text-gray-800 text-base">Checklist Structure</h2>
              <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {(checklistContent?.items || []).length} item{(checklistContent?.items || []).length !== 1 ? 's' : ''}
              </span>
            </div>

            {checklistContent && checklistContent.items?.length > 0 ? (
              <ChecklistTreeView items={checklistContent.items} />
            ) : (
              <div className="text-center py-12 text-gray-400">
                <CheckSquare className="h-8 w-8 opacity-30 mx-auto mb-2" />
                <p className="text-sm font-medium">No checklist items defined</p>
              </div>
            )}
          </>
        )}
      </ShadowCard>
    </div>
  );
};

export default ViewTemplateDetail;
