import { Platform } from 'react-native';
import { Category, Transaction, TransactionType, User } from '../types';

interface AuthResponse {
  token: string;
  user: User;
}

interface ApiError {
  message?: string;
}

let authToken: string | null = null;

const resolveApiBaseUrl = () => {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envBaseUrl) return envBaseUrl;

  if (Platform.OS === 'android') {
    // Fallback for physical Android devices on local Wi-Fi.
    // Prefer EXPO_PUBLIC_API_URL for custom environments.
    return 'http://192.168.0.106:3000';
  }

  return 'http://localhost:3000';
};

const API_BASE_URL = resolveApiBaseUrl();

const apiRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = (payload as ApiError | null)?.message ?? `请求失败(${response.status})`;
    throw new Error(message);
  }

  return payload as T;
};

const normalizeTransaction = (item: Transaction): Transaction => ({
  ...item,
  date: item.date.slice(0, 10),
  note: item.note ?? '',
});

export const apiClient = {
  get baseUrl() {
    return API_BASE_URL;
  },

  setToken(token: string | null) {
    authToken = token;
  },

  getToken() {
    return authToken;
  },

  async register(name: string, phone: string, password: string) {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password }),
    });
  },

  async login(phone: string, password: string) {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  },

  async me() {
    return apiRequest<User>('/auth/me');
  },

  async getCategories() {
    return apiRequest<Category[]>('/categories');
  },

  async createCategory(name: string, type: TransactionType) {
    return apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    });
  },

  async getTransactions() {
    const rows = await apiRequest<Transaction[]>('/transactions');
    return rows.map(normalizeTransaction);
  },

  async createTransaction(payload: Omit<Transaction, 'id'>) {
    const row = await apiRequest<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeTransaction(row);
  },

  async updateTransaction(id: string, payload: Omit<Transaction, 'id'>) {
    const row = await apiRequest<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeTransaction(row);
  },

  async deleteTransaction(id: string) {
    return apiRequest<{ success: boolean }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },
};
