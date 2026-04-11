import { supabase } from '../config/supabase.js';
import { localDb, initLocalDatabase } from '../config/localDb.js';
import { Staff, Customer, Appointment, Transaction, Promotion, CustomerCard, SystemLog, StaffReminder } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const dualWriteEnabled = process.env.DUAL_WRITE_ENABLED === 'true';
const primaryDatabase = process.env.PRIMARY_DATABASE || 'supabase';

export function initDatabases() {
  initLocalDatabase();
  console.log(`📡 双写模式: ${dualWriteEnabled ? '已启用' : '已禁用'}`);
  console.log(`🎯 主数据库: ${primaryDatabase}`);
}

interface SyncResult {
  success: boolean;
  data?: any;
  error?: string;
  localSuccess?: boolean;
  supabaseSuccess?: boolean;
}

async function executeDualWrite(
  operation: string,
  tableName: string,
  data: any,
  localOperation: () => any,
  supabaseOperation: () => Promise<any>
): Promise<SyncResult> {
  const recordId = data.id || uuidv4();
  const results: SyncResult = {
    success: false,
    localSuccess: false,
    supabaseSuccess: false
  };

  if (!dualWriteEnabled) {
    if (primaryDatabase === 'local') {
      try {
        const result = localOperation();
        results.success = true;
        results.data = result;
        results.localSuccess = true;
      } catch (error: any) {
        results.error = error.message;
      }
    } else {
      try {
        const result = await supabaseOperation();
        results.success = true;
        results.data = result;
        results.supabaseSuccess = true;
      } catch (error: any) {
        results.error = error.message;
      }
    }
    return results;
  }

  const errors: string[] = [];

  try {
    const localResult = localOperation();
    results.localSuccess = true;
    results.data = localResult;
    localDb.syncStatus.record(tableName, recordId, 'local', 'synced');
  } catch (error: any) {
    errors.push(`本地数据库: ${error.message}`);
    localDb.syncStatus.record(tableName, recordId, 'local', 'failed', error.message);
  }

  try {
    const supabaseResult = await supabaseOperation();
    results.supabaseSuccess = true;
    if (!results.localSuccess) {
      results.data = supabaseResult;
    }
    localDb.syncStatus.record(tableName, recordId, 'supabase', 'synced');
  } catch (error: any) {
    errors.push(`Supabase: ${error.message}`);
    localDb.syncStatus.record(tableName, recordId, 'supabase', 'failed', error.message);
  }

  results.success = !!(results.localSuccess || results.supabaseSuccess);
  if (errors.length > 0) {
    results.error = errors.join('; ');
  }

  return results;
}

