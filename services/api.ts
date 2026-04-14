const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    return { success: false, error: error.message };
  }
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  password?: string;
  avatar: string;
  permissions: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  remarks: string;
  created_at: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  source?: string;
  tags?: string[];
  assigned_staff_id?: string;
}

export interface Appointment {
  id: string;
  customer_id: string | null;
  customer_name: string;
  staff_id: string;
  project_name: string;
  start_time: string;
  start_hour: number;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  note?: string;
}

export interface Transaction {
  id: string;
  type: 'consume' | 'recharge' | 'refund';
  customer_id: string | null;
  customer_name: string;
  customer_card_id?: string;
  promotion_name?: string;
  original_amount?: number;
  amount: number;
  payment_method: 'balance' | 'cash' | 'wechat' | 'alipay' | 'promotion_card' | 'meituan';
  item_name: string;
  staff_id?: string;
  timestamp: string;
  is_revoked?: boolean;
}

export interface Promotion {
  id: string;
  name: string;
  type?: 'discount' | 'count';
  discount_rate?: number;
  total_count?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface CustomerCard {
  id: string;
  customer_id: string;
  promotion_id: string;
  balance?: number;
  used_count?: number;
  total_count?: number;
  created_at: string;
}

export interface SystemLog {
  id: string;
  operator: string;
  action: string;
  detail: string;
  timestamp: string;
  undo_data?: any;
  is_revoked?: boolean;
}

export interface StaffReminder {
  id: string;
  type: 'birthday' | 'dormant' | 'custom';
  content: string;
  customer_id: string;
  staff_id: string;
  reminder_date: string;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectItem {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectCategoryWithItems {
  label: string;
  items: string[];
}

export const api = {
  staff: {
    getAll: () => fetchApi<Staff[]>('/staff'),
    getById: (id: string) => fetchApi<Staff>(`/staff/${id}`),
    create: (data: Partial<Staff>) => fetchApi<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Staff>) => fetchApi<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi<void>(`/staff/${id}`, { method: 'DELETE' }),
    login: (name: string, password: string) => fetchApi<Partial<Staff>>('/staff/login', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    }),
  },

  customers: {
    getAll: (params?: { search?: string; staff_id?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchApi<Customer[]>(`/customers${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => fetchApi<Customer>(`/customers/${id}`),
    create: (data: Partial<Customer>) => fetchApi<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Customer>) => fetchApi<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi<void>(`/customers/${id}`, { method: 'DELETE' }),
    updateBalance: (id: string, amount: number, operation: 'add' | 'subtract') => 
      fetchApi<Customer>(`/customers/${id}/balance`, {
        method: 'PUT',
        body: JSON.stringify({ amount, operation }),
      }),
  },

  appointments: {
    getAll: (params?: { 
      date?: string; 
      staff_id?: string; 
      status?: string;
      start_date?: string;
      end_date?: string;
    }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchApi<Appointment[]>(`/appointments${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => fetchApi<Appointment>(`/appointments/${id}`),
    create: (data: Partial<Appointment>) => fetchApi<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Appointment>) => fetchApi<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi<void>(`/appointments/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: string) => fetchApi<Appointment>(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
    checkConflicts: (data: { staff_id: string; start_time: string; start_hour: number; duration: number; exclude_id?: string }) => 
      fetchApi<{ hasConflicts: boolean; conflicts: Appointment[] }>('/appointments/check-conflicts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  transactions: {
    getAll: (params?: {
      type?: string;
      customer_id?: string;
      staff_id?: string;
      start_date?: string;
      end_date?: string;
      payment_method?: string;
    }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchApi<Transaction[]>(`/transactions${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => fetchApi<Transaction>(`/transactions/${id}`),
    create: (data: Partial<Transaction>) => fetchApi<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Transaction>) => fetchApi<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    revoke: (id: string) => fetchApi<Transaction>(`/transactions/${id}/revoke`, {
      method: 'PUT',
    }),
    getDailyStats: (date?: string) => {
      const query = date ? `?date=${date}` : '';
      return fetchApi<any>(`/transactions/stats/daily${query}`);
    },
  },

  promotions: {
    getAll: (active?: boolean) => {
      const query = active !== undefined ? `?active=${active}` : '';
      return fetchApi<Promotion[]>(`/promotions${query}`);
    },
    getById: (id: string) => fetchApi<Promotion>(`/promotions/${id}`),
    create: (data: Partial<Promotion>) => fetchApi<Promotion>('/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Promotion>) => fetchApi<Promotion>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi<void>(`/promotions/${id}`, { method: 'DELETE' }),
  },

  customerCards: {
    getAll: (params?: { customer_id?: string; promotion_id?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchApi<CustomerCard[]>(`/customer-cards${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => fetchApi<CustomerCard>(`/customer-cards/${id}`),
    create: (data: Partial<CustomerCard>) => fetchApi<CustomerCard>('/customer-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<CustomerCard>) => fetchApi<CustomerCard>(`/customer-cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi<void>(`/customer-cards/${id}`, { method: 'DELETE' }),
    use: (id: string, amount?: number, count?: number) => fetchApi<CustomerCard>(`/customer-cards/${id}/use`, {
      method: 'PUT',
      body: JSON.stringify({ amount, count }),
    }),
  },

  logs: {
    getAll: (params?: {
      operator?: string;
      action?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
    }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchApi<SystemLog[]>(`/logs${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => fetchApi<SystemLog>(`/logs/${id}`),
    create: (data: Partial<SystemLog>) => fetchApi<SystemLog>('/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    revoke: (id: string) => fetchApi<SystemLog>(`/logs/${id}/revoke`, { method: 'PUT' }),
  },

  reminders: {
    getAll: (params?: { staff_id?: string; status?: string; type?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchApi<StaffReminder[]>(`/reminders${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => fetchApi<StaffReminder>(`/reminders/${id}`),
    create: (data: Partial<StaffReminder>) => fetchApi<StaffReminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<StaffReminder>) => fetchApi<StaffReminder>(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    complete: (id: string) => fetchApi<StaffReminder>(`/reminders/${id}/complete`, { method: 'PUT' }),
    delete: (id: string) => fetchApi<void>(`/reminders/${id}`, { method: 'DELETE' }),
  },

  projects: {
    getAll: () => fetchApi<ProjectCategoryWithItems[]>('/projects/all'),
    getCategories: () => fetchApi<ProjectCategory[]>('/projects/categories'),
    getCategoryById: (id: string) => fetchApi<ProjectCategory>(`/projects/categories/${id}`),
    createCategory: (data: Partial<ProjectCategory>) => fetchApi<ProjectCategory>('/projects/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateCategory: (id: string, data: Partial<ProjectCategory>) => fetchApi<ProjectCategory>(`/projects/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteCategory: (id: string) => fetchApi<void>(`/projects/categories/${id}`, { method: 'DELETE' }),
    getItems: (categoryId?: string) => {
      const query = categoryId ? `?category_id=${categoryId}` : '';
      return fetchApi<ProjectItem[]>(`/projects/items${query}`);
    },
    getItemById: (id: string) => fetchApi<ProjectItem>(`/projects/items/${id}`),
    createItem: (data: Partial<ProjectItem>) => fetchApi<ProjectItem>('/projects/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateItem: (id: string, data: Partial<ProjectItem>) => fetchApi<ProjectItem>(`/projects/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteItem: (id: string) => fetchApi<void>(`/projects/items/${id}`, { method: 'DELETE' }),
  },
};

export default api;
