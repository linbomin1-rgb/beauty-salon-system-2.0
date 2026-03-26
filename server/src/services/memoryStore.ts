import { Staff, Customer, Appointment, Transaction, Promotion, CustomerCard, SystemLog, StaffReminder } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

class MemoryStore {
  private staff: Staff[] = [
    { id: '1', name: 'admin', role: '总店长', password: 'admin', avatar: 'A', permissions: ['all'] }
  ];
  private customers: Customer[] = [];
  private appointments: Appointment[] = [];
  private transactions: Transaction[] = [];
  private promotions: Promotion[] = [];
  private customerCards: CustomerCard[] = [];
  private logs: SystemLog[] = [];
  private reminders: StaffReminder[] = [];

  getStaff() {
    return this.staff;
  }

  getStaffById(id: string) {
    return this.staff.find(s => s.id === id);
  }

  createStaff(data: Partial<Staff>): Staff {
    const newStaff: Staff = {
      id: uuidv4(),
      name: data.name || '',
      role: data.role || '员工',
      password: data.password || '',
      avatar: data.avatar || 'A',
      permissions: data.permissions || [],
      created_at: new Date().toISOString(),
    };
    this.staff.push(newStaff);
    return newStaff;
  }

  updateStaff(id: string, data: Partial<Staff>): Staff | null {
    const index = this.staff.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.staff[index] = { ...this.staff[index], ...data };
    return this.staff[index];
  }

  deleteStaff(id: string): boolean {
    const index = this.staff.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.staff.splice(index, 1);
    return true;
  }

  loginStaff(name: string, password: string): Staff | null {
    return this.staff.find(s => s.name === name && s.password === password) || null;
  }

  getCustomers() {
    return this.customers;
  }

  getCustomerById(id: string) {
    return this.customers.find(c => c.id === id);
  }

  createCustomer(data: Partial<Customer>): Customer {
    const newCustomer: Customer = {
      id: uuidv4(),
      name: data.name || '',
      phone: data.phone || '',
      balance: data.balance || 0,
      remarks: data.remarks || '',
      created_at: new Date().toISOString(),
      gender: data.gender,
      birthday: data.birthday,
      source: data.source,
      tags: data.tags || [],
      assigned_staff_id: data.assigned_staff_id,
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  updateCustomer(id: string, data: Partial<Customer>): Customer | null {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.customers[index] = { ...this.customers[index], ...data };
    return this.customers[index];
  }

  deleteCustomer(id: string): boolean {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.customers.splice(index, 1);
    return true;
  }

  getAppointments() {
    return this.appointments;
  }

  getAppointmentById(id: string) {
    return this.appointments.find(a => a.id === id);
  }

  createAppointment(data: Partial<Appointment>): Appointment {
    const newAppointment: Appointment = {
      id: uuidv4(),
      customer_id: data.customer_id || null,
      customer_name: data.customer_name || '',
      staff_id: data.staff_id || '',
      project_name: data.project_name || '',
      start_time: data.start_time || new Date().toISOString(),
      start_hour: data.start_hour || 10,
      duration: data.duration || 1,
      status: data.status || 'pending',
      note: data.note,
      created_at: new Date().toISOString(),
    };
    this.appointments.push(newAppointment);
    return newAppointment;
  }

  updateAppointment(id: string, data: Partial<Appointment>): Appointment | null {
    const index = this.appointments.findIndex(a => a.id === id);
    if (index === -1) return null;
    this.appointments[index] = { ...this.appointments[index], ...data };
    return this.appointments[index];
  }

  deleteAppointment(id: string): boolean {
    const index = this.appointments.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.appointments.splice(index, 1);
    return true;
  }

  getTransactions() {
    return this.transactions;
  }

  createTransaction(data: Partial<Transaction>): Transaction {
    const newTransaction: Transaction = {
      id: uuidv4(),
      type: data.type || 'consume',
      customer_id: data.customer_id || null,
      customer_name: data.customer_name || '',
      customer_card_id: data.customer_card_id,
      promotion_name: data.promotion_name,
      original_amount: data.original_amount,
      amount: data.amount || 0,
      payment_method: data.payment_method || 'cash',
      item_name: data.item_name || '',
      staff_id: data.staff_id,
      timestamp: new Date().toISOString(),
      is_revoked: false,
      created_at: new Date().toISOString(),
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  getPromotions() {
    return this.promotions;
  }

  createPromotion(data: Partial<Promotion>): Promotion {
    const newPromotion: Promotion = {
      id: uuidv4(),
      name: data.name || '',
      type: data.type,
      discount_rate: data.discount_rate,
      total_count: data.total_count,
      start_date: data.start_date,
      end_date: data.end_date,
      created_at: new Date().toISOString(),
    };
    this.promotions.push(newPromotion);
    return newPromotion;
  }

  getCustomerCards() {
    return this.customerCards;
  }

  createCustomerCard(data: Partial<CustomerCard>): CustomerCard {
    const newCard: CustomerCard = {
      id: uuidv4(),
      customer_id: data.customer_id || '',
      promotion_id: data.promotion_id || '',
      balance: data.balance,
      used_count: data.used_count || 0,
      total_count: data.total_count,
      created_at: new Date().toISOString(),
    };
    this.customerCards.push(newCard);
    return newCard;
  }

  getLogs() {
    return this.logs;
  }

  createLog(data: Partial<SystemLog>): SystemLog {
    const newLog: SystemLog = {
      id: uuidv4(),
      operator: data.operator || '',
      action: data.action || '',
      detail: data.detail || '',
      timestamp: new Date().toISOString(),
      undo_data: data.undo_data,
      is_revoked: false,
      created_at: new Date().toISOString(),
    };
    this.logs.push(newLog);
    return newLog;
  }

  getReminders() {
    return this.reminders;
  }

  createReminder(data: Partial<StaffReminder>): StaffReminder {
    const newReminder: StaffReminder = {
      id: data.id || uuidv4(),
      type: data.type || 'custom',
      content: data.content || '',
      customer_id: data.customer_id || '',
      staff_id: data.staff_id || '',
      reminder_date: data.reminder_date || new Date().toISOString().split('T')[0],
      status: data.status || 'pending',
      created_at: new Date().toISOString(),
    };
    this.reminders.push(newReminder);
    return newReminder;
  }
}

export const memoryStore = new MemoryStore();
export default memoryStore;
