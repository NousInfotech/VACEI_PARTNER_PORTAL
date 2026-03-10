import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  Type,
  Hash,
  CheckSquare,
  CircleDot,
  AlignLeft,
  ChevronDown,
  Calendar,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { apiGet, apiPut, apiPost, apiPatch, apiDelete } from '../../../config/base';
import { endPoints } from '../../../config/endPoint';
import {
  Services,
  type ServiceRequestTemplate,
  type CreateTemplateDto,
  type InputType,
  type CustomService,
  type CreateCustomServiceDto,
  type UpdateCustomServiceDto,
} from '../../../types/service-request-template';

interface TemplatesContextType {
  templates: ServiceRequestTemplate[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  formatServiceLabel: (service: string | null, customServiceCycleId?: string | null) => string;
  toggleActiveMutation: UseMutationResult<unknown, Error, ServiceRequestTemplate, unknown>;
  createMutation: UseMutationResult<unknown, Error, CreateTemplateDto, unknown>;
  updateMutation: UseMutationResult<unknown, Error, { id: string; data: CreateTemplateDto }, unknown>;
  customServices: CustomService[];
  isLoadingCustomServices: boolean;
  createCustomServiceMutation: UseMutationResult<unknown, Error, CreateCustomServiceDto, unknown>;
  updateCustomServiceMutation: UseMutationResult<unknown, Error, { id: string; data: UpdateCustomServiceDto }, unknown>;
  deleteCustomServiceMutation: UseMutationResult<unknown, Error, string, unknown>;
  patchCustomServiceStatusMutation: UseMutationResult<unknown, Error, { id: string; isActive: boolean }, unknown>;
  queryClient: ReturnType<typeof useQueryClient>;
  serviceOptions: { id: string; label: string; customServiceCycleId?: string | null }[];
  inputTypeIcons: Record<InputType, LucideIcon>;
  inputTypeItems: (
    onClick: (type: InputType) => void
  ) => { id: string; label: string; icon: React.ReactNode; onClick: () => void }[];
  requiredTabs: { id: string; label: string }[];
  search: string;
  setSearch: (s: string) => void;
  selectedService: string;
  setSelectedService: (s: string) => void;
}

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

export const TemplatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['service-request-templates'],
    queryFn: async () => {
      const response = await apiGet<{ data: ServiceRequestTemplate[] }>(endPoints.SERVICE_REQUEST_TEMPLATE.GET_ALL, {
        limit: 1000,
      });
      return response.data;
    },
  });

  const { data: customServices = [], isLoading: isLoadingCustomServices } = useQuery({
    queryKey: ['custom-services'],
    queryFn: async () => {
      const response = await apiGet<{ data: CustomService[] }>(endPoints.CUSTOM_SERVICE.LIST, { limit: 1000 });
      return response.data;
    },
  });

  const [search, setSearch] = React.useState('');
  const [selectedService, setSelectedService] = React.useState('All Services');

  const toggleActiveMutation = useMutation({
    mutationFn: async (template: ServiceRequestTemplate) => {
      return apiPut<unknown>(endPoints.SERVICE_REQUEST_TEMPLATE.UPDATE(template.id), {
        isActive: !template.isActive,
      });
    },
    onSuccess: async (_, template) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['service-request-templates'] }),
        queryClient.invalidateQueries({ queryKey: ['service-request-template', template.id] }),
      ]);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTemplateDto) => {
      return apiPost<unknown>(endPoints.SERVICE_REQUEST_TEMPLATE.CREATE, data as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-request-templates'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateTemplateDto }) => {
      return apiPut<unknown>(endPoints.SERVICE_REQUEST_TEMPLATE.UPDATE(id), data as unknown as Record<string, unknown>);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['service-request-templates'] });
      queryClient.invalidateQueries({ queryKey: ['service-request-template', id] });
    },
  });

  const createCustomServiceMutation = useMutation({
    mutationFn: async (data: CreateCustomServiceDto) => {
      return apiPost<unknown>(endPoints.CUSTOM_SERVICE.CREATE, data as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-services'] });
    },
  });

  const updateCustomServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomServiceDto }) => {
      return apiPut<unknown>(endPoints.CUSTOM_SERVICE.UPDATE(id), data as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-services'] });
    },
  });

  const deleteCustomServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiDelete<unknown>(endPoints.CUSTOM_SERVICE.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-services'] });
    },
  });

  const patchCustomServiceStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiPatch<unknown>(endPoints.CUSTOM_SERVICE.PATCH_STATUS(id), { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-services'] });
    },
  });

  const formatServiceLabel = useCallback(
    (service: string | null, customServiceCycleId?: string | null) => {
      if (service === 'CUSTOM_GROUP') return 'Custom';
      if (!service) return 'General Section';

      if (service === 'CUSTOM' && customServiceCycleId) {
        const custom = customServices.find((cs) => cs.id === customServiceCycleId);
        if (custom) return custom.title;
      }

      const customByName = customServices.find(
        (cs) =>
          cs.title.toUpperCase().replace(/\s+/g, '_') === service ||
          cs.title === service,
      );
      if (customByName) return customByName.title;

      return service
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .replace('And', '&');
    },
    [customServices],
  );

  const serviceOptions = useMemo(() => {
    const staticOptions = Object.values(Services)
      .filter((s) => s !== 'CUSTOM')
      .map((s) => ({
        id: s,
        label: s.replace(/_/g, ' '),
      }));

    const dynamicOptions = customServices
      .filter((cs) => cs.isActive)
      .map((cs) => ({
        id: 'CUSTOM',
        label: cs.title,
        customServiceCycleId: cs.id,
      }));

    return [...staticOptions, ...dynamicOptions];
  }, [customServices]);

  const inputTypeIcons: Record<InputType, LucideIcon> = useMemo(
    () => ({
      text: Type,
      number: Hash,
      select: ChevronDown,
      radio: CircleDot,
      text_area: AlignLeft,
      checklist: CheckSquare,
      date: Calendar,
      month: CalendarDays,
      year: CalendarDays,
      month_year: CalendarDays,
    }),
    [],
  );

  const inputTypeItems = useCallback(
    (onClick: (type: InputType) => void) =>
      (['text', 'number', 'text_area', 'radio', 'select', 'checklist', 'date', 'month', 'year', 'month_year'] as InputType[]).map(
        (type) => {
          const Icon = inputTypeIcons[type];
          return {
            id: type,
            label: type.replace('_', ' ').toUpperCase(),
            icon: <Icon className="h-4 w-4" />,
            onClick: () => onClick(type),
          };
        },
      ),
    [inputTypeIcons],
  );

  const requiredTabs = useMemo(
    () => [
      { id: 'required', label: 'Required' },
      { id: 'optional', label: 'Optional' },
    ],
    [],
  );

  const value = useMemo(
    () => ({
      templates,
      isLoading,
      isError,
      refetch,
      customServices,
      isLoadingCustomServices,
      formatServiceLabel,
      toggleActiveMutation,
      createMutation,
      updateMutation,
      createCustomServiceMutation,
      updateCustomServiceMutation,
      deleteCustomServiceMutation,
      patchCustomServiceStatusMutation,
      queryClient,
      serviceOptions,
      inputTypeIcons,
      inputTypeItems,
      requiredTabs,
      search,
      setSearch,
      selectedService,
      setSelectedService,
    }),
    [
      templates,
      isLoading,
      isError,
      refetch,
      customServices,
      isLoadingCustomServices,
      formatServiceLabel,
      toggleActiveMutation,
      createMutation,
      updateMutation,
      createCustomServiceMutation,
      updateCustomServiceMutation,
      deleteCustomServiceMutation,
      patchCustomServiceStatusMutation,
      queryClient,
      serviceOptions,
      inputTypeIcons,
      inputTypeItems,
      requiredTabs,
      search,
      selectedService,
    ],
  );

  return <TemplatesContext.Provider value={value}>{children}</TemplatesContext.Provider>;
};

export const useTemplates = () => {
  const context = useContext(TemplatesContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplatesProvider');
  }
  return context;
};

