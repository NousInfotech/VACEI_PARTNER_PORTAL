import axiosInstance from './axiosConfig';

/**
 * Generic GET method
 */
export const apiGet = async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
  const response = await axiosInstance.get<T>(url, { params });
  return response.data;
};

/**
 * Generic POST method
 */
export const apiPost = async <T>(url: string, data?: Record<string, unknown>): Promise<T> => {
  const response = await axiosInstance.post<T>(url, data);
  return response.data;
};

/**
 * Generic PUT method
 */
export const apiPut = async <T>(url: string, data?: Record<string, unknown>): Promise<T> => {
  const response = await axiosInstance.put<T>(url, data);
  return response.data;
};

/**
 * Generic PATCH method
 */
export const apiPatch = async <T>(url: string, data?: Record<string, unknown>): Promise<T> => {
  const response = await axiosInstance.patch<T>(url, data);
  return response.data;
};

/**
 * Generic DELETE method
 */
export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await axiosInstance.delete<T>(url);
  return response.data;
};