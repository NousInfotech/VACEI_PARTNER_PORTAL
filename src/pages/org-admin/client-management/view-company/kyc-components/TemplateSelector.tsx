import React, { useEffect, useState } from 'react';
import { Search, FileText, X, Loader2 } from 'lucide-react';
import { apiGet } from '../../../../../config/base';
import { endPoints } from '../../../../../config/endPoint';
import type { Template, TemplateModuleType, TemplateListResponse } from '../../../../../types/template';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../ui/Button';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
  moduleType: TemplateModuleType;
  title?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  moduleType,
  title = 'Select Template',
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setSelectedTemplate(null);
    }
  }, [isOpen, moduleType]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiGet<TemplateListResponse>(`${endPoints.TEMPLATE.GET_ALL}?moduleType=${moduleType}&type=DOCUMENT_REQUEST`);
      if (response?.success) {
        setTemplates(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchText.toLowerCase()) || 
    (t.description && t.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-400 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-4xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900"
            />
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-4">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm font-bold uppercase tracking-widest">Loading templates...</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={cn(
                    "p-5 bg-white border rounded-3xl transition-all cursor-pointer group flex flex-col h-full",
                    selectedTemplate?.id === template.id 
                      ? "border-primary ring-2 ring-primary/10 shadow-lg shadow-primary/5" 
                      : "border-gray-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                  )}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors truncate">{template.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {template.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex gap-2">
                      {template.scope && (
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                          template.scope === 'GLOBAL' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {template.scope}
                        </span>
                      )}
                      {template.serviceCategory && (
                        <span className="bg-primary/5 text-primary rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border border-primary/10">
                          {template.serviceCategory}
                        </span>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        "h-8 text-[10px] font-bold uppercase tracking-widest transition-all",
                        selectedTemplate?.id === template.id ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {selectedTemplate?.id === template.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <FileText className="mx-auto mb-4 opacity-20" size={48} />
              <p className="font-bold uppercase tracking-widest text-xs">No templates found</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => selectedTemplate && onSelect(selectedTemplate)}
            disabled={!selectedTemplate}
            className="rounded-xl px-8 bg-primary text-white shadow-lg shadow-primary/20 font-bold text-[10px] uppercase tracking-widest"
          >
            Confirm & Create
          </Button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

export default TemplateSelector;
