import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Staff, Customer, Appointment, Transaction, Promotion, CustomerCard, SystemLog, StaffReminder, ProjectCategory, ProjectItem } from '../types/index.js';

const dbPath = process.env.LOCAL_DB_PATH || './data/beauty-salon.json';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function generateUUID(): string {
  return crypto.randomUUID();
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
  projectCategories: ProjectCategory[];
  projectItems: ProjectItem[];
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
  staff: [{ id: generateUUID(), name: 'admin', role: '总店长', password: 'password', avatar: 'A', permissions: ['all'], created_at: new Date().toISOString() }],
  customers: [],
  appointments: [],
  transactions: [],
  promotions: [],
  customerCards: [],
  logs: [],
  reminders: [],
  projectCategories: [
    { id: 'cat-1', name: '美甲', sort_order: 0, created_at: new Date().toISOString() },
    { id: 'cat-2', name: '美睫', sort_order: 1, created_at: new Date().toISOString() }
  ],
  projectItems: [
    { id: 'item-1', category_id: 'cat-1', name: '建构', sort_order: 0, created_at: new Date().toISOString() },
    { id: 'item-2', category_id: 'cat-1', name: '单色', sort_order: 1, created_at: new Date().toISOString() },
    { id: 'item-3', category_id: 'cat-1', name: '猫眼', sort_order: 2, created_at: new Date().toISOString() },
    { id: 'item-4', category_id: 'cat-1', name: '简单款', sort_order: 3, created_at: new Date().toISOString() },
    { id: 'item-5', category_id: 'cat-1', name: '轻奢', sort_order: 4, created_at: new Date().toISOString() },
    { id: 'item-6', category_id: 'cat-1', name: '复杂', sort_order: 5, created_at: new Date().toISOString() },
    { id: 'item-7', category_id: 'cat-1', name: '延长', sort_order: 6, created_at: new Date().toISOString() },
    { id: 'item-8', category_id: 'cat-1', name: '超长延长', sort_order: 7, created_at: new Date().toISOString() },
    { id: 'item-9', category_id: 'cat-1', name: '卸甲', sort_order: 8, created_at: new Date().toISOString() },
    { id: 'item-10', category_id: 'cat-1', name: '延长卸甲', sort_order: 9, created_at: new Date().toISOString() },
    { id: 'item-11', category_id: 'cat-2', name: '单根', sort_order: 0, created_at: new Date().toISOString() },
    { id: 'item-12', category_id: 'cat-2', name: '单根穿插', sort_order: 1, created_at: new Date().toISOString() },
    { id: 'item-13', category_id: 'cat-2', name: '小款式', sort_order: 2, created_at: new Date().toISOString() },
    { id: 'item-14', category_id: 'cat-2', name: '漫画', sort_order: 3, created_at: new Date().toISOString() },
    { id: 'item-15', category_id: 'cat-2', name: '下睫毛', sort_order: 4, created_at: new Date().toISOString() },
    { id: 'item-16', category_id: 'cat-2', name: '卸睫毛', sort_order: 5, created_at: new Date().toISOString() }
  ],
  syncStatus: []
};

