import fs from 'fs';
import path from 'path';
import { Staff, Customer, Appointment, Transaction, Promotion, CustomerCard, SystemLog, StaffReminder } from '../types/index.js';

const dbPath = process.env.LOCAL_DB_PATH || './data/beauty-salon.json';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

interface LocalDatabase {
  staff: Staff[];
  customers: Customer[];
  appointments: Appointment[];
  transactions: Transaction[];
  promotions: Promotion[];
  customerCards: CustomerCard[];
  logs: SystemLog[];
  reminders: StaffReminder[];
  syncStatus: {
    id: number;
    table_name: string;
    record_id: string;
    last_sync: string;
    sync_source: string;
    sync_status: string;
    error_message: string | null;
    created_at: string;
    updated_at: string;
  }[];
}

let db: LocalDatabase = {
  staff: [{ id: '1', name: 'admin', role: '总店长', password: 'admin', avatar: 'A', permissions: ['all'], created_at: new Date().toISOString() }],
  customers: [],
  appointments: [],
  transactions: [],
  promotions: [],
  customerCards: [],
  logs: [],
  reminders: [],
  syncStatus: []
};

function loadDatabase(): LocalDatabase {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载数据库失败:', error);
  }
  return db;
}

function saveDatabase() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存数据库失败:', error);
  }
}

export function initLocalDatabase() {
  db = loadDatabase();
  console.log('✅ 本地数据库初始化完成');
}

export const localDb = {
  staff: {
    getAll: (): Staff[] => db.staff,
    getById: (id: string): Staff | undefined => db.staff.find(s => s.id === id),
    create: (data: Staff): Staff => {
      db.staff.push(data);
      saveDatabase();
      return data;
    },
    update: (id: string, data: Partial<Staff>): Staff | undefined => {
      const index = db.staff.findIndex(s => s.id === id);
      if (index === -1) return undefined;
      db.staff[index] = { ...db.staff[index], ...data };
      saveDatabase();
      return db.staff[index];
    },
    delete: (id: string): boolean => {
      const index = db.staff.findIndex(s => s.id === id);
      if (index === -1) return false;
      db.staff.splice(index, 1);
      saveDatabase();
      return true;
    },
    login: (name: string, password: string): Staff | undefined => {
      return db.staff.find(s => s.name === name && s.password === password);
    }
  },

  customers: {
    getAll: (): Customer[] => db.customers,
    getById: (id: string): Customer | undefined => db.customers.find(c => c.id === id),
    create: (data: Customer): Customer => {
      db.customers.push(data);
      saveDatabase();
      return data;
    },
    update: (id: string, data: Partial<Customer>): Customer | undefined => {
      const index = db.customers.findIndex(c => c.id === id);
      if (index === -1) return undefined;
      db.customers[index] = { ...db.customers[index], ...data };
      saveDatabase();
      return db.customers[index];
    },
    delete: (id: string): boolean => {
      const index = db.customers.findIndex(c => c.id === id);
      if (index === -1) return false;
      db.customers.splice(index, 1);
      saveDatabase();
      return true;
    }
  },

  appointments: {
    getAll: (filters?: { date?: string; staff_id?: string; status?: string }): Appointment[] => {
      let result = db.appointments;
      if (filters?.date) {
        result = result.filter(a => a.start_time.startsWith(filters.date!));
      }
      if (filters?.staff_id) {
        result = result.filter(a => a.staff_id === filters.staff_id);
      }
      if (filters?.status) {
        result = result.filter(a => a.status === filters.status);
      }
      return result;
    },
    getById: (id: string): Appointment | undefined => db.appointments.find(a => a.id === id),
    create: (data: Appointment): Appointment => {
      db.appointments.push(data);
      saveDatabase();
      return data;
    },
    update: (id: string, data: Partial<Appointment>): Appointment | undefined => {
      const index = db.appointments.findIndex(a => a.id === id);
      if (index === -1) return undefined;
      db.appointments[index] = { ...db.appointments[index], ...data };
      saveDatabase();
      return db.appointments[index];
    },
    delete: (id: string): boolean => {
      const index = db.appointments.findIndex(a => a.id === id);
      if (index === -1) return false;
      db.appointments.splice(index, 1);
      saveDatabase();
      return true;
    }
  },

  transactions: {
    getAll: (filters?: any): Transaction[] => {
      let result = db.transactions;
      if (filters?.type) result = result.filter(t => t.type === filters.type);
      if (filters?.customer_id) result = result.filter(t => t.customer_id === filters.customer_id);
      if (filters?.staff_id) result = result.filter(t => t.staff_id === filters.staff_id);
      return result;
    },
    create: (data: Transaction): Transaction => {
      db.transactions.push(data);
      saveDatabase();
      return data;
    }
  },

  promotions: {
    getAll: (): Promotion[] => db.promotions,
    create: (data: Promotion): Promotion => {
      db.promotions.push(data);
      saveDatabase();
      return data;
    }
  },

  customerCards: {
    getAll: (filters?: { customer_id?: string; promotion_id?: string }): CustomerCard[] => {
      let result = db.customerCards;
      if (filters?.customer_id) result = result.filter(c => c.customer_id === filters.customer_id);
      if (filters?.promotion_id) result = result.filter(c => c.promotion_id === filters.promotion_id);
      return result;
    },
    create: (data: CustomerCard): CustomerCard => {
      db.customerCards.push(data);
      saveDatabase();
      return data;
    }
  },

  logs: {
    getAll: (filters?: any): SystemLog[] => {
      let result = db.logs;
      if (filters?.operator) result = result.filter(l => l.operator === filters.operator);
      if (filters?.action) result = result.filter(l => l.action === filters.action);
      return result;
    },
    create: (data: SystemLog): SystemLog => {
      db.logs.push(data);
      saveDatabase();
      return data;
    }
  },

  reminders: {
    getAll: (filters?: { staff_id?: string; status?: string; type?: string }): StaffReminder[] => {
      let result = db.reminders;
      if (filters?.staff_id) result = result.filter(r => r.staff_id === filters.staff_id);
      if (filters?.status) result = result.filter(r => r.status === filters.status);
      if (filters?.type) result = result.filter(r => r.type === filters.type);
      return result;
    },
    create: (data: StaffReminder): StaffReminder => {
      db.reminders.push(data);
      saveDatabase();
      return data;
    }
  },

  syncStatus: {
    record: (tableName: string, recordId: string, source: string, status: string, error?: string) => {
      const now = new Date().toISOString();
      const existing = db.syncStatus.find(s => s.table_name === tableName && s.record_id === recordId);
      
      if (existing) {
        existing.last_sync = now;
        existing.sync_source = source;
        existing.sync_status = status;
        existing.error_message = error || null;
        existing.updated_at = now;
      } else {
        db.syncStatus.push({
          id: db.syncStatus.length + 1,
          table_name: tableName,
          record_id: recordId,
          last_sync: now,
          sync_source: source,
          sync_status: status,
          error_message: error || null,
          created_at: now,
          updated_at: now
        });
      }
      saveDatabase();
    },
    getFailed: () => db.syncStatus.filter(s => s.sync_status === 'failed')
  }
};

export default localDb;
