import { BASE_URL } from '../constants/api';
import { Storage } from './storage';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request(
  endpoint: string,
  method: Method = 'GET',
  body: object | FormData | null = null,
  isFormData: boolean = false
): Promise<any> {
  const token = await Storage.getToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = isFormData ? (body as FormData) : JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const text = await response.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Respons server tidak valid');
  }

  if (!response.ok) {
    throw new Error(data?.message || `Error ${response.status}`);
  }

  return data;
}

export const api = {
  get:       (endpoint: string)                        => request(endpoint, 'GET'),
  post:      (endpoint: string, body: object)          => request(endpoint, 'POST', body),
  put:       (endpoint: string, body: object)          => request(endpoint, 'PUT', body),
  delete:    (endpoint: string)                        => request(endpoint, 'DELETE'),
  upload:    (endpoint: string, formData: FormData)    => request(endpoint, 'POST', formData, true),
  uploadPut: (endpoint: string, formData: FormData)    => request(endpoint, 'PUT',  formData, true),
};