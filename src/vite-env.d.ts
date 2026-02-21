/// <reference types="vite/client" />

declare module 'react-hook-form' {
  export function useForm<TFieldValues = object>(options?: Record<string, unknown>): {
    register: (name: string | { name: string }, options?: Record<string, unknown>) => Record<string, unknown>;
    handleSubmit: (
      onValid: (data: TFieldValues) => void,
      onInvalid?: (errors: Record<string, unknown>) => void,
    ) => (e?: { preventDefault?: () => void }) => void;
    watch: (name?: string | string[]) => unknown;
    setValue: (name: string, value: unknown, options?: Record<string, unknown>) => void;
    getValues: (payload?: string | string[]) => TFieldValues;
    formState: { errors: Record<string, { message?: string }>; isSubmitting: boolean };
    reset: (values?: Partial<TFieldValues>) => void;
  };
}
