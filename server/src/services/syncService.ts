import { supabase } from '../config/supabase.js';
import { localDb } from '../config/localDb.js';
import { Staff, Customer, Appointment, Transaction, Promotion, CustomerCard, SystemLog, StaffReminder } from '../types/index.js';

interface SyncResult {
  success: boolean;
  message: string;
  details: {
    table: string;
    pulled: number;
    pushed: number;
    conflicts: number;
  }[];
  timestamp: string;
}

interface SyncStatus {
  lastSync: string | null;
  isSyncing: boolean;
  error: string | null;
}

let syncStatus: SyncStatus = {
  lastSync: null,
  isSyncing: false,
  error: null
};

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function getLatestTime(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return new Date(a) > new Date(b) ? a : b;
}

async function syncTable<T extends { id: string; created_at?: string; updated_at?: string }>(
  tableName: string,
  supabaseQuery: () => PromiseLike<{ data: T[] | null; error: any }>,
  localGetAll: () => T[],
  localUpsert: (item: T) => void,
  supabaseUpsert: (items: T[]) => PromiseLike<{ error: any }>,
  conflictResolver?: (local: T, remote: T) => T
): Promise<{ pulled: number; pushed: number; conflicts: number }> {
  const result = { pulled: 0, pushed: 0, conflicts: 0 };

  if (!supabase) {
    return result;
  }

  const { data: remoteData, error } = await supabaseQuery();
  if (error) {
    console.error(`同步 ${tableName} 失败:`, error);
    return result;
  }

  const localData = localGetAll();
  const localMap = new Map(localData.map(item => [item.id, item]));
  const remoteMap = new Map((remoteData || []).map(item => [item.id, item]));

  const toPull: T[] = [];
  const toPush: T[] = [];

  for (const [id, remoteItem] of remoteMap) {
    const localItem = localMap.get(id);
    if (!localItem) {
      toPull.push(remoteItem);
    } else {
      const remoteTime = new Date(remoteItem.updated_at || remoteItem.created_at || 0).getTime();
      const localTime = new Date(localItem.updated_at || localItem.created_at || 0).getTime();
      
      if (remoteTime > localTime) {
        toPull.push(remoteItem);
      } else if (localTime > remoteTime) {
        toPush.push(localItem);
      }
    }
  }

  for (const [id, localItem] of localMap) {
    if (!remoteMap.has(id)) {
      toPush.push(localItem);
    }
  }

  for (const item of toPull) {
    localUpsert(item);
    result.pulled++;
  }

  if (toPush.length > 0) {
    const validItems = toPush.filter(item => isValidUUID(item.id));
    const invalidCount = toPush.length - validItems.length;
    
    if (invalidCount > 0) {
      console.warn(`⚠️ ${tableName} 有 ${invalidCount} 条记录ID格式无效，已跳过`);
    }
    
    if (validItems.length > 0) {
      const { error: pushError } = await supabaseUpsert(validItems);
      if (!pushError) {
        result.pushed = validItems.length;
      } else {
        console.error(`推送 ${tableName} 失败:`, pushError);
      }
    }
  }

  return result;
}

export async function performFullSync(): Promise<SyncResult> {
  if (syncStatus.isSyncing) {
    return {
      success: false,
      message: '同步正在进行中，请稍后再试',
      details: [],
      timestamp: new Date().toISOString()
    };
  }

  syncStatus.isSyncing = true;
  syncStatus.error = null;

  const details: SyncResult['details'] = [];

  try {
    const staffResult = await syncTable(
      'staff',
      () => supabase!.from('staff').select('*'),
      () => localDb.staff.getAll(),
      (item) => localDb.staff.upsert(item),
      async (items) => {
        const { error } = await supabase!.from('staff').upsert(items);
        return { error };
      }
    );
    details.push({ table: 'staff', ...staffResult });

    const customersResult = await syncTable(
      'customers',
      () => supabase!.from('customers').select('*'),
      () => localDb.customers.getAll(),
      (item) => localDb.customers.upsert(item),
      async (items) => {
        const { error } = await supabase!.from('customers').upsert(items);
        return { error };
      }
    );
    details.push({ table: 'customers', ...customersResult });

    const appointmentsResult = await syncTable(
      'appointments',
      () => supabase!.from('appointments').select('*'),
      () => localDb.appointments.getAll(),
      (item) => localDb.appointments.upsert(item),
      async (items) => {
        const { error } = await supabase!.from('appointments').upsert(items);
        return { error };
      }
    );
    details.push({ table: 'appointments', ...appointmentsResult });

    const transactionsResult = await syncTable(
      'transactions',
      () => supabase!.from('transactions').select('*'),
      () => localDb.transactions.getAll(),
      (item) => localDb.transactions.upsert(item),
      async (items) => {
        const { error } = await supabase!.from('transactions').upsert(items);
        return { error };
      }
    );
    details.push({ table: 'transactions', ...transactionsResult });

    const promotionsResult = await syncTable(
      'promotions',
      () => supabase!.from('promotions').select('*'),
      () => localDb.promotions.getAll(),
      (item) => localDb.promotions.upsert(item),
      async (items) => {
        const { error } = await supabase!.from('promotions').upsert(items);
        return { error };
      }
    );
    details.push({ table: 'promotions', ...promotionsResult });

    const customerCardsResult = await syncTable(
      'customer_cards',
      () => supabase!.from('customer_cards').select('*'),
      () => localDb.customerCards.getAll(),
      (item) => localDb.customerCards.upsert(item),
      async (items) => {
        const { error } = await supabase!.from('customer_cards').upsert(items);
        return { error };
      }
    );
    details.push({ table: 'customer_cards', ...customerCardsResult });

    const logsResult = await syncTable(
      'system_logs',
      () => supabase!.from('system_logs').select('*'),
      () => localDb.logs.getAll(),
      (item) => localDb.logs.upsert(item),
      async (items) => {
        const { error } = await supabase!.from('system_logs').upsert(items);
        return { error };
      }
    );
    details.push({ table: 'system_logs', ...logsResult });

    const remindersResult = await syncTable(
      'staff_reminders',
      () => supabase!.from('staff_reminders').select('*'),
      () => localDb.reminders.getAll(),
      (item) => localDb.reminders.upsert(item),
      async (items) => {
        const { error } = await supabase!.from('staff_reminders').upsert(items);
        return { error };
      }
    );
    details.push({ table: 'staff_reminders', ...remindersResult });

    syncStatus.lastSync = new Date().toISOString();
    
    return {
      success: true,
      message: '同步完成',
      details,
      timestamp: syncStatus.lastSync
    };
  } catch (error: any) {
    syncStatus.error = error.message;
    return {
      success: false,
      message: `同步失败: ${error.message}`,
      details,
      timestamp: new Date().toISOString()
    };
  } finally {
    syncStatus.isSyncing = false;
  }
}

export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

let syncInterval: NodeJS.Timeout | null = null;

export function startAutoSync(intervalMs: number = 300000): void {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  syncInterval = setInterval(async () => {
    console.log('🔄 开始自动同步...');
    const result = await performFullSync();
    if (result.success) {
      console.log('✅ 自动同步完成:', result.details);
    } else {
      console.error('❌ 自动同步失败:', result.message);
    }
  }, intervalMs);

  console.log(`🔄 自动同步已启动，间隔: ${intervalMs / 1000} 秒`);
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('⏹️ 自动同步已停止');
  }
}

export default {
  performFullSync,
  getSyncStatus,
  startAutoSync,
  stopAutoSync
};