function loadDatabase(): LocalDatabase {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      const parsed = JSON.parse(data);
      const loadedDb: LocalDatabase = {
        staff: parsed.staff || [],
        customers: parsed.customers || [],
        appointments: parsed.appointments || [],
        transactions: parsed.transactions || [],
        promotions: parsed.promotions || [],
        customerCards: parsed.customerCards || parsed.customer_cards || [],
        logs: parsed.logs || parsed.system_logs || [],
        reminders: parsed.reminders || parsed.staff_reminders || [],
        projectCategories: parsed.projectCategories || [],
        projectItems: parsed.projectItems || [],
        syncStatus: parsed.syncStatus || []
      };
      console.log('📦 数据库加载成功:', {
        staff: loadedDb.staff.length,
        customers: loadedDb.customers.length,
        appointments: loadedDb.appointments.length,
        transactions: loadedDb.transactions.length,
        promotions: loadedDb.promotions.length,
        customerCards: loadedDb.customerCards.length,
        logs: loadedDb.logs.length,
        reminders: loadedDb.reminders.length,
        projectCategories: loadedDb.projectCategories.length,
        projectItems: loadedDb.projectItems.length
      });
      return loadedDb;
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
    getAll: (): Staff[] => db.staff || [],
    getById: (id: string): Staff | undefined => (db.staff || []).find(s => s.id === id),
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
    upsert: (data: Staff): Staff => {
      const index = db.staff.findIndex(s => s.id === data.id);
      if (index === -1) {
        db.staff.push(data);
      } else {
        db.staff[index] = data;
      }
      saveDatabase();
      return data;
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
    getAll: (): Customer[] => db.customers || [],
    getById: (id: string): Customer | undefined => (db.customers || []).find(c => c.id === id),
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
    upsert: (data: Customer): Customer => {
      const index = db.customers.findIndex(c => c.id === data.id);
      if (index === -1) {
        db.customers.push(data);
      } else {
        db.customers[index] = data;
      }
      saveDatabase();
      return data;
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
      let result = db.appointments || [];
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
    getById: (id: string): Appointment | undefined => (db.appointments || []).find(a => a.id === id),
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
    upsert: (data: Appointment): Appointment => {
      const index = db.appointments.findIndex(a => a.id === data.id);
      if (index === -1) {
        db.appointments.push(data);
      } else {
        db.appointments[index] = data;
      }
      saveDatabase();
      return data;
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
      let result = db.transactions || [];
      if (filters?.type) result = result.filter(t => t.type === filters.type);
      if (filters?.customer_id) result = result.filter(t => t.customer_id === filters.customer_id);
      if (filters?.staff_id) result = result.filter(t => t.staff_id === filters.staff_id);
      return result;
    },
    create: (data: Transaction): Transaction => {
      db.transactions.push(data);
      saveDatabase();
      return data;
    },
    upsert: (data: Transaction): Transaction => {
      const index = db.transactions.findIndex(t => t.id === data.id);
      if (index === -1) {
        db.transactions.push(data);
      } else {
        db.transactions[index] = data;
      }
      saveDatabase();
      return data;
    }
  },

  promotions: {
    getAll: (): Promotion[] => db.promotions || [],
    create: (data: Promotion): Promotion => {
      if (!db.promotions) db.promotions = [];
      db.promotions.push(data);
      saveDatabase();
      return data;
    },
    upsert: (data: Promotion): Promotion => {
      const index = db.promotions.findIndex(p => p.id === data.id);
      if (index === -1) {
        db.promotions.push(data);
      } else {
        db.promotions[index] = data;
      }
      saveDatabase();
      return data;
    },
    delete: (id: string): { id: string } => {
      db.promotions = db.promotions.filter(p => p.id !== id);
      saveDatabase();
      return { id };
    }
  },

  customerCards: {
    getAll: (filters?: { customer_id?: string; promotion_id?: string }): CustomerCard[] => {
      let result = db.customerCards || [];
      if (filters?.customer_id) result = result.filter(c => c.customer_id === filters.customer_id);
      if (filters?.promotion_id) result = result.filter(c => c.promotion_id === filters.promotion_id);
      return result;
    },
    create: (data: CustomerCard): CustomerCard => {
      db.customerCards.push(data);
      saveDatabase();
      return data;
    },
    upsert: (data: CustomerCard): CustomerCard => {
      const index = db.customerCards.findIndex(c => c.id === data.id);
      if (index === -1) {
        db.customerCards.push(data);
      } else {
        db.customerCards[index] = data;
      }
      saveDatabase();
      return data;
    },
    delete: (id: string): { id: string } => {
      db.customerCards = db.customerCards.filter(c => c.id !== id);
      saveDatabase();
      return { id };
    }
  },

  logs: {
    getAll: (filters?: any): SystemLog[] => {
      let result = db.logs || [];
      if (filters?.operator) result = result.filter(l => l.operator === filters.operator);
      if (filters?.action) result = result.filter(l => l.action === filters.action);
      return result;
    },
    create: (data: SystemLog): SystemLog => {
      db.logs.push(data);
      saveDatabase();
      return data;
    },
    upsert: (data: SystemLog): SystemLog => {
      const index = db.logs.findIndex(l => l.id === data.id);
      if (index === -1) {
        db.logs.push(data);
      } else {
        db.logs[index] = data;
      }
      saveDatabase();
      return data;
    }
  },

  reminders: {
    getAll: (filters?: { staff_id?: string; status?: string; type?: string }): StaffReminder[] => {
      let result = db.reminders || [];
      if (filters?.staff_id) result = result.filter(r => r.staff_id === filters.staff_id);
      if (filters?.status) result = result.filter(r => r.status === filters.status);
      if (filters?.type) result = result.filter(r => r.type === filters.type);
      return result;
    },
    create: (data: StaffReminder): StaffReminder => {
      db.reminders.push(data);
      saveDatabase();
      return data;
    },
    upsert: (data: StaffReminder): StaffReminder => {
      const index = db.reminders.findIndex(r => r.id === data.id);
      if (index === -1) {
        db.reminders.push(data);
      } else {
        db.reminders[index] = data;
      }
      saveDatabase();
      return data;
    }
  },

  projectCategories: {
    getAll: (): ProjectCategory[] => {
      return (db.projectCategories || []).sort((a, b) => a.sort_order - b.sort_order);
    },
    getById: (id: string): ProjectCategory | undefined => {
      return (db.projectCategories || []).find(c => c.id === id);
    },
    create: (data: ProjectCategory): ProjectCategory => {
      if (!db.projectCategories) db.projectCategories = [];
      db.projectCategories.push(data);
      saveDatabase();
      return data;
    },
    update: (id: string, data: Partial<ProjectCategory>): ProjectCategory | undefined => {
      const index = (db.projectCategories || []).findIndex(c => c.id === id);
      if (index === -1) return undefined;
      db.projectCategories[index] = { ...db.projectCategories[index], ...data };
      saveDatabase();
      return db.projectCategories[index];
    },
    delete: (id: string): boolean => {
      const index = (db.projectCategories || []).findIndex(c => c.id === id);
      if (index === -1) return false;
      db.projectCategories.splice(index, 1);
      db.projectItems = (db.projectItems || []).filter(item => item.category_id !== id);
      saveDatabase();
      return true;
    }
  },

  projectItems: {
    getAll: (filters?: { category_id?: string }): ProjectItem[] => {
      let result = db.projectItems || [];
      if (filters?.category_id) result = result.filter(i => i.category_id === filters.category_id);
      return result.sort((a, b) => a.sort_order - b.sort_order);
    },
    getById: (id: string): ProjectItem | undefined => {
      return (db.projectItems || []).find(i => i.id === id);
    },
    create: (data: ProjectItem): ProjectItem => {
      if (!db.projectItems) db.projectItems = [];
      db.projectItems.push(data);
      saveDatabase();
      return data;
    },
    update: (id: string, data: Partial<ProjectItem>): ProjectItem | undefined => {
      const index = (db.projectItems || []).findIndex(i => i.id === id);
      if (index === -1) return undefined;
      db.projectItems[index] = { ...db.projectItems[index], ...data };
      saveDatabase();
      return db.projectItems[index];
    },
    delete: (id: string): boolean => {
      const index = (db.projectItems || []).findIndex(i => i.id === id);
      if (index === -1) return false;
      db.projectItems.splice(index, 1);
      saveDatabase();
      return true;
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
