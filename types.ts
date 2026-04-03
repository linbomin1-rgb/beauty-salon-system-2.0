export type Role = 'admin' | 'staff';

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

export interface Transaction {
  id: string;
  type: 'consume' | 'recharge';
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

export interface SystemLog {
  id: string;
  operator: string;
  action: string;
  detail: string;
  timestamp: string;
  undo_data?: {
    type: 'add_customer' | 'recharge' | 'consume' | 'add_appt' | 'update_appt' | 'add_promotion' | 'add_customer_card';
    targetId: string;
    secondaryId?: string;
    customerCardId?: string;
    amount?: number;
    originalAmount?: number;
    prevStatus?: string;
    paymentMethod?: string;
    staffId?: string;
  };
  is_revoked?: boolean;
}
