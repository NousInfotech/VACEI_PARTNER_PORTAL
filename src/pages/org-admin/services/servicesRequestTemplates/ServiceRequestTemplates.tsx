import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  FileText,
  Filter,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../../ui/Button';
import Dropdown from '../../../common/Dropdown';
import { Services, type ServiceRequestTemplate, type TemplateType } from '../../../../types/service-request-template';
import AlertMessage from '../../../common/AlertMessage';
import PageHeader from '../../../common/PageHeader';
import { TemplateList } from './TemplateList';
import { TemplatesProvider, useTemplates } from '../../context/ServicesContext';

const ServiceRequestTemplatesContent: React.FC = () => {
  const navigate = useNavigate();
  const {
    templates,
    isLoading,
    toggleActiveMutation,
    search,
    setSearch,
    selectedService,
    setSelectedService,
    customServices,
  } = useTemplates();
  const [alert, setAlert] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);
  const [viewLevel, setViewLevel] = useState<'all' | 'custom'>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const setPage = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
  };

  const allServicesHaveTemplates = useMemo(() => {
    if (isLoading) return false;

    const staticServiceIds = Object.values(Services).filter((s) => s !== 'CUSTOM');
    const hasAllStatic = staticServiceIds.every((s) =>
      templates.some((t) => t.service === s && t.type === 'SERVICE'),
    );

    const activeCustomServices = customServices.filter((cs) => cs.isActive);
    const hasAllCustom = activeCustomServices.every((cs) =>
      templates.some(
        (t) =>
          t.service === 'CUSTOM' &&
          t.customServiceCycleId === cs.id &&
          t.type === 'SERVICE',
      ),
    );

    return hasAllStatic && hasAllCustom;
  }, [templates, customServices, isLoading]);

  const services = useMemo(() => {
    const uniqueServices = Array.from(new Set(templates.map((t) => t.service || 'General')));
    return ['All Services', ...uniqueServices.sort()];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates
      .filter((template: ServiceRequestTemplate) => {
        const serviceName = template.service || 'General';
        const matchesSearch =
          serviceName.toLowerCase().includes(search.toLowerCase()) ||
          template.type.toLowerCase().includes(search.toLowerCase());
        const matchesService =
          selectedService === 'All Services' || serviceName === selectedService;

        return matchesSearch && matchesService;
      })
      .sort((a: ServiceRequestTemplate, b: ServiceRequestTemplate) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [templates, search, selectedService]);

  const displayTemplates = useMemo(() => {
    const standard: ServiceRequestTemplate[] = [];
    const custom: ServiceRequestTemplate[] = [];

    filteredTemplates.forEach((t: ServiceRequestTemplate) => {
      const isStandard =
        !t.service ||
        (Object.values(Services).includes(t.service as Services) &&
          t.service !== 'CUSTOM');
      if (isStandard) standard.push(t);
      else custom.push(t);
    });

    if (viewLevel === 'custom') {
      return custom;
    }

    const result = [...standard];
    if (custom.length > 0) {
      result.push({
        id: 'virtual-custom-group',
        service: 'CUSTOM_GROUP',
        type: 'SERVICE' as TemplateType,
        isActive: true,
        updatedAt: custom[0].updatedAt,
        createdAt: custom[0].createdAt,
        version: 1,
        createdBy: 'system',
        formFields: [],
      });
    }

    return result;
  }, [filteredTemplates, viewLevel]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedService, viewLevel]);

  // For org portal, show all templates in a single page (no hard 10-item limit)
  const limit = displayTemplates.length || 10;
  const totalPages = 1;
  const paginatedTemplates = useMemo(() => {
    return displayTemplates;
  }, [displayTemplates]);

  const handleCreateClick = () => {
    navigate('/dashboard/service-request-templates/create');
  };

  const handleViewClick = (template: ServiceRequestTemplate) => {
    if (template.id === 'virtual-custom-group') {
      setViewLevel('custom');
      setSearch('');
      setSelectedService('All Services');
      return;
    }
    navigate(`/dashboard/service-request-templates/${template.id}/view`, {
      state: { template },
    });
  };

  const handleToggle = async (template: ServiceRequestTemplate) => {
    try {
      await toggleActiveMutation.mutateAsync(template);
      setAlert({
        message: `Template ${!template.isActive ? 'activated' : 'deactivated'} successfully`,
        variant: 'success',
      });
    } catch {
      setAlert({ message: 'Failed to update template status', variant: 'danger' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Request Templates"
        icon={FileText}
        description="Manage form fields for different service requests and general sections."
        actions={
          <Button
            onClick={handleCreateClick}
            variant="header"
            disabled={allServicesHaveTemplates}
            title={
              allServicesHaveTemplates
                ? 'All services already have templates created'
                : ''
            }
          >
            <Plus className="h-5 w-5" />
            Create Template
          </Button>
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

      <div className="flex flex-col md:flex-row gap-4">
        {viewLevel === 'custom' && (
          <Button
            variant="secondary"
            onClick={() => setViewLevel('all')}
            className="rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={
              viewLevel === 'custom'
                ? 'Search custom templates...'
                : 'Search templates by type or name...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-300 focus:border-primary/10 rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-gray-700"
          />
        </div>

        {viewLevel === 'all' && (
          <Dropdown
            label={selectedService}
            trigger={
              <Button
                variant="secondary"
                className="h-full px-6 py-3 rounded-2xl flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
              >
                <Filter className="h-4 w-4" />
                <span className="font-semibold">{selectedService}</span>
              </Button>
            }
            items={services.map((service: string) => ({
              id: service,
              label: service,
              onClick: () => setSelectedService(service),
              className:
                selectedService === service
                  ? 'bg-primary/5 text-primary font-bold'
                  : '',
            }))}
            align="right"
          />
        )}
      </div>

      <div className="space-y-12">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">
            {viewLevel === 'custom'
              ? 'Custom Service Templates'
              : 'Service Templates'}
          </h3>
          <TemplateList
            loading={isLoading}
            templates={paginatedTemplates}
            page={page}
            limit={limit}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={displayTemplates.length}
            onView={handleViewClick}
            onToggleActive={handleToggle}
          />
        </div>
      </div>
    </div>
  );
};

const ServiceRequestTemplates: React.FC = () => (
  <TemplatesProvider>
    <ServiceRequestTemplatesContent />
  </TemplatesProvider>
);

export default ServiceRequestTemplates;