export const dualWriteService = {
  staff: {
    getAll: async (): Promise<Staff[]> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.staff.getAll();
      }
      
      try {
        const { data, error } = await supabase!.from('staff').select('*');
        if (error) throw error;
        return data as Staff[];
      } catch (error) {
        console.error('Supabase 查询失败，使用本地数据库:', error);
        return localDb.staff.getAll();
      }
    },

    getById: async (id: string): Promise<Staff | undefined> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.staff.getById(id);
      }
      
      try {
        const { data, error } = await supabase!.from('staff').select('*').eq('id', id).single();
        if (error) throw error;
        return data as Staff;
      } catch (error) {
        console.error('Supabase 查询失败，使用本地数据库:', error);
        return localDb.staff.getById(id);
      }
    },

    create: async (data: Partial<Staff>): Promise<SyncResult> => {
      const staffData: Staff = {
        id: uuidv4(),
        name: data.name || '',
        role: data.role || '员工',
        password: data.password || '',
        avatar: data.avatar || 'A',
        permissions: data.permissions || [],
        created_at: new Date().toISOString(),
      };

      return executeDualWrite(
        'create',
        'staff',
        staffData,
        () => localDb.staff.create(staffData),
        async () => {
          const { data, error } = await supabase!.from('staff').insert([staffData]).select().single();
          if (error) throw error;
          return data;
        }
      );
    },

    update: async (id: string, data: Partial<Staff>): Promise<SyncResult> => {
      return executeDualWrite(
        'update',
        'staff',
        { id, ...data },
        () => localDb.staff.update(id, data),
        async () => {
          const { data: result, error } = await supabase!.from('staff').update(data).eq('id', id).select().single();
          if (error) throw error;
          return result;
        }
      );
    },

    delete: async (id: string): Promise<SyncResult> => {
      return executeDualWrite(
        'delete',
        'staff',
        { id },
        () => ({ success: localDb.staff.delete(id) }),
        async () => {
          const { error } = await supabase!.from('staff').delete().eq('id', id);
          if (error) throw error;
          return { success: true };
        }
      );
    },

    login: async (name: string, password: string): Promise<Staff | undefined> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.staff.login(name, password);
      }
      
      try {
        const { data, error } = await supabase!.from('staff').select('*').eq('name', name).eq('password', password).single();
        if (error) throw error;
        return data as Staff;
      } catch (error) {
        console.error('Supabase 登录失败，使用本地数据库:', error);
        return localDb.staff.login(name, password);
      }
    }
  },

  customers: {
    getAll: async (): Promise<Customer[]> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.customers.getAll();
      }
      
      try {
        const { data, error } = await supabase!.from('customers').select('*');
        if (error) throw error;
        return data as Customer[];
      } catch (error) {
        console.error('Supabase 查询失败，使用本地数据库:', error);
        return localDb.customers.getAll();
      }
    },

    getById: async (id: string): Promise<Customer | undefined> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.customers.getById(id);
      }
      
      try {
        const { data, error } = await supabase!.from('customers').select('*').eq('id', id).single();
        if (error) throw error;
        return data as Customer;
      } catch (error) {
        console.error('Supabase 查询失败，使用本地数据库:', error);
        return localDb.customers.getById(id);
      }
    },

    create: async (data: Partial<Customer>): Promise<SyncResult> => {
      const customerData: Customer = {
        id: uuidv4(),
        name: data.name || '',
        phone: data.phone || '',
        balance: data.balance || 0,
        remarks: data.remarks || '',
        gender: data.gender,
        birthday: data.birthday,
        source: data.source,
        tags: data.tags || [],
        created_at: new Date().toISOString(),
      };

      return executeDualWrite(
        'create',
        'customers',
        customerData,
        () => localDb.customers.create(customerData),
        async () => {
          const { data, error } = await supabase!.from('customers').insert([customerData]).select().single();
          if (error) throw error;
          return data;
        }
      );
    },

    update: async (id: string, data: Partial<Customer>): Promise<SyncResult> => {
      return executeDualWrite(
        'update',
        'customers',
        { id, ...data },
        () => localDb.customers.update(id, data),
        async () => {
          const { data: result, error } = await supabase!.from('customers').update(data).eq('id', id).select().single();
          if (error) throw error;
          return result;
        }
      );
    },

    delete: async (id: string): Promise<SyncResult> => {
      return executeDualWrite(
        'delete',
        'customers',
        { id },
        () => ({ success: localDb.customers.delete(id) }),
        async () => {
          const { error } = await supabase!.from('customers').delete().eq('id', id);
          if (error) throw error;
          return { success: true };
        }
      );
    }
  },

  appointments: {
    getAll: async (filters?: { date?: string; staff_id?: string; status?: string }): Promise<Appointment[]> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.appointments.getAll(filters);
      }
      
      try {
        let query = supabase!.from('appointments').select('*');
        
        if (filters?.date) {
          query = query.like('start_time', `${filters.date}%`);
        }
        if (filters?.staff_id) query = query.eq('staff_id', filters.staff_id);
        if (filters?.status) query = query.eq('status', filters.status);
        
        const { data, error } = await query;
        if (error) throw error;
        return data as Appointment[];
      } catch (error) {
        console.error('Supabase 查询失败，使用本地数据库:', error);
        return localDb.appointments.getAll(filters);
      }
    },

    create: async (data: Partial<Appointment>): Promise<SyncResult> => {
      const appointmentData: Appointment = {
        id: uuidv4(),
        customer_id: data.customer_id || '',
        customer_name: data.customer_name || '',
        staff_id: data.staff_id || '',
        project_name: data.project_name || '',
        start_time: data.start_time || new Date().toISOString(),
        start_hour: data.start_hour || 9,
        duration: data.duration || 60,
        status: data.status || 'pending',
        note: data.note,
        created_at: new Date().toISOString(),
      };

      return executeDualWrite(
        'create',
        'appointments',
        appointmentData,
        () => localDb.appointments.create(appointmentData),
        async () => {
          const { data, error } = await supabase!.from('appointments').insert([appointmentData]).select().single();
          if (error) throw error;
          return data;
        }
      );
    },

    update: async (id: string, data: Partial<Appointment>): Promise<SyncResult> => {
      return executeDualWrite(
        'update',
        'appointments',
        { id, ...data },
        () => localDb.appointments.update(id, data),
        async () => {
          const { data: result, error } = await supabase!.from('appointments').update(data).eq('id', id).select().single();
          if (error) throw error;
          return result;
        }
      );
    },

    delete: async (id: string): Promise<SyncResult> => {
      return executeDualWrite(
        'delete',
        'appointments',
        { id },
        () => ({ success: localDb.appointments.delete(id) }),
        async () => {
          const { error } = await supabase!.from('appointments').delete().eq('id', id);
          if (error) throw error;
          return { success: true };
        }
      );
    }
  },

  transactions: {
    getAll: async (filters?: any): Promise<Transaction[]> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.transactions.getAll(filters);
      }
      
      try {
        let query = supabase!.from('transactions').select('*');
        if (filters?.type) query = query.eq('type', filters.type);
        if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
        
        const { data, error } = await query;
        if (error) throw error;
        return data as Transaction[];
      } catch (error) {
        console.error('Supabase 查询失败，使用本地数据库:', error);
        return localDb.transactions.getAll(filters);
      }
    },

    create: async (data: Partial<Transaction>): Promise<SyncResult> => {
      const transactionData: Transaction = {
        id: uuidv4(),
        type: data.type || 'recharge',
        customer_id: data.customer_id || '',
        customer_name: data.customer_name || '',
        customer_card_id: data.customer_card_id,
        promotion_name: data.promotion_name,
        original_amount: data.original_amount,
        amount: data.amount || 0,
        payment_method: data.payment_method || 'cash',
        item_name: data.item_name || '',
        staff_id: data.staff_id,
        timestamp: data.timestamp || new Date().toISOString(),
        is_revoked: false,
        created_at: new Date().toISOString(),
      };

      return executeDualWrite(
        'create',
        'transactions',
        transactionData,
        () => localDb.transactions.create(transactionData),
        async () => {
          const { data, error } = await supabase!.from('transactions').insert([transactionData]).select().single();
          if (error) throw error;
          return data;
        }
      );
    }
  },

  promotions: {
    getAll: async (): Promise<Promotion[]> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.promotions.getAll();
      }
      
      try {
        const { data, error } = await supabase!.from('promotions').select('*');
        if (error) throw error;
        return data as Promotion[];
      } catch (error) {
        console.error('Supabase 查询失败，使用本地数据库:', error);
        return localDb.promotions.getAll();
      }
    },

    create: async (data: Partial<Promotion>): Promise<SyncResult> => {
      const promotionData: Promotion = {
        id: uuidv4(),
        name: data.name || '',
        type: data.type,
        discount_rate: data.discount_rate,
        total_count: data.total_count,
        start_date: data.start_date,
        end_date: data.end_date,
        created_at: new Date().toISOString(),
      };

      return executeDualWrite(
        'create',
        'promotions',
        promotionData,
        () => localDb.promotions.create(promotionData),
        async () => {
          const { data, error } = await supabase!.from('promotions').insert([promotionData]).select().single();
          if (error) throw error;
          return data;
        }
      );
    },

    update: async (id: string, data: Partial<Promotion>): Promise<SyncResult> => {
      return executeDualWrite(
        'update',
        'promotions',
        { id, ...data },
        () => {
          const promotions = localDb.promotions.getAll();
          const existing = promotions.find(p => p.id === id);
          if (!existing) throw new Error('活动不存在');
          const updated = { ...existing, ...data };
          localDb.promotions.upsert(updated);
          return updated;
        },
        async () => {
          const { data: result, error } = await supabase!.from('promotions').update(data).eq('id', id).select().single();
          if (error) throw error;
          return result;
        }
      );
    },

    delete: async (id: string): Promise<SyncResult> => {
      return executeDualWrite(
        'delete',
        'promotions',
        { id },
        () => localDb.promotions.delete(id),
        async () => {
          const { error } = await supabase!.from('promotions').delete().eq('id', id);
          if (error) throw error;
          return { id };
        }
      );
    }
  },

  customerCards: {
    getAll: async (filters?: { customer_id?: string; promotion_id?: string }): Promise<CustomerCard[]> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.customerCards.getAll(filters);
      }
      
      try {
        let query = supabase!.from('customer_cards').select('*');
        if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
        if (filters?.promotion_id) query = query.eq('promotion_id', filters.promotion_id);
        
        const { data, error } = await query;
        if (error) throw error;
        return data as CustomerCard[];
      } catch (error) {
        console.error('Supabase 查询失败，使用本地数据库:', error);
        return localDb.customerCards.getAll(filters);
      }
    },

    create: async (data: Partial<CustomerCard>): Promise<SyncResult> => {
      const cardData: CustomerCard = {
        id: uuidv4(),
        customer_id: data.customer_id || '',
        promotion_id: data.promotion_id || '',
        balance: data.balance,
        used_count: data.used_count || 0,
        total_count: data.total_count,
        created_at: new Date().toISOString(),
      };

      return executeDualWrite(
        'create',
        'customer_cards',
        cardData,
        () => localDb.customerCards.create(cardData),
        async () => {
          const { data, error } = await supabase!.from('customer_cards').insert([cardData]).select().single();
          if (error) throw error;
          return data;
        }
      );
    },

    update: async (id: string, data: Partial<CustomerCard>): Promise<SyncResult> => {
      return executeDualWrite(
        'update',
        'customer_cards',
        { id, ...data },
        () => {
          const card = localDb.customerCards.getAll().find(c => c.id === id);
          if (card) {
            Object.assign(card, data);
            localDb.customerCards.upsert(card);
          }
          return { id };
        },
        async () => {
          const { error } = await supabase!.from('customer_cards').update(data).eq('id', id);
          if (error) throw error;
          return { id };
        }
      );
    },

    delete: async (id: string): Promise<SyncResult> => {
      return executeDualWrite(
        'delete',
        'customer_cards',
        { id },
        () => {
          const transactions = localDb.transactions.getAll();
          transactions.forEach(t => {
            if (t.customer_card_id === id) {
              t.customer_card_id = undefined;
              localDb.transactions.upsert(t);
            }
          });
          return localDb.customerCards.delete(id);
        },
        async () => {
          console.log(`[DEBUG] Deleting customer_cards id=${id} from Supabase...`);
          const { error: updateError } = await supabase!
            .from('transactions')
            .update({ customer_card_id: null })
            .eq('customer_card_id', id);
          if (updateError) {
            console.log(`[DEBUG] Error updating transactions: ${JSON.stringify(updateError)}`);
          }
          const { error, data } = await supabase!.from('customer_cards').delete().eq('id', id).select();
          console.log(`[DEBUG] Delete result: error=${error ? JSON.stringify(error) : 'null'}, data=${JSON.stringify(data)}`);
          if (error) throw error;
          return { id };
        }
      );
    }
  },

  logs: {
    getAll: async (filters?: any): Promise<SystemLog[]> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.logs.getAll(filters);
      }
      
      try {
        let query = supabase!.from('system_logs').select('*');
        if (filters?.operator) query = query.eq('operator', filters.operator);
        if (filters?.action) query = query.eq('action', filters.action);
        
        const { data, error } = await query;
        if (error) throw error;
        return data as SystemLog[];
      } catch (error) {
        console.error('Supabase 查询失败，使用本地数据库:', error);
        return localDb.logs.getAll(filters);
      }
    },

    create: async (data: Partial<SystemLog>): Promise<SyncResult> => {
      const logData: SystemLog = {
        id: uuidv4(),
        operator: data.operator || '',
        action: data.action || '',
        detail: data.detail || '',
        timestamp: data.timestamp || new Date().toISOString(),
        undo_data: data.undo_data,
        is_revoked: false,
        created_at: new Date().toISOString(),
      };

      return executeDualWrite(
        'create',
        'system_logs',
        logData,
        () => localDb.logs.create(logData),
        async () => {
          const { data, error } = await supabase!.from('system_logs').insert([logData]).select().single();
          if (error) throw error;
          return data;
        }
      );
    },

    revoke: async (id: string): Promise<SyncResult> => {
      return executeDualWrite(
        'update',
        'system_logs',
        { id, is_revoked: true },
        () => {
          const log = localDb.logs.getAll().find(l => l.id === id);
          if (log) {
            log.is_revoked = true;
            localDb.logs.upsert(log);
          }
          return { id };
        },
        async () => {
          const { error } = await supabase!.from('system_logs').update({ is_revoked: true }).eq('id', id);
          if (error) throw error;
          return { id };
        }
      );
    }
  },

  reminders: {
    getAll: async (filters?: { staff_id?: string; status?: string; type?: string }): Promise<StaffReminder[]> => {
      if (primaryDatabase === 'local' || !supabase) {
        return localDb.reminders.getAll(filters);
      }
      
      try {
        let query = supabase!.from('staff_reminders').select('*');
        if (filters?.staff_id) query = query.eq('staff_id', filters.staff_id);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.type) query = query.eq('type', filters.type);
        query = query.limit(500);
        
        const { data, error } = await query;
        if (error) throw error;
        return data as StaffReminder[];
      } catch (error) {
        console.error('Supabase 查询失败，使用本地数据库:', error);
        return localDb.reminders.getAll(filters);
      }
    },

    create: async (data: Partial<StaffReminder>): Promise<SyncResult> => {
      const reminderData: StaffReminder = {
        id: data.id || uuidv4(),
        type: data.type || 'custom',
        content: data.content || '',
        customer_id: data.customer_id || '',
        staff_id: data.staff_id || '',
        reminder_date: data.reminder_date || new Date().toISOString().split('T')[0],
        status: data.status || 'pending',
        created_at: new Date().toISOString(),
      };

      return executeDualWrite(
        'create',
        'staff_reminders',
        reminderData,
        () => localDb.reminders.create(reminderData),
        async () => {
          const { data, error } = await supabase!.from('staff_reminders').upsert([reminderData]).select().single();
          if (error) throw error;
          return data;
        }
      );
    }
  },

  getSyncStatus: () => {
    return localDb.syncStatus.getFailed();
  }
};

export default dualWriteService;
