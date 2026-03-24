import { useState, useEffect, useCallback } from 'react';
import api, { 
  Staff, Customer, Appointment, Transaction, Promotion, 
  CustomerCard, SystemLog, StaffReminder 
} from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useStaff() {
  const [state, setState] = useState<UseApiState<Staff[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const response = await api.staff.getAll();
    if (response.success) {
      setState({ data: response.data || [], loading: false, error: null });
    } else {
      setState({ data: null, loading: false, error: response.error || '获取员工列表失败' });
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Partial<Staff>) => {
    const response = await api.staff.create(data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const update = async (id: string, data: Partial<Staff>) => {
    const response = await api.staff.update(id, data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const remove = async (id: string) => {
    const response = await api.staff.delete(id);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const login = async (name: string, password: string) => {
    return await api.staff.login(name, password);
  };

  return { ...state, refetch: fetchAll, create, update, remove, login };
}

export function useCustomers() {
  const [state, setState] = useState<UseApiState<Customer[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async (params?: { search?: string; staff_id?: string }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const response = await api.customers.getAll(params);
    if (response.success) {
      setState({ data: response.data || [], loading: false, error: null });
    } else {
      setState({ data: null, loading: false, error: response.error || '获取顾客列表失败' });
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Partial<Customer>) => {
    const response = await api.customers.create(data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const update = async (id: string, data: Partial<Customer>) => {
    const response = await api.customers.update(id, data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const remove = async (id: string) => {
    const response = await api.customers.delete(id);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const updateBalance = async (id: string, amount: number, operation: 'add' | 'subtract') => {
    const response = await api.customers.updateBalance(id, amount, operation);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  return { ...state, refetch: fetchAll, create, update, remove, updateBalance };
}

export function useAppointments() {
  const [state, setState] = useState<UseApiState<Appointment[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async (params?: { 
    date?: string; 
    staff_id?: string; 
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const response = await api.appointments.getAll(params);
    if (response.success) {
      setState({ data: response.data || [], loading: false, error: null });
    } else {
      setState({ data: null, loading: false, error: response.error || '获取预约列表失败' });
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Partial<Appointment>) => {
    const response = await api.appointments.create(data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const update = async (id: string, data: Partial<Appointment>) => {
    const response = await api.appointments.update(id, data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const remove = async (id: string) => {
    const response = await api.appointments.delete(id);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const updateStatus = async (id: string, status: string) => {
    const response = await api.appointments.updateStatus(id, status);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  return { ...state, refetch: fetchAll, create, update, remove, updateStatus };
}

export function useTransactions() {
  const [state, setState] = useState<UseApiState<Transaction[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async (params?: {
    type?: string;
    customer_id?: string;
    staff_id?: string;
    start_date?: string;
    end_date?: string;
    payment_method?: string;
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const response = await api.transactions.getAll(params);
    if (response.success) {
      setState({ data: response.data || [], loading: false, error: null });
    } else {
      setState({ data: null, loading: false, error: response.error || '获取交易列表失败' });
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Partial<Transaction>) => {
    const response = await api.transactions.create(data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const revoke = async (id: string) => {
    const response = await api.transactions.revoke(id);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const getDailyStats = async (date?: string) => {
    return await api.transactions.getDailyStats(date);
  };

  return { ...state, refetch: fetchAll, create, revoke, getDailyStats };
}

export function usePromotions() {
  const [state, setState] = useState<UseApiState<Promotion[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async (active?: boolean) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const response = await api.promotions.getAll(active);
    if (response.success) {
      setState({ data: response.data || [], loading: false, error: null });
    } else {
      setState({ data: null, loading: false, error: response.error || '获取活动列表失败' });
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Partial<Promotion>) => {
    const response = await api.promotions.create(data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const update = async (id: string, data: Partial<Promotion>) => {
    const response = await api.promotions.update(id, data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const remove = async (id: string) => {
    const response = await api.promotions.delete(id);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  return { ...state, refetch: fetchAll, create, update, remove };
}

export function useCustomerCards() {
  const [state, setState] = useState<UseApiState<CustomerCard[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async (params?: { customer_id?: string; promotion_id?: string }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const response = await api.customerCards.getAll(params);
    if (response.success) {
      setState({ data: response.data || [], loading: false, error: null });
    } else {
      setState({ data: null, loading: false, error: response.error || '获取活动卡列表失败' });
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Partial<CustomerCard>) => {
    const response = await api.customerCards.create(data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const update = async (id: string, data: Partial<CustomerCard>) => {
    const response = await api.customerCards.update(id, data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const remove = async (id: string) => {
    const response = await api.customerCards.delete(id);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const useCard = async (id: string, amount?: number, count?: number) => {
    const response = await api.customerCards.use(id, amount, count);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  return { ...state, refetch: fetchAll, create, update, remove, useCard };
}

export function useLogs() {
  const [state, setState] = useState<UseApiState<SystemLog[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async (params?: {
    operator?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const response = await api.logs.getAll(params);
    if (response.success) {
      setState({ data: response.data || [], loading: false, error: null });
    } else {
      setState({ data: null, loading: false, error: response.error || '获取日志列表失败' });
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Partial<SystemLog>) => {
    return await api.logs.create(data);
  };

  const revoke = async (id: string) => {
    const response = await api.logs.revoke(id);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  return { ...state, refetch: fetchAll, create, revoke };
}

export function useReminders() {
  const [state, setState] = useState<UseApiState<StaffReminder[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async (params?: { staff_id?: string; status?: string; type?: string }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const response = await api.reminders.getAll(params);
    if (response.success) {
      setState({ data: response.data || [], loading: false, error: null });
    } else {
      setState({ data: null, loading: false, error: response.error || '获取提醒列表失败' });
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Partial<StaffReminder>) => {
    const response = await api.reminders.create(data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const update = async (id: string, data: Partial<StaffReminder>) => {
    const response = await api.reminders.update(id, data);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const complete = async (id: string) => {
    const response = await api.reminders.complete(id);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  const remove = async (id: string) => {
    const response = await api.reminders.delete(id);
    if (response.success) {
      await fetchAll();
    }
    return response;
  };

  return { ...state, refetch: fetchAll, create, update, complete, remove };
}

export { api };
