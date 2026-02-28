import axiosInstance from './axiosConfig';

/**
 * Generic GET method
 */
export const apiGet = async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
  const response = await axiosInstance.get<T>(url, { params });
  return response.data;
};

/**
 * GET as blob (for file downloads). Returns blob and optional filename from Content-Disposition.
 */
export const apiGetBlob = async (
  url: string,
  params?: Record<string, unknown>
): Promise<{ blob: Blob; filename?: string }> => {
  const response = await axiosInstance.get(url, { params, responseType: 'blob' });
  const blob = response.data as Blob;
  const contentDisposition = response.headers?.['content-disposition'];
  let filename: string | undefined;
  if (typeof contentDisposition === 'string') {
    const match = contentDisposition.match(/filename="?([^";\n]+)"?/i);
    if (match) filename = match[1].trim();
  }
  return { blob, filename };
};

/**
 * Generic POST method
 */
export const apiPost = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await axiosInstance.post<T>(url, data);
  return response.data;
};

/**
 * Generic PUT method
 */
export const apiPut = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await axiosInstance.put<T>(url, data);
  return response.data;
};

/**
 * Generic PATCH method
 */
export const apiPatch = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await axiosInstance.patch<T>(url, data);
  return response.data;
};

/**
 * Generic DELETE method
 */
export const apiDelete = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await axiosInstance.delete<T>(url, { data });
  return response.data;
};

/**
 * Generic POST method for FormData (e.g. file uploads)
 */
export const apiPostFormData = async <T>(url: string, data: FormData): Promise<T> => {
  const response = await axiosInstance.post<T>(url, data, {
    // Ensure we don't send JSON here; Multer expects multipart/form-data
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};