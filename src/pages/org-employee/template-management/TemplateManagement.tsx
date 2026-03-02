import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Layers, CheckSquare, Plus, FileSearch } from 'lucide-react';
import PageHeader from '../../common/PageHeader';
import { Button } from '../../../ui/Button';
import DocRequestList from './DocRequestList';
import MilestoneList from './MilestoneList';
import ChecklistList from './ChecklistList';
import type { TemplateModuleType, TemplateType } from '../../../types/template';

type MainTab = 'DOC_REQUEST' | 'MILESTONE' | 'CHECKLIST';
type DocSubTab = 'ENGAGEMENT';

const MAIN_TABS: { id: MainTab; label: string; icon: React.ElementType }[] = [
  { id: 'DOC_REQUEST', label: 'Document Request', icon: FileSearch },
  { id: 'MILESTONE', label: 'Milestone', icon: Layers },
  { id: 'CHECKLIST', label: 'Checklist', icon: CheckSquare },
];

// const DOC_SUB_TABS: { id: DocSubTab; label: string }[] = [
//   { id: 'ENGAGEMENT', label: 'Engagement' },
// ];

const getTemplateType = (tab: MainTab): TemplateType => {
  if (tab === 'DOC_REQUEST') return 'DOCUMENT_REQUEST';
  if (tab === 'MILESTONE') return 'MILESTONES';
  return 'CHECKLIST';
};

const TemplateManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mainTabParam = (searchParams.get('tab') as MainTab) || 'DOC_REQUEST';
  const docSubTabParam = (searchParams.get('sub') as DocSubTab) || 'ENGAGEMENT';

  const [mainTab, setMainTab] = useState<MainTab>(mainTabParam);
  const [docSubTab] = useState<DocSubTab>(docSubTabParam);

  const changeMainTab = (tab: MainTab) => {
    setMainTab(tab);
    setSearchParams({ tab, sub: docSubTab });
  };

  // const changeDocSubTab = (sub: DocSubTab) => {
  //   setDocSubTab(sub);
  //   setSearchParams({ tab: mainTab, sub });
  // };

  const handleCreate = () => {
    const type: TemplateType = getTemplateType(mainTab);
    const moduleType: TemplateModuleType =
      mainTab === 'DOC_REQUEST' ? docSubTab : 'ENGAGEMENT';
    navigate(
      `/dashboard/templates/create?type=${type}&moduleType=${moduleType}`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Template Management"
        icon={FileText}
        description="Create and manage reusable templates for document requests, milestones, and checklists."
        actions={
          <Button variant="header" onClick={handleCreate}>
            <Plus className="h-5 w-5" />
            Create Template
          </Button>
        }
      />

      {/* Main Tabs */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/60 px-6 pt-5">
          <div className="flex gap-1">
            {MAIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = mainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => changeMainTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 -mb-px ${
                    isActive
                      ? 'text-primary border-primary bg-white shadow-sm'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Document Request sub-tabs */}
          {mainTab === 'DOC_REQUEST' && (
            <div className="space-y-6">
              <DocRequestList
                key={`doc-${docSubTab}`}
                moduleType={docSubTab}
                showServiceFilter={docSubTab === 'ENGAGEMENT'}
              />
            </div>
          )}

          {mainTab === 'MILESTONE' && (
            <MilestoneList key="milestone" />
          )}

          {mainTab === 'CHECKLIST' && (
            <ChecklistList key="checklist" />
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManagement;
