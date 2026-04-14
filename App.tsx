
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  LayoutDashboard, Calendar, Users, History, Settings, LogOut, Plus, 
  Search, Bell, Trash2, CheckCircle, Smartphone, UserPlus, Sparkles,
  ArrowUpCircle, ArrowDownCircle, CreditCard, Banknote, ShieldCheck,
  ChevronLeft, ChevronRight, Info, UserCheck, X, Filter, PlayCircle, PlusCircle,
  Edit3, Download, UserCircle, ReceiptText, Clock, Wallet, Shield, PlusSquare, ChevronDown, Undo2, AlertTriangle, User, Zap, TrendingUp, UserPlus2, Eye, History as HistoryIcon,
  Minimize2, Maximize2, MousePointer2, MessageSquareText, Cake, BellOff, Gift, Tag, AlertCircle
} from 'lucide-react';
import { Staff, Customer, Appointment, Transaction, SystemLog, Role, Promotion, CustomerCard, StaffReminder } from './types';
import { 
  useStaff, useCustomers, useAppointments, useTransactions, 
  usePromotions, useCustomerCards, useLogs, useReminders, useProjects
} from './hooks/useApi';
import api from './services/api';

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: '概览', icon: LayoutDashboard },
  { id: 'appts', label: '预约中心', icon: Calendar },
  { id: 'customers', label: '会员', icon: Users },
  { id: 'finance', label: '财务', icon: History },
  { id: 'promotions', label: '活动', icon: Sparkles },
  { id: 'staff', label: '员工', icon: ShieldCheck },
  { id: 'projects', label: '项目管理', icon: Tag },
  { id: 'logs', label: '日志', icon: Settings },
];

const safeParse = (key: string, fallback: string) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return JSON.parse(fallback);
    const parsed = JSON.parse(item);
    return parsed !== null ? parsed : JSON.parse(fallback);
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return JSON.parse(fallback);
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'month' | 'day'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [isTagSearchFocused, setIsTagSearchFocused] = useState(false);
  const [apptSearchTerm, setApptSearchTerm] = useState('');
  const [isApptSearchFocused, setIsApptSearchFocused] = useState(false);
  const [isNewApptSearchFocused, setIsNewApptSearchFocused] = useState(false);
  const [activeFinanceFilter, setActiveFinanceFilter] = useState<'all' | 'income' | 'recharge_balance' | 'recharge_card' | 'consume_balance' | 'consume_card'>('all');
  const [financeSubTab, setFinanceSubTab] = useState<'daily' | 'transactions' | 'reports'>('daily');
  const [financeStartDate, setFinanceStartDate] = useState('');
  const [financeEndDate, setFinanceEndDate] = useState('');

  const { 
    data: staff = [], 
    loading: staffLoading, 
    refetch: refetchStaff,
    create: createStaff,
    update: updateStaff,
    remove: deleteStaff,
    login: apiLogin
  } = useStaff();
  
  const { 
    data: customers = [], 
    loading: customersLoading, 
    refetch: refetchCustomers,
    create: createCustomer,
    update: updateCustomer,
    remove: deleteCustomer,
    updateBalance: apiUpdateBalance
  } = useCustomers();
  
  const { 
    data: appointments = [], 
    loading: appointmentsLoading, 
    refetch: refetchAppointments,
    create: createAppointment,
    update: updateAppointment,
    remove: deleteAppointment,
    updateStatus: updateAppointmentStatus,
    checkConflicts: checkAppointmentConflicts
  } = useAppointments();
  
  const { 
    data: transactions = [], 
    loading: transactionsLoading, 
    refetch: refetchTransactions,
    create: createTransaction,
    revoke: revokeTransaction
  } = useTransactions();
  
  const { 
    data: logs = [], 
    loading: logsLoading, 
    refetch: refetchLogs,
    create: createLog,
    revoke: revokeLogApi
  } = useLogs();
  
  const { 
    data: promotions = [], 
    loading: promotionsLoading, 
    refetch: refetchPromotions,
    create: createPromotion,
    update: updatePromotion,
    remove: deletePromotion
  } = usePromotions();
  
  const { 
    data: customerCards = [], 
    loading: customerCardsLoading, 
    refetch: refetchCustomerCards,
    create: createCustomerCard,
    update: updateCustomerCard,
    remove: deleteCustomerCard,
    useCard: useCustomerCard
  } = useCustomerCards();
  
  const { 
    data: reminders = [], 
    loading: remindersLoading, 
    refetch: refetchReminders,
    create: createReminder,
    update: updateReminder,
    complete: completeReminder,
    remove: deleteReminder
  } = useReminders();
  
  const { 
    data: projectCategories = [], 
    loading: projectsLoading, 
    refetch: refetchProjects,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem
  } = useProjects();
  
  const getDiff = (original: any, updated: any, fieldLabels: Record<string, string>) => {
    const changes: string[] = [];
    for (const key in fieldLabels) {
      let origVal = original[key];
      let upVal = updated[key];

      // Handle arrays (like tags)
      if (Array.isArray(origVal) && Array.isArray(upVal)) {
        const sortedOrig = [...origVal].sort();
        const sortedUp = [...upVal].sort();
        if (JSON.stringify(sortedOrig) === JSON.stringify(sortedUp)) continue;
        origVal = origVal.join(', ') || '无';
        upVal = upVal.join(', ') || '无';
      } else {
        origVal = origVal || '无';
        upVal = upVal || '无';
      }

      if (origVal !== upVal) {
        changes.push(`${fieldLabels[key]}: "${origVal}" -> "${upVal}"`);
      }
    }
    return changes.join('; ');
  };

  const formatTime = (h: number) => {
    const hour = Math.floor(h);
    const min = Math.round((h % 1) * 60);
    return `${hour}:${min.toString().padStart(2, '0')}`;
  };

  const [isModalOpen, setIsModalOpen] = useState<string | null>(null);
  const [modalStack, setModalStack] = useState<string[]>([]);
  const [customAlert, setCustomAlert] = useState<{ message: string; title?: string } | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{ message: string; title?: string; onConfirm: () => void } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = (modalId: string) => {
    if (isModalOpen) {
      setModalStack(prev => [...prev, isModalOpen]);
    }
    setIsModalOpen(modalId);
  };

  const closeModal = () => {
    if (modalStack.length > 0) {
      const prevModal = modalStack[modalStack.length - 1];
      setModalStack(prev => prev.slice(0, -1));
      setIsModalOpen(prevModal);
    } else {
      setIsModalOpen(null);
      setModalStack([]);
    }
  };

  const showAlert = (message: string, title: string = '提示') => {
    setCustomAlert({ message, title });
  };

  const showConfirm = (message: string, onConfirm: () => void, title: string = '确认操作') => {
    setCustomConfirm({ message, title, onConfirm });
  };
  const [confirmReminderId, setConfirmReminderId] = useState<string | null>(null);
  
  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case 'wechat': return '微信';
      case 'alipay': return '支付宝';
      case 'meituan': return '美团';
      case 'cash': return '现金';
      case 'balance': return '余额';
      case 'promotion_card': return '活动卡';
      default: return '未知';
    }
  };
  const [showReminders, setShowReminders] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [isVoidingAppt, setIsVoidingAppt] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Staff | null>(null);
  const [isQuickAddCustomer, setIsQuickAddCustomer] = useState(false);
  const [revokingLog, setRevokingLog] = useState<SystemLog | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [logDateFilter, setLogDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [customLogDate, setCustomLogDate] = useState<string>('');

  const getSavedCredentials = () => {
    try {
      const saved = localStorage.getItem('savedCredentials');
      if (saved) {
        const { loginUser, loginPass } = JSON.parse(saved);
        return { loginUser: loginUser || '', loginPass: loginPass || '' };
      }
    } catch {}
    return { loginUser: '', loginPass: '' };
  };

  const savedCreds = getSavedCredentials();

  const [selectedProjectCategory, setSelectedProjectCategory] = useState<string | null>(null);

  const [formState, setFormState] = useState<any>({
    loginUser: savedCreds.loginUser,
    loginPass: savedCreds.loginPass,
    rememberMe: !!(savedCreds.loginUser && savedCreds.loginPass),
    custName: '',
    custPhone: '',
    custRemarks: '',
    custGender: 'female',
    custBirthday: '',
    custSource: '',
    custTags: '',
    custAssignedStaffId: '',
    amount: '',
    itemName: '',
    note: '',
    apptCustId: '',
    apptStaffId: '',
    apptCategory: '',
    apptProject: '',
    apptDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
    apptStartTime: '10',
    apptEndTime: '11',
    custSearch: '',
    staffName: '',
    staffRole: '',
    staffPass: '',
    promoName: '',
    promoDiscount: '',
    promoStartDate: '',
    promoEndDate: '',
    promoIsPermanent: true,
    cardPromoId: '',
    cardAmount: '',
    cardPaymentMethod: 'wechat',
    cardStaffId: '',
    rechargeStaffId: '',
    itemCategory: '',
    staffPermissions: ['dashboard', 'appts', 'customers'],
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // --- 自动化提醒逻辑 ---
  useEffect(() => {
    if (!currentUser) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newReminders: Partial<StaffReminder>[] = [];

    customers.forEach(c => {
      if (c.birthday) {
        const [bYear, bMonth, bDay] = c.birthday.split('-').map(Number);
        const nextBday = new Date(today.getFullYear(), bMonth - 1, bDay);
        if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
        
        const diffDays = Math.round((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 30) {
          const rid = `bday_${c.id}_${nextBday.getFullYear()}`;
          if (!reminders.find(r => r.id === rid)) {
            newReminders.push({
              id: rid,
              type: 'birthday',
              content: `顾客 ${c.name} 将在 ${bMonth}-${bDay} 过生日，请提前准备惊喜！`,
              customer_id: c.id,
              staff_id: c.assigned_staff_id || '',
              reminder_date: todayStr,
              status: 'pending',
            });
          }
        }
      }
    });

    customers.forEach(c => {
      if (c.assigned_staff_id === currentUser.id || currentUser.role === 'admin') {
        const custTrans = transactions.filter(t => t.customer_id === c.id && t.type === 'consume' && !t.is_revoked);
        if (custTrans.length > 0) {
          const lastTransTime = Math.max(...custTrans.map(t => new Date(t.timestamp).getTime()));
          const lastTrans = new Date(lastTransTime);
          const diffDays = Math.ceil((today.getTime() - lastTrans.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 60) {
            const rid = `dormant_${c.id}_${lastTrans.toISOString().split('T')[0]}`;
            if (!reminders.find(r => r.id === rid)) {
              newReminders.push({
                id: rid,
                type: 'dormant',
                content: `顾客 ${c.name} 已有 ${diffDays} 天未到店消费，建议进行回访。`,
                customer_id: c.id,
                staff_id: currentUser.id,
                reminder_date: todayStr,
                status: 'pending',
              });
            }
          }
        }
      }
    });

    newReminders.forEach(r => createReminder(r));
  }, [customers, transactions, currentUser]);

  // --- 锁定背景滚动 ---
  useEffect(() => {
    if (isModalOpen || revokingLog || selectedAppt || selectedPromoId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen, revokingLog, selectedAppt, selectedPromoId]);

  // --- 过滤掉admin账号的员工列表（用于预约表） ---
  const scheduleStaff = useMemo(() => staff.filter(s => s.name.toLowerCase() !== 'admin'), [staff]);

  // --- 统计计算 ---
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayTrans = transactions.filter(t => new Date(t.timestamp).toDateString() === todayStr && !t.is_revoked);
    const monthTrans = transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      const now = new Date();
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear() && !t.is_revoked;
    });

    const cashIncome = todayTrans.reduce((sum, t) => (t.type === 'consume' && t.payment_method !== 'balance' && t.payment_method !== 'promotion_card') ? sum + (t.amount || 0) : sum, 0);
    const rechargeIncome = todayTrans.reduce((sum, t) => t.type === 'recharge' ? sum + (t.amount || 0) : sum, 0);
    const consumption = todayTrans.reduce((sum, t) => t.type === 'consume' && (t.payment_method === 'balance' || t.payment_method === 'promotion_card') ? sum + (t.amount || 0) : sum, 0);
    const todayRefund = todayTrans.reduce((sum, t) => t.type === 'refund' ? sum + (t.amount || 0) : sum, 0);
    
    const monthlyIncome = monthTrans.reduce((sum, t) => (t.type === 'recharge' || (t.type === 'consume' && t.payment_method !== 'balance' && t.payment_method !== 'promotion_card')) ? sum + (t.amount || 0) : sum, 0);
    const monthlyRefund = monthTrans.reduce((sum, t) => t.type === 'refund' ? sum + (t.amount || 0) : sum, 0);
    const monthlyRevenue = monthlyIncome - monthlyRefund;

    const myTodayTrans = todayTrans.filter(t => t.staff_id === currentUser?.id);
    const myCashIncome = myTodayTrans.reduce((sum, t) => (t.type === 'consume' && t.payment_method !== 'balance' && t.payment_method !== 'promotion_card') ? sum + (t.amount || 0) : sum, 0);
    const myRechargeIncome = myTodayTrans.reduce((sum, t) => t.type === 'recharge' ? sum + (t.amount || 0) : sum, 0);
    const myConsumption = myTodayTrans.reduce((sum, t) => t.type === 'consume' && (t.payment_method === 'balance' || t.payment_method === 'promotion_card') ? sum + (t.amount || 0) : sum, 0);

    const staffStats = scheduleStaff.map(s => {
      const sTrans = todayTrans.filter(t => t.staff_id === s.id);
      const sCash = sTrans.reduce((sum, t) => (t.type === 'consume' && t.payment_method !== 'balance' && t.payment_method !== 'promotion_card') ? sum + (t.amount || 0) : sum, 0);
      const sRecharge = sTrans.reduce((sum, t) => t.type === 'recharge' ? sum + (t.amount || 0) : sum, 0);
      const sConsume = sTrans.reduce((sum, t) => t.type === 'consume' && (t.payment_method === 'balance' || t.payment_method === 'promotion_card') ? sum + (t.amount || 0) : sum, 0);
      return {
        id: s.id,
        name: s.name,
        role: s.role,
        avatar: s.avatar,
        actual: sCash + sRecharge,
        cash: sCash,
        recharge: sRecharge,
        consume: sConsume
      };
    }).sort((a, b) => b.actual - a.actual);

    // 计算即将生日的会员（30天内）
    const upcomingBirthdays = customers.filter(c => {
      if (!c.birthday) return false;
      
      const today = new Date();
      const [year, month, day] = c.birthday.split('-').map(Number);
      
      // 今年的生日日期
      let thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
      
      // 如果今年生日已过，计算明年生日
      if (thisYearBirthday < today) {
        thisYearBirthday = new Date(today.getFullYear() + 1, month - 1, day);
      }
      
      const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 30;
    }).map(c => {
      const today = new Date();
      const [year, month, day] = c.birthday!.split('-').map(Number);
      let thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
      if (thisYearBirthday < today) {
        thisYearBirthday = new Date(today.getFullYear() + 1, month - 1, day);
      }
      const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...c, daysUntil, birthdayDate: thisYearBirthday };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    return {
      todayActual: cashIncome + rechargeIncome - todayRefund,
      todayCash: cashIncome,
      todayRecharge: rechargeIncome,
      todayConsumption: consumption,
      todayRefund,
      monthlyRevenue,
      monthlyRefund,
      totalMembers: customers.length,
      pendingAppts: appointments.filter(a => a.status === 'pending').length,
      todayAppts: appointments.filter(a => new Date(a.start_time).toDateString() === todayStr).length,
      allPendingAppts: appointments.filter(a => a.status === 'pending').sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
      myTodayActual: myCashIncome + myRechargeIncome,
      myTodayConsumption: myConsumption,
      upcomingBirthdays,
      staffStats
    };
  }, [transactions, customers, appointments, currentUser, staff]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const income = transactions.filter(t => t && new Date(t.timestamp).toDateString() === d.toDateString() && !t.is_revoked).reduce((sum, t) => (t.type === 'recharge' || (t.type === 'consume' && t.payment_method !== 'balance' && t.payment_method !== 'promotion_card')) ? sum + (t.amount || 0) : sum, 0);
      return { name: `${d.getMonth() + 1}/${d.getDate()}`, 营收: income };
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      let typeMatch = true;
      if (activeFinanceFilter === 'recharge_balance') typeMatch = t.type === 'recharge' && !t.customer_card_id;
      if (activeFinanceFilter === 'recharge_card') typeMatch = t.type === 'recharge' && !!t.customer_card_id;
      if (activeFinanceFilter === 'consume_balance') typeMatch = t.type === 'consume' && t.payment_method === 'balance';
      if (activeFinanceFilter === 'consume_card') typeMatch = t.type === 'consume' && t.payment_method === 'promotion_card';
      if (activeFinanceFilter === 'income') typeMatch = t.type === 'consume' && t.payment_method !== 'balance' && t.payment_method !== 'promotion_card';
      
      if (!typeMatch) return false;

      const tDate = new Date(t.timestamp);
      tDate.setHours(0, 0, 0, 0);

      if (financeStartDate) {
        const sDate = new Date(financeStartDate);
        sDate.setHours(0, 0, 0, 0);
        if (tDate < sDate) return false;
      }
      if (financeEndDate) {
        const eDate = new Date(financeEndDate);
        eDate.setHours(0, 0, 0, 0);
        if (tDate > eDate) return false;
      }

      return true;
    });
  }, [transactions, activeFinanceFilter, financeStartDate, financeEndDate]);

  const dailySettlementData = useMemo(() => {
    let sDate = new Date();
    sDate.setHours(0, 0, 0, 0);
    let eDate = new Date();
    eDate.setHours(23, 59, 59, 999);

    if (financeStartDate) {
      sDate = new Date(financeStartDate);
      sDate.setHours(0, 0, 0, 0);
    }
    if (financeEndDate) {
      eDate = new Date(financeEndDate);
      eDate.setHours(23, 59, 59, 999);
    }

    const tList = transactions.filter(t => {
      if (t.is_revoked) return false;
      const tDate = new Date(t.timestamp);
      return tDate >= sDate && tDate <= eDate;
    });

    const incomeDetails = {
      total: 0,
      recharge: 0,
      rechargeBalance: 0,
      rechargeCard: 0,
      consume: 0,
      cardConsume: 0,
      cardConsumeBalance: 0,
      cardConsumePromotion: 0,
    };

    const paymentMethods = {
      cash: 0,
      wechat: 0,
      alipay: 0,
      meituan: 0
    };

    const uniqueCustomerIds = new Set<string>();

    tList.forEach(t => {
      uniqueCustomerIds.add(t.customer_id);
      const amount = t.amount || 0;
      if (t.type === 'recharge') {
        incomeDetails.recharge += amount;
        if (t.customer_card_id) {
          incomeDetails.rechargeCard += amount;
        } else {
          incomeDetails.rechargeBalance += amount;
        }
        incomeDetails.total += amount;
        if (t.payment_method in paymentMethods) {
          paymentMethods[t.payment_method as keyof typeof paymentMethods] += amount;
        }
      } else if (t.type === 'consume') {
        if (t.payment_method === 'balance' || t.payment_method === 'promotion_card') {
          incomeDetails.cardConsume += amount;
          if (t.payment_method === 'balance') {
            incomeDetails.cardConsumeBalance += amount;
          } else {
            incomeDetails.cardConsumePromotion += amount;
          }
        } else {
          incomeDetails.consume += amount;
          incomeDetails.total += amount;
          if (t.payment_method in paymentMethods) {
            paymentMethods[t.payment_method as keyof typeof paymentMethods] += amount;
          }
        }
      }
    });

    let newCustomersCount = 0;
    let oldCustomersCount = 0;

    uniqueCustomerIds.forEach(id => {
      const c = customers.find(cust => cust.id === id);
      if (c) {
        const cDate = new Date(c.created_at);
        if (cDate >= sDate && cDate <= eDate) {
          newCustomersCount++;
        } else {
          oldCustomersCount++;
        }
      }
    });

    return {
      incomeDetails,
      paymentMethods,
      newCustomersCount,
      oldCustomersCount,
      transactionCount: tList.length
    };
  }, [transactions, customers, financeStartDate, financeEndDate]);

  const handleDownloadReport = () => {
    if (filteredTransactions.length === 0) {
      alert('当前没有可导出的数据');
      return;
    }
    
    const headers = ['单号', '时间', '类型', '客户', '项目', '金额', '支付方式'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => {
        const typeStr = t.type === 'recharge' ? '充值' : '消费';
        const dateStr = new Date(t.timestamp).toLocaleString();
        const amountStr = t.type === 'recharge' ? `+${t.amount}` : `-${t.amount}`;
        const methodStr = t.payment_method === 'wechat' ? '微信' : t.payment_method === 'alipay' ? '支付宝' : t.payment_method === 'cash' ? '现金' : t.payment_method === 'meituan' ? '美团' : '余额';
        return `${t.id},"${dateStr}",${typeStr},"${t.customer_name}","${t.item_name || '-'}",${amountStr},${methodStr}`;
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `财务报表_${financeStartDate || '全部'}至${financeEndDate || '全部'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAvailableCards = (customerId: string) => {
    return customerCards
      .filter(card => {
        if (card.customer_id !== customerId) return false;
        const promo = promotions.find(p => p.id === card.promotion_id);
        if (promo?.type === 'count') {
          return (card.used_count || 0) < (card.total_count || 0);
        }
        return (card.balance || 0) > 0;
      })
      .map(card => {
        const promo = promotions.find(p => p.id === card.promotion_id);
        const isCount = promo?.type === 'count';
        return {
          ...card,
          promotionName: promo?.name || '未知活动',
          discountRate: promo?.discount_rate || 1,
          type: promo?.type || 'discount',
          displayText: isCount 
            ? `${promo?.name || '未知活动'} - 剩余: ${(card.total_count || 0) - (card.used_count || 0)}次`
            : `${promo?.name || '未知活动'} - 余额: ¥${card.balance} (${(promo?.discount_rate || 1) * 10}折)`
        };
      });
  };

  const addLog = async (action: string, detail: string, undoData?: SystemLog['undo_data']) => {
    await createLog({ operator: currentUser?.name || '系统', action, detail, undo_data: undoData });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await apiLogin(formState.loginUser, formState.loginPass);
    if (response.success && response.data) {
      if (formState.rememberMe) {
        localStorage.setItem('savedCredentials', JSON.stringify({
          loginUser: formState.loginUser,
          loginPass: formState.loginPass
        }));
      } else {
        localStorage.removeItem('savedCredentials');
      }
      setCurrentUser(response.data as Staff);
      await addLog('登录', response.data.name || '');
    } else {
      showAlert('登录失败', '账号或密码错误');
    }
  };

  const handleSaveStaff = async () => {
    if (!formState.staffName || !formState.staffRole) return showAlert('提示', '请补全职员资料');
    if (editingTarget) {
      const updatedStaff = {
        name: formState.staffName,
        role: formState.staffRole,
        permissions: formState.staffPermissions || ['dashboard'],
        password: formState.staffPass || undefined,
        avatar: formState.staffName[0],
      };
      const labels = { name: '姓名', role: '职位', permissions: '权限' };
      const diff = getDiff(editingTarget, updatedStaff, labels);
      await updateStaff(editingTarget.id, updatedStaff);
      await addLog('修改职员资料', `${formState.staffName}${diff ? ` (${diff})` : ''}`);
    } else {
      if (!formState.staffPass) return showAlert('提示', '请设置登录密码');
      await createStaff({
        name: formState.staffName,
        role: formState.staffRole,
        password: formState.staffPass,
        avatar: formState.staffName[0],
        permissions: formState.staffPermissions || ['dashboard']
      });
      await addLog('职员入职', formState.staffName);
    }
    closeModal();
    setEditingTarget(null);
  };

  const handleAddPromotion = async () => {
    if (!formState.promoName) return showAlert('提示', '请填写活动名称');
    const type = formState.promoType || 'discount';
    let discount = 1;
    let totalCount = 0;
    
    if (type === 'discount') {
      if (!formState.promoDiscount) return showAlert('提示', '请填写折扣率');
      discount = parseFloat(formState.promoDiscount);
      if (isNaN(discount) || discount <= 0 || discount > 1) return showAlert('提示', '折扣必须是 0 到 1 之间的小数');
    } else {
      if (!formState.promoTotalCount) return showAlert('提示', '请填写总次数');
      totalCount = parseInt(formState.promoTotalCount, 10);
      if (isNaN(totalCount) || totalCount <= 0) return showAlert('提示', '总次数必须是大于0的整数');
    }
    
    await createPromotion({
      name: formState.promoName,
      type: type,
      discount_rate: type === 'discount' ? discount : undefined,
      total_count: type === 'count' ? totalCount : undefined,
      start_date: formState.promoIsPermanent ? undefined : (formState.promoStartDate || undefined),
      end_date: formState.promoIsPermanent ? undefined : (formState.promoEndDate || undefined),
    });
    await addLog('创建活动', formState.promoName);
    setFormState({...formState, promoName: '', promoType: 'discount', promoDiscount: '', promoTotalCount: '', promoStartDate: '', promoEndDate: '', promoIsPermanent: true});
    setIsModalOpen(null);
  };

  const handleDeletePromotion = (id: string) => {
    showConfirm('确认删除该活动？', async () => {
      const promo = promotions.find(p => p.id === id);
      if (promo) {
        await deletePromotion(id);
        await addLog('删除活动', promo.name);
      }
    });
  };

  const handleAddCustomerCard = async (customerId: string) => {
    if (isSubmitting) return;
    if (!formState.cardPromoId || !formState.cardAmount) return showAlert('提示', '请填写完整信息');
    const amount = parseFloat(formState.cardAmount);
    if (isNaN(amount) || amount <= 0) return showAlert('提示', '金额必须大于 0');
    
    const promo = promotions.find(p => p.id === formState.cardPromoId);
    if (!promo) return showAlert('提示', '活动不存在');

    const now = new Date();
    if (promo.start_date && new Date(promo.start_date) > now) {
      return showAlert('提示', '该活动尚未开始');
    }
    if (promo.end_date) {
      const endDate = new Date(promo.end_date);
      endDate.setHours(23, 59, 59, 999);
      if (endDate < now) {
        return showAlert('提示', '该活动已结束，无法办理');
      }
    }

    setIsSubmitting(true);
    try {
      const cardResponse = await createCustomerCard({
        customer_id: customerId,
        promotion_id: promo.id,
        balance: promo.type === 'count' ? undefined : amount,
        used_count: promo.type === 'count' ? 0 : undefined,
        total_count: promo.type === 'count' ? promo.total_count : undefined,
      });
      
      if (!cardResponse.success || !cardResponse.data) {
        return showAlert('提示', '创建活动卡失败');
      }
      
      const customer = customers.find(c => c.id === customerId);
      const transactionResponse = await createTransaction({
        type: 'recharge',
        customer_id: customerId,
        customer_name: customer?.name || '未知',
        customer_card_id: cardResponse.data.id,
        promotion_name: promo.name,
        amount,
        payment_method: formState.cardPaymentMethod || 'wechat',
        item_name: `办理活动卡: ${promo.name}`,
        staff_id: formState.cardStaffId || currentUser?.id,
      });
      
      await addLog('办理活动卡', `${customer?.name} - ${promo.name} (¥${amount})`, { type: 'add_customer_card', targetId: cardResponse.data.id, secondaryId: transactionResponse.data?.id, amount });
      setFormState({...formState, cardPromoId: '', cardAmount: '', cardPaymentMethod: 'wechat', cardStaffId: ''});
      setIsModalOpen(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (isSubmitting) return;
    if (!formState.custName || !formState.custPhone) return showAlert('提示', '请补全会员资料');
    
    setIsSubmitting(true);
    try {
      if (editingTarget && 'phone' in editingTarget) {
        const labels: Record<string, string> = {
          name: '姓名',
          phone: '手机号',
          remarks: '备注',
          gender: '性别',
          birthday: '生日',
          source: '来源',
          tags: '标签',
          assignedStaffId: '专属客服'
        };
        
        const diff = getDiff(editingTarget, {
          name: formState.custName,
          phone: formState.custPhone,
          remarks: formState.custRemarks,
          gender: formState.custGender,
          birthday: formState.custBirthday,
          source: formState.custSource,
          tags: formState.custTags.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean),
          assignedStaffId: formState.custAssignedStaffId
        }, labels);

        await updateCustomer(editingTarget.id, {
          name: formState.custName,
          phone: formState.custPhone,
          remarks: formState.custRemarks,
          gender: formState.custGender,
          birthday: formState.custBirthday,
          source: formState.custSource,
          tags: formState.custTags.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean),
          assigned_staff_id: formState.custAssignedStaffId
        });
        await addLog('修改会员资料', `${formState.custName}${diff ? ` (${diff})` : ''}`);
      } else {
        const amount = parseFloat(formState.amount) || 0;
        const custResponse = await createCustomer({
          name: formState.custName,
          phone: formState.custPhone,
          balance: amount,
          remarks: formState.custRemarks || '',
          gender: formState.custGender,
          birthday: formState.custBirthday,
          source: formState.custSource,
          tags: formState.custTags.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean),
          assigned_staff_id: formState.custAssignedStaffId,
        });
        if (amount > 0 && custResponse.success && custResponse.data) {
          await createTransaction({
            type: 'recharge',
            customer_id: custResponse.data.id,
            customer_name: custResponse.data.name,
            amount: amount,
            payment_method: 'cash',
            item_name: '开卡充值',
            staff_id: currentUser?.id,
          });
        }
        await addLog('录入会员', formState.custName);
      }
      setFormState({
        ...formState,
        custName: '',
        custPhone: '',
        custRemarks: '',
        custGender: 'female',
        custBirthday: '',
        custSource: '',
        custTags: '',
        custAssignedStaffId: '',
        amount: ''
      });
      closeModal();
      setEditingTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecharge = async (custId: string, amountStr: string, method: 'cash' | 'wechat' | 'alipay' | 'meituan' = 'cash', forceCustomerName?: string, staffId?: string) => {
    if (isSubmitting) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return showAlert('提示', '请输入有效的充值金额');
    
    setIsSubmitting(true);
    try {
      const cust = customers.find(c => c.id === custId);
      const custName = forceCustomerName || cust?.name || '未知';
      const finalStaffId = staffId || formState.rechargeStaffId || currentUser?.id;
      
      await apiUpdateBalance(custId, amount, 'add');
      const transResponse = await createTransaction({
        type: 'recharge',
        customer_id: custId,
        customer_name: custName,
        amount,
        payment_method: method,
        item_name: '充值',
        staff_id: finalStaffId,
      });
      if (transResponse.success && transResponse.data) {
        await addLog('充值', `${custName} ¥${amount}`, { type: 'recharge', targetId: transResponse.data.id, secondaryId: custId, amount, paymentMethod: method, staffId: finalStaffId });
      }
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConsume = async (custId: string, amountStr: string, itemName: string, method: 'balance' | 'cash' | 'promotion_card' | 'meituan' | 'wechat' | 'alipay', apptId?: string, cardId?: string) => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return showAlert('请输入有效的结算金额');
    if (!itemName) return showAlert('请输入服务项目');

    const cust = customers.find(c => c.id === custId);
    
    let actualAmount = amount;
    let originalAmount = amount;
    let promoName = undefined;

    try {
      if (method === 'balance') {
        if ((cust?.balance || 0) < amount) { showAlert('余额不足'); return; }
        const balanceResponse = await apiUpdateBalance(custId, amount, 'subtract');
        if (!balanceResponse.success) {
          showAlert('余额扣除失败，请重试');
          return;
        }
      } else if (method === 'promotion_card' && cardId) {
        const card = customerCards.find(c => c.id === cardId);
        if (!card) return showAlert('未找到该活动卡');
        const promo = promotions.find(p => p.id === card.promotion_id);
        if (!promo) return showAlert('未找到该活动规则');
        
        promoName = promo.name;
        if (promo.type === 'count') {
          if ((card.used_count || 0) + amount > (card.total_count || 0)) {
            showAlert(`剩余次数不足，需要扣除 ${amount} 次，当前剩余 ${(card.total_count || 0) - (card.used_count || 0)} 次`);
            return;
          }
          const cardResponse = await updateCustomerCard(cardId, { used_count: (card.used_count || 0) + amount });
          if (!cardResponse.success) {
            showAlert('活动卡更新失败，请重试');
            return;
          }
        } else {
          actualAmount = amount * (promo.discount_rate || 1);
          if ((card.balance || 0) < actualAmount) { showAlert(`卡内余额不足，需要扣除 ${actualAmount.toFixed(2)}，当前余额 ${(card.balance || 0).toFixed(2)}`); return; }
          const cardResponse = await updateCustomerCard(cardId, { balance: (card.balance || 0) - actualAmount });
          if (!cardResponse.success) {
            showAlert('活动卡更新失败，请重试');
            return;
          }
        }
      }

      const transResponse = await createTransaction({ 
        type: 'consume', 
        customer_id: custId, 
        customer_name: cust?.name || '未知', 
        amount: actualAmount, 
        original_amount: method === 'promotion_card' ? originalAmount : undefined,
        customer_card_id: cardId,
        promotion_name: promoName,
        payment_method: method, 
        item_name: itemName, 
        staff_id: currentUser?.id, 
      });
      
      if (!transResponse.success) {
        showAlert('交易记录创建失败，请重试');
        return;
      }
      
      if (apptId) await updateAppointmentStatus(apptId, 'completed');
      if (transResponse.success && transResponse.data) {
        await addLog('消费结算', `${cust?.name} ${itemName} ¥${actualAmount}`, { type: 'consume', targetId: transResponse.data.id, secondaryId: custId, amount: actualAmount, originalAmount, paymentMethod: method, apptId: apptId, customerCardId: cardId });
      }
      
      showAlert('结算成功！');
      closeModal();
    } catch (error) {
      console.error('结算失败:', error);
      showAlert('结算失败，请重试');
    }
  };

  const handleVoidAppt = async (appt: Appointment) => {
    if (!appt) return;
    await deleteAppointment(appt.id);
    await addLog('作废预约', `${appt.customer_name || '未知客户'} - ${appt.project_name}`);
    setSelectedAppt(null);
    setIsVoidingAppt(false);
  };

  const handleDeleteTransaction = (id: string) => {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;
    showConfirm(`确定要撤销这条流水记录吗？\n单号: ${id.slice(-6)}\n金额: ¥${t.amount}\n\n注意：此操作将自动退回相应的会员余额或活动卡次数/余额。`, async () => {
      await revokeTransaction(id);
      if (t.type === 'recharge') {
        if (t.customer_card_id) {
          await deleteCustomerCard(t.customer_card_id);
        } else if (t.customer_id) {
          await apiUpdateBalance(t.customer_id, t.amount, 'subtract');
        }
      } else if (t.type === 'consume') {
        if (t.payment_method === 'balance' && t.customer_id) {
          await apiUpdateBalance(t.customer_id, t.amount, 'add');
        } else if (t.payment_method === 'promotion_card' && t.customer_card_id) {
          const card = customerCards.find(c => c.id === t.customer_card_id);
          if (card) {
            const promo = promotions.find(p => p.id === card.promotion_id);
            if (promo?.type === 'count') {
              await updateCustomerCard(card.id, { used_count: Math.max(0, (card.used_count || 0) - t.amount) });
            } else {
              await updateCustomerCard(card.id, { balance: (card.balance || 0) + t.amount });
            }
          }
        }
      }
      await addLog('撤销流水', `${t.customer_name} - ${t.item_name} (¥${t.amount})`);
    });
  };

  const handleRevokeConfirm = async () => {
    if (isSubmitting) return;
    if (!revokingLog || !revokingLog.undo_data) return;
    const { type, targetId, secondaryId, amount: amountRaw, apptId, paymentMethod, customerCardId } = revokingLog.undo_data;
    const amount = parseFloat(amountRaw as any) || 0;
    
    setIsSubmitting(true);
    try {
      if (type === 'recharge') {
        await revokeTransaction(targetId);
        if (secondaryId) await apiUpdateBalance(secondaryId, amount, 'subtract');
      } else if (type === 'consume') {
        await revokeTransaction(targetId);
        if (secondaryId && paymentMethod === 'balance') await apiUpdateBalance(secondaryId, amount, 'add');
        if (customerCardId && paymentMethod === 'promotion_card') {
          const card = customerCards.find(c => c.id === customerCardId);
          if (card) {
            const promo = promotions.find(p => p.id === card.promotion_id);
            if (promo?.type === 'count') {
              await updateCustomerCard(card.id, { used_count: Math.max(0, (card.used_count || 0) - amount) });
            } else {
              await updateCustomerCard(card.id, { balance: (card.balance || 0) + amount });
            }
          }
        }
        if (apptId) await updateAppointmentStatus(apptId, 'confirmed');
      } else if (type === 'add_customer_card') {
        await deleteCustomerCard(targetId);
        if (secondaryId) await revokeTransaction(secondaryId);
      }
      await revokeLogApi(revokingLog.id);
      await addLog('撤销', `${revokingLog.action} - ${revokingLog.detail}`);
      setRevokingLog(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const walk = (e.pageX - scrollContainerRef.current.offsetLeft - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleResetSystem = () => {
    showConfirm('确定要重置所有系统数据吗？这将清除所有会员、预约和流水记录。', () => {
      localStorage.clear();
      window.location.reload();
    });
  };

  if (!currentUser) {
    return (
      <>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-w-4xl w-full">
            <div className="md:w-1/2 bg-indigo-600 p-8 md:p-12 text-white flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight uppercase">BeautyPro</h1>
              <p className="opacity-70 font-bold mb-6 md:mb-8 italic text-sm md:text-base">专业的店务管理专家</p>
              <div className="space-y-3 md:space-y-4 text-sm md:text-base">
                <div className="flex items-center gap-2 md:gap-3 font-bold"><CheckCircle size={18} className="md:w-5 md:h-5"/> 智能预约排班</div>
                <div className="flex items-center gap-2 md:gap-3 font-bold"><Users size={18} className="md:w-5 md:h-5"/> 会员精细管理</div>
                <div className="flex items-center gap-2 md:gap-3 font-bold"><History size={18} className="md:w-5 md:h-5"/> 资金全量监控</div>
              </div>
            </div>
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-slate-800">职员登录</h2>
              <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
                <input value={formState.loginUser} onChange={e=>setFormState({...formState, loginUser: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl md:rounded-2xl outline-none font-bold text-sm md:text-base text-slate-900" placeholder="职员账号" required />
                <input type="password" value={formState.loginPass} onChange={e=>setFormState({...formState, loginPass: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl md:rounded-2xl outline-none font-bold text-sm md:text-base text-slate-900" placeholder="安全密码" required />
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={formState.rememberMe || false} onChange={e=>setFormState({...formState, rememberMe: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-xs text-slate-500 font-medium">记住账号密码</span>
                </label>
                <button type="submit" className="w-full py-3 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-black transition-all">确认进入系统</button>
              </form>
              <div className="mt-6 md:mt-8 text-center">
              </div>
            </div>
          </div>
        </div>
        {customAlert && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{customAlert.title}</h3>
                <p className="text-sm text-slate-500 font-bold mt-2 whitespace-pre-wrap">{customAlert.message}</p>
              </div>
              <button onClick={() => setCustomAlert(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase active:scale-95 transition-all">确定</button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <aside className="hidden md:flex w-20 lg:w-64 bg-white border-r flex-col shrink-0 transition-all duration-300">
        <div className="h-20 flex items-center px-6 border-b">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg shadow-indigo-100"><Sparkles size={20}/></div>
          <span className="hidden lg:block font-black text-xl uppercase tracking-tighter">BeautyPro</span>
        </div>
        <nav className="flex-1 py-8 px-4 space-y-2">
          {AVAILABLE_PERMISSIONS.filter(p => currentUser?.permissions.includes('all') || currentUser?.permissions.includes(p.id)).map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 font-bold'}`}>
              <item.icon size={22} className="shrink-0" /> <span className="hidden lg:block ml-3">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button onClick={() => setCurrentUser(null)} className="w-full flex items-center p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"><LogOut size={22}/></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-14 md:h-20 bg-white border-b px-4 md:px-8 flex items-center justify-between shrink-0">
          <h2 className="text-base md:text-xl font-black uppercase tracking-widest">{AVAILABLE_PERMISSIONS.find(p=>p.id===activeTab)?.label}</h2>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setCurrentUser(null)} className="md:hidden p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <LogOut size={16} />
            </button>
            <div className="relative" ref={notificationRef}>
              <div className="p-1.5 md:p-2 hover:bg-slate-50 rounded-xl cursor-pointer relative" onClick={() => setShowReminders(!showReminders)}>
                {(() => {
                  const isAdmin = currentUser?.permissions.includes('all');
                  const notifAppts = appointments.filter(a => 
                    (isAdmin || a.staff_id === currentUser?.id) && a.status !== 'completed'
                  );
                  return notifAppts.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                      {notifAppts.length}
                    </span>
                  );
                })()}
                <Bell size={18} className="text-slate-400 md:w-5 md:h-5"/>
              </div>
              {showReminders && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl md:rounded-3xl shadow-2xl border z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 md:p-4 bg-slate-50 text-[10px] font-black uppercase border-b tracking-widest flex justify-between items-center">
                    <span>{currentUser?.permissions.includes('all') ? '全部预约' : '我的预约'}</span>
                    <button onClick={() => setShowReminders(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scroll">
                    {(() => {
                      const isAdmin = currentUser?.permissions.includes('all');
                      const notifAppts = appointments.filter(a => 
                        (isAdmin || a.staff_id === currentUser?.id) && a.status !== 'completed'
                      ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                       .slice(0, 10);
                      
                      return notifAppts.length > 0 ? (
                        notifAppts.map(a => {
                          const apptStaff = staff.find(s => s.id === a.staff_id);
                          return (
                          <div 
                            key={a.id} 
                            className="p-3 border-b hover:bg-slate-50 transition-all cursor-pointer"
                            onClick={() => { setSelectedAppt(a); setShowReminders(false); }}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-[11px] font-bold text-slate-800 truncate">{a.customer_name}</p>
                                  {isAdmin && apptStaff && (
                                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-full">{apptStaff.name}</span>
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5 truncate">{a.project_name}</p>
                                <p className="text-[8px] text-slate-500 font-bold mt-1">
                                  {new Date(a.start_time).toLocaleDateString()} {formatTime(a.start_hour)} · {a.duration}小时
                                </p>
                              </div>
                              <span className={`shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-full ${a.status==='pending'?'bg-amber-100 text-amber-600':'bg-indigo-100 text-indigo-600'}`}>
                                {a.status==='pending'?'待确认':'待结算'}
                              </span>
                            </div>
                          </div>
                        );})
                      ) : (
                        <div className="p-6 text-center">
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <BellOff size={18} className="text-slate-300" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 italic">暂无待处理预约</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => { setFormState({...formState, apptCustId: '', custSearch: '', apptProject: '', apptNote: '', apptDate: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}); setIsModalOpen('new_appt'); }} className="bg-indigo-600 text-white p-1.5 px-3 md:px-6 md:py-2.5 rounded-lg md:rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-1.5 md:gap-2 hover:bg-indigo-700 transition-all text-[9px] md:text-xs">
              <Plus size={12} className="md:w-[18px] md:h-[18px]"/> <span className="hidden md:inline">新增预约</span><span className="md:hidden">新增</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 md:p-8 custom-scroll">
          {activeTab === 'dashboard' && (
            <div className="space-y-4 md:space-y-8 animate-in fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {[
                  { label: '今日实收', val: stats.todayActual, icon: Wallet, color: 'text-indigo-600', tab: 'finance', filter: 'all' },
                  { label: '今日现金', val: stats.todayCash, icon: Banknote, color: 'text-green-500', tab: 'finance', filter: 'cash' },
                  { label: '今日充值', val: stats.todayRecharge, icon: ArrowUpCircle, color: 'text-blue-500', tab: 'finance', filter: 'recharge' },
                  { label: '今日耗卡', val: stats.todayConsumption, icon: CreditCard, color: 'text-amber-500', tab: 'finance', filter: 'consume' },
                  { label: '本月营收', val: stats.monthlyRevenue, icon: TrendingUp, color: 'text-rose-500', tab: 'finance', filter: 'all' },
                  { label: '待受理预约', val: stats.pendingAppts, icon: Clock, color: 'text-orange-400', tab: 'appts' },
                  { label: '今日总预约', val: stats.todayAppts, icon: Calendar, color: 'text-cyan-500', tab: 'appts' },
                  { label: '会员总数', val: stats.totalMembers, icon: Users, color: 'text-indigo-400', tab: 'customers' },
                ].map((s, i) => (
                  <div key={i} onClick={() => { setActiveTab(s.tab); if(s.filter) setActiveFinanceFilter(s.filter as any); }} className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[2rem] border shadow-sm hover:scale-[1.03] transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-1 md:mb-2 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}<s.icon size={14} className={`md:w-4 md:h-4 ${s.color}`}/></div>
                    <h3 className="text-sm md:text-2xl font-black text-slate-900">{typeof s.val === 'number' && !s.label.includes('总') && !s.label.includes('预约') ? `¥${s.val.toLocaleString()}` : s.val}</h3>
                  </div>
                ))}
              </div>

              {/* 生日提醒卡片 */}
              {reminders.filter(r => r.type === 'birthday' && r.status === 'pending').length > 0 && (
                <div className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border shadow-sm border-pink-100 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                      <Cake size={16} className="text-pink-500"/> 生日提醒
                    </h3>
                    <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-full">
                      {reminders.filter(r => r.type === 'birthday' && r.status === 'pending').length} 位会员
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                    {reminders.filter(r => r.type === 'birthday' && r.status === 'pending').sort((a, b) => {
                      const custA = customers.find(c => c.id === a.customer_id);
                      const custB = customers.find(c => c.id === b.customer_id);
                      if (!custA?.birthday || !custB?.birthday) return 0;
                      const getNextBday = (birthday: string) => {
                        const [_, m, d] = birthday.split('-').map(Number);
                        const now = new Date();
                        const nextBday = new Date(now.getFullYear(), m - 1, d);
                        if (nextBday < new Date(now.getFullYear(), now.getMonth(), now.getDate())) nextBday.setFullYear(now.getFullYear() + 1);
                        return nextBday.getTime();
                      };
                      return getNextBday(custA.birthday) - getNextBday(custB.birthday);
                    }).map(r => {
                      const cust = customers.find(c => c.id === r.customer_id);
                      const assignedStaff = staff.find(s => s.id === cust?.assigned_staff_id);
                      return (
                      <div 
                        key={r.id} 
                        onClick={() => setConfirmReminderId(r.id)}
                        className="flex items-center gap-3 p-3 pt-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-pink-50 hover:border-pink-200 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 bg-indigo-100/80 text-indigo-600 text-[8px] font-black px-2 py-0.5 rounded-bl-xl z-10 tracking-widest">
                          {assignedStaff ? assignedStaff.name : '未分配'}
                        </div>
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 shadow-sm group-hover:scale-110 transition-transform">
                          <Cake size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{r.content.split('将在')[0]}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            将在{r.content.split('将在')[1]}
                          </p>
                        </div>
                        <CheckCircle size={14} className="text-slate-300 group-hover:text-pink-500 transition-colors" />
                      </div>
                    )})}
                  </div>
                </div>
              )}

              {/* 沉睡唤醒提醒卡片 */}
              {reminders.filter(r => r.type === 'dormant' && r.status === 'pending').length > 0 && (
                <div className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border shadow-sm border-amber-100 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                      <Zap size={16} className="text-amber-500"/> 沉睡唤醒提醒
                    </h3>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full">
                      {reminders.filter(r => r.type === 'dormant' && r.status === 'pending').length} 位会员
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                    {reminders.filter(r => r.type === 'dormant' && r.status === 'pending').sort((a, b) => {
                      const getDays = (content: string) => {
                        const match = content.match(/(\d+)\s*天/);
                        return match ? parseInt(match[1]) : 0;
                      };
                      return getDays(b.content) - getDays(a.content); // 沉睡天数多的排前面
                    }).map(r => {
                      const cust = customers.find(c => c.id === r.customer_id);
                      const assignedStaff = staff.find(s => s.id === cust?.assigned_staff_id);
                      return (
                      <div 
                        key={r.id} 
                        onClick={() => setConfirmReminderId(r.id)}
                        className="flex items-center gap-3 p-3 pt-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 bg-indigo-100/80 text-indigo-600 text-[8px] font-black px-2 py-0.5 rounded-bl-xl z-10 tracking-widest">
                          {assignedStaff ? assignedStaff.name : '未分配'}
                        </div>
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                          <Zap size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{r.content.split('已有')[0]}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            已有{r.content.split('已有')[1]}
                          </p>
                        </div>
                        <CheckCircle size={14} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                      </div>
                    )})}
                  </div>
                </div>
              )}

              {/* 个人业绩概览 */}
              <div className="bg-gradient-to-br from-indigo-50 to-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                    {currentUser?.name?.[0] || '我'}
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800">我的今日业绩</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">个人专属数据面板</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <div className="bg-white p-3 md:p-4 rounded-2xl border border-indigo-50 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">今日实收</p>
                    <p className="text-lg md:text-xl font-black text-indigo-600">¥{stats.myTodayActual.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-3 md:p-4 rounded-2xl border border-indigo-50 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">今日耗卡</p>
                    <p className="text-lg md:text-xl font-black text-amber-500">¥{stats.myTodayConsumption.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* 店长/管理员可见的员工排行榜 */}
              {(currentUser?.permissions.includes('all') || currentUser?.permissions.includes('staff')) && (
                <div className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border shadow-sm">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                      <TrendingUp size={16} className="text-rose-500"/> 员工今日业绩榜
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {stats.staffStats.map((s, idx) => (
                      <div key={s.id} className="flex items-center justify-between p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                            {idx + 1}
                          </div>
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 font-black shadow-sm">
                            {s.avatar}
                          </div>
                          <div>
                            <p className="text-xs md:text-sm font-bold text-slate-800">{s.name}</p>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs md:text-sm font-black text-indigo-600">¥{s.actual.toLocaleString()}</p>
                          <div className="flex items-center justify-end gap-2 mt-0.5">
                            <p className="text-[9px] md:text-[10px] font-bold text-green-500">现金 ¥{s.cash.toLocaleString()}</p>
                            <p className="text-[9px] md:text-[10px] font-bold text-blue-500">充值 ¥{s.recharge.toLocaleString()}</p>
                            <p className="text-[9px] md:text-[10px] font-bold text-amber-500">耗卡 ¥{s.consume.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 会员生日提醒 */}
              {stats.upcomingBirthdays.length > 0 && (
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-pink-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                      <Cake size={16}/> 会员生日提醒
                    </h3>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-100 px-2 py-1 rounded-full">
                      {stats.upcomingBirthdays.length}人
                    </span>
                  </div>
                  <div className="space-y-2">
                    {stats.upcomingBirthdays.slice(0, 6).map((c) => {
                      const customer = customers.find(cust => cust.id === c.id);
                      return (
                      <div 
                        key={c.id} 
                        className="flex items-center justify-between p-3 bg-white/80 rounded-xl hover:bg-white transition-all cursor-pointer"
                        onClick={() => { 
                          if (customer) {
                            setEditingTarget(customer as any); 
                            setFormState({...formState, custName:customer.name, custPhone:customer.phone, custRemarks:customer.remarks, custGender:customer.gender||'female', custBirthday:customer.birthday||'', custSource:customer.source||'', custTags:(customer.tags||[]).join(', '), custAssignedStaffId: customer.assigned_staff_id || '', amount:''}); 
                            setIsModalOpen('edit_customer'); 
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${c.daysUntil === 0 ? 'bg-rose-100 text-rose-600' : c.daysUntil <= 7 ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500'}`}>
                            {c.daysUntil === 0 ? '🎉' : c.daysUntil === 1 ? '1天' : `${c.daysUntil}天`}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{c.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-rose-500">
                            {c.birthdayDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            {c.daysUntil === 0 ? '今天生日' : c.daysUntil === 1 ? '明天生日' : `${c.daysUntil}天后`}
                          </p>
                        </div>
                      </div>
                    );})}
                  </div>
                  {stats.upcomingBirthdays.length > 6 && (
                    <button 
                      onClick={() => setActiveTab('customers')}
                      className="w-full mt-3 py-2 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      查看全部 ({stats.upcomingBirthdays.length}人) →
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-3xl md:rounded-[2.5rem] border shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">近七日趋势分析</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600"><div className="w-2 h-2 bg-indigo-600 rounded-full"></div> 营收额</div>
                  </div>
                  <div className="h-64 w-full" style={{ minWidth: 1, minHeight: 1 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={chartData}>
                        <CartesianGrid vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10,fontWeight:700,fill:'#94a3b8'}}/>
                        <YAxis hide/>
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius:'1rem',border:'none',boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/>
                        <Bar dataKey="营收" radius={[8,8,8,8]} barSize={32}>
                          {chartData.map((_,idx)=><Cell key={idx} fill={idx===6?'#4f46e5':'#e2e8f0'}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appts' && (
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] border shadow-sm flex flex-col h-full overflow-hidden animate-in slide-in-from-bottom-8">
              <div className="p-2 md:p-6 border-b flex justify-between items-center bg-slate-50/50 flex-wrap gap-2 md:gap-4">
                <div className="relative w-full md:w-auto md:min-w-[240px]">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border shadow-sm w-full">
                    <Search size={14} className="text-slate-400"/>
                    <input 
                      value={apptSearchTerm} 
                      onChange={e=>setApptSearchTerm(e.target.value)} 
                      onFocus={() => setIsApptSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsApptSearchFocused(false), 200)}
                      placeholder="搜索会员或手机..." 
                      className="bg-transparent outline-none w-full text-[10px] md:text-xs font-bold text-slate-900" 
                    />
                  </div>
                  {isApptSearchFocused && apptSearchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto custom-scroll">
                      {customers.filter(c => c.name.toLowerCase().includes(apptSearchTerm.toLowerCase()) || (c.phone || '').includes(apptSearchTerm)).map(c => (
                        <div 
                          key={c.id} 
                          className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-[10px] md:text-xs font-bold text-slate-800 flex justify-between items-center border-b last:border-0 border-slate-50"
                          onClick={() => {
                            setApptSearchTerm(c.name);
                            setIsApptSearchFocused(false);
                          }}
                        >
                          <span>{c.name}</span>
                          <span className="text-[9px] text-slate-400 font-normal">{c.phone}</span>
                        </div>
                      ))}
                      {customers.filter(c => c.name.toLowerCase().includes(apptSearchTerm.toLowerCase()) || (c.phone || '').includes(apptSearchTerm)).length === 0 && (
                        <div className="px-3 py-3 text-center text-[10px] text-slate-400 italic">未找到匹配的会员</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex bg-slate-200/50 p-1 rounded-lg md:rounded-xl">
                  <button onClick={()=>setViewMode('day')} className={`px-2 py-1 md:px-4 md:py-2 rounded-md md:rounded-lg text-[9px] md:text-xs font-bold transition-all ${viewMode==='day'?'bg-white shadow-sm text-indigo-600':'text-slate-500'}`}>日排班</button>
                  <button onClick={()=>setViewMode('month')} className={`px-2 py-1 md:px-4 md:py-2 rounded-md md:rounded-lg text-[9px] md:text-xs font-bold transition-all ${viewMode==='month'?'bg-white shadow-sm text-indigo-600':'text-slate-500'}`}>月历</button>
                </div>
                <div className="flex items-center gap-1 md:gap-3 font-black text-[9px] md:text-xs uppercase tracking-widest">
                  <button onClick={() => setSelectedDate(new Date())} className="px-2 py-1 md:px-3 md:py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors mr-1 md:mr-2">今日</button>
                  <button onClick={()=>{
                    const d = new Date(selectedDate);
                    if (viewMode === 'day') {
                      d.setDate(d.getDate() - 1);
                    } else {
                      d.setMonth(d.getMonth() - 1);
                    }
                    setSelectedDate(d);
                  }} className="p-1 hover:bg-slate-200 rounded-lg transition-all"><ChevronLeft size={14} className="md:w-[18px] md:h-[18px]"/></button>
                  <div className="relative flex items-center justify-center cursor-pointer hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors">
                    <input 
                      type="date" 
                      value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`} 
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-').map(Number);
                          setSelectedDate(new Date(y, m - 1, d));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span>{selectedDate.getFullYear()}年{selectedDate.getMonth()+1}月{viewMode==='day'&&`${selectedDate.getDate()}日`}</span>
                  </div>
                  <button onClick={()=>{
                    const d = new Date(selectedDate);
                    if (viewMode === 'day') {
                      d.setDate(d.getDate() + 1);
                    } else {
                      d.setMonth(d.getMonth() + 1);
                    }
                    setSelectedDate(d);
                  }} className="p-1 hover:bg-slate-200 rounded-lg transition-all"><ChevronRight size={14} className="md:w-[18px] md:h-[18px]"/></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto py-2 md:py-4 custom-scroll select-none" ref={scrollContainerRef} onMouseDown={handleMouseDown} onMouseUp={()=>setIsDragging(false)} onMouseLeave={()=>setIsDragging(false)} onMouseMove={onMouseMove} style={{cursor: isDragging ? 'grabbing' : 'default'}}>
                {viewMode==='day' ? (
                  <div className="h-full flex flex-col overflow-hidden">
                    {/* Desktop Vertical Grid View */}
                    <div className="hidden md:block h-full overflow-auto custom-scroll">
                      <div className="min-w-max">
                        <div className="flex border-b sticky top-0 bg-white z-30 shadow-sm">
                          <div className="w-20 border-r bg-slate-50/50 sticky left-0 z-40"></div>
                          <div className="flex">
                            {scheduleStaff.map(s => {
                              const staffAppts = appointments.filter(a => a.staff_id === s.id && new Date(a.start_time).toDateString() === selectedDate.toDateString()).sort((a, b) => a.start_hour - b.start_hour);
                              return (
                              <div key={s.id} className="w-48 p-3 border-r last:border-r-0 text-center flex flex-col items-center gap-1.5 shrink-0">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center font-black text-indigo-600 border border-indigo-100 text-[10px]">{s.avatar}</div>
                                <div>
                                  <div className="text-[11px] font-black text-slate-900 leading-none">{s.name}</div>
                                  <div className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">{s.role}</div>
                                </div>
                                {staffAppts.length > 0 && (
                                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                                    {staffAppts.map(a => (
                                      <span key={a.id} className={`text-[8px] px-1 py-0.5 rounded font-bold ${a.status==='pending'?'bg-amber-50 text-amber-600':a.status==='confirmed'?'bg-indigo-50 text-indigo-600':a.status==='completed'?'bg-green-200 text-green-700':'bg-slate-100 text-slate-500'}`}>
                                        {formatTime(a.start_hour)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )})}
                          </div>
                        </div>
                        <div className="flex">
                          <div className="w-20 border-r bg-slate-50/50 flex flex-col shrink-0 sticky left-0 z-20">
                            {Array.from({length:14 * 2}).map((_,i)=>{
                              const val = i * 0.5 + 8;
                              return (
                                <div key={i} className="h-[64px] border-b border-slate-100 text-center text-[9px] font-black text-slate-400 flex items-center justify-center uppercase tracking-widest bg-slate-50/50">
                                  {formatTime(val)}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex relative bg-slate-50/20">
                            {scheduleStaff.map(s => (
                              <div key={s.id} className="w-48 border-r last:border-r-0 relative shrink-0">
                                {Array.from({length:14 * 2}).map((_,i)=>{
                                  const val = i * 0.5 + 8;
                                  return (
                                    <div 
                                      key={i} 
                                      className="h-[64px] border-b border-slate-100 hover:bg-indigo-50/50 cursor-crosshair transition-colors"
                                      onClick={() => {
                                        setFormState({ 
                                          ...formState, 
                                          apptStaffId: s.id, 
                                          apptDate: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
                                          apptStartTime: val.toString(),
                                          apptEndTime: (val + 0.5).toString(),
                                          apptNote: '',
                                          custSearch: '',
                                          apptCustId: ''
                                        });
                                        setIsModalOpen('new_appt');
                                      }}
                                    ></div>
                                  );
                                })}
                                {appointments.filter(a=>a.staff_id===s.id && new Date(a.start_time).toDateString()===selectedDate.toDateString() && (!apptSearchTerm || a.customer_name.toLowerCase().includes(apptSearchTerm.toLowerCase()) || (customers.find(c => c.id === a.customer_id)?.phone || '').includes(apptSearchTerm))).map(a=>(
                                  <div 
                                    key={a.id} 
                                    onClick={(e)=>{e.stopPropagation();setSelectedAppt(a);}} 
                                    className={`absolute left-1 right-1 rounded-xl p-3 shadow-sm border-l-4 flex flex-col gap-1.5 transition-all cursor-pointer z-10 hover:shadow-md hover:z-20 ${a.status==='pending'?'bg-amber-50 border-amber-500':a.status==='confirmed'?'bg-indigo-50 border-indigo-500':a.status==='completed'?'bg-green-100 border-green-600 ring-2 ring-green-300':'bg-slate-100 border-slate-400 opacity-60'}`}
                                    style={{
                                      top: `${(a.start_hour - 8) * 128 + 4}px`,
                                      height: `${a.duration * 128 - 8}px`
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex flex-col">
                                        <span className={`text-[11px] font-black leading-none ${a.status==='completed'?'text-green-700':'text-slate-900'}`}>{a.customer_name}</span>
                                        <span className="text-[9px] text-slate-400 font-bold mt-0.5">{customers.find(c => c.id === a.customer_id)?.phone}</span>
                                      </div>
                                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${a.status==='completed'?'text-green-600 bg-green-200':'text-indigo-600 bg-indigo-100/50'}`}>
                                            {a.status==='completed'?'✓ ':''}{Math.floor(a.start_hour)}:{((a.start_hour % 1) * 60).toString().padStart(2, '0')}
                                          </span>
                                    </div>
                                    
                                    <div className={`rounded-lg p-2 border ${a.status==='completed'?'bg-green-50 border-green-200':'bg-white/60 border-black/5'}`}>
                                      <div className={`text-[10px] font-black uppercase tracking-tight ${a.status==='completed'?'text-green-700':'text-slate-700'}`}>{a.project_name}</div>
                                      <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{a.duration}小时</div>
                                      {a.note && (
                                        <div className="text-[9px] text-slate-500 font-medium mt-1 line-clamp-2 italic leading-tight">
                                          "{a.note}"
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Vertical View */}
                    <div className="md:hidden flex flex-col h-full overflow-hidden">
                      <div className="flex-1 overflow-auto relative bg-white custom-scroll">
                        <div className="min-w-max min-h-full flex flex-col">
                          <div className="flex border-b bg-slate-50 sticky top-0 z-30">
                            <div className="w-12 shrink-0 border-r bg-slate-50 sticky left-0 z-40"></div>
                            <div className="flex">
                              {scheduleStaff.map(s => {
                                const staffAppts = appointments.filter(a => a.staff_id === s.id && new Date(a.start_time).toDateString() === selectedDate.toDateString()).sort((a, b) => a.start_hour - b.start_hour);
                                return (
                                <div key={s.id} className="w-24 shrink-0 p-2 text-center border-r last:border-r-0 flex flex-col items-center gap-1">
                                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center font-black text-indigo-600 border text-[8px]">{s.avatar}</div>
                                  <div className="text-[9px] font-bold truncate w-full">{s.name}</div>
                                  {staffAppts.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
                                      {staffAppts.map(a => (
                                        <span key={a.id} className={`text-[7px] px-1 py-0.5 rounded font-bold ${a.status==='pending'?'bg-amber-50 text-amber-600':a.status==='confirmed'?'bg-indigo-50 text-indigo-600':a.status==='completed'?'bg-green-200 text-green-700':'bg-slate-100 text-slate-500'}`}>
                                          {formatTime(a.start_hour)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )})}
                            </div>
                          </div>
                          <div className="flex flex-1">
                            {/* Time Column */}
                            <div className="w-12 shrink-0 bg-slate-50 border-r sticky left-0 z-20">
                              {Array.from({length:14 * 2}).map((_,i) => {
                                const val = i * 0.5 + 8;
                                return (
                                  <div key={i} className="h-[48px] border-b text-[7px] font-black text-slate-400 flex items-center justify-center uppercase bg-slate-50">
                                    {formatTime(val)}
                                  </div>
                                );
                              })}
                            </div>
                            {/* Staff Columns Grid */}
                            <div className="flex">
                              {scheduleStaff.map(s => (
                                <div key={s.id} className="w-24 shrink-0 relative border-r last:border-r-0">
                                  {Array.from({length:14 * 2}).map((_,i) => {
                                    const val = i * 0.5 + 8;
                                    return (
                                      <div 
                                        key={i} 
                                        className="h-[48px] border-b border-slate-50 w-full hover:bg-indigo-50/30 transition-colors"
                                        onClick={() => {
                                          setFormState({ 
                                            ...formState, 
                                            apptStaffId: s.id, 
                                            apptDate: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
                                            apptStartTime: val.toString(),
                                            apptEndTime: (val + 0.5).toString(),
                                            apptNote: '',
                                            custSearch: '',
                                            apptCustId: ''
                                          });
                                          setIsModalOpen('new_appt');
                                        }}
                                      ></div>
                                    );
                                  })}
                                  {appointments.filter(a=>a.staff_id===s.id && new Date(a.start_time).toDateString()===selectedDate.toDateString() && (!apptSearchTerm || a.customer_name.toLowerCase().includes(apptSearchTerm.toLowerCase()) || (customers.find(c => c.id === a.customer_id)?.phone || '').includes(apptSearchTerm))).map(a => (
                                    <div 
                                      key={a.id} 
                                      onClick={(e)=>{e.stopPropagation();setSelectedAppt(a);}}
                                      className={`absolute left-0.5 right-0.5 rounded-lg p-1.5 shadow-sm border-l-2 flex flex-col gap-1 transition-all cursor-pointer z-10 ${a.status==='pending'?'bg-amber-50 border-amber-500':a.status==='confirmed'?'bg-indigo-50 border-indigo-500':a.status==='completed'?'bg-green-100 border-green-600 ring-2 ring-green-300':'bg-slate-100 border-slate-400 opacity-60'} active:scale-95`}
                                      style={{top: `${(a.start_hour - 8) * 96 + 2}px`, height: `${a.duration * 96 - 4}px` }}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                          <span className={`text-[9px] font-black leading-none truncate max-w-[40px] ${a.status==='completed'?'text-green-700':'text-slate-900'}`}>{a.customer_name}</span>
                                          <span className="text-[7px] text-slate-400 font-bold mt-0.5">
                                            {a.status==='completed'?'✓ ':''}{Math.floor(a.start_hour)}:{((a.start_hour % 1) * 60).toString().padStart(2, '0')}
                                          </span>
                                        </div>
                                      </div>
                                      <div className={`rounded p-1 border mt-auto ${a.status==='completed'?'bg-green-50 border-green-200':'bg-white/40 border-black/5'}`}>
                                        <div className={`text-[7px] font-black uppercase truncate ${a.status==='completed'?'text-green-700':'text-slate-700'}`}>{a.project_name}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1.5 md:gap-4 px-2 md:px-4">
                    {['日','一','二','三','四','五','六'].map(d=><div key={d} className="py-1 md:py-2 text-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase">{d}</div>)}
                    {Array.from({length: new Date(selectedDate.getFullYear(), selectedDate.getMonth()+1, 0).getDate()}, (_,i)=>(
                      <div key={i} onClick={()=>{setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i+1)); setViewMode('day');}} className="bg-white border rounded-xl md:rounded-2xl p-2 md:p-3 min-h-[60px] md:min-h-[80px] hover:bg-indigo-50 transition-all cursor-pointer shadow-sm group">
                        <span className="text-[9px] md:text-[10px] font-black text-slate-300 group-hover:text-indigo-600">{i+1}</span>
                        <div className="mt-1 flex flex-wrap gap-0.5 md:gap-1">
                          {appointments.filter(a=>new Date(a.start_time).getDate()===i+1 && new Date(a.start_time).getMonth()===selectedDate.getMonth()).slice(0,3).map(a=>(
                            <div key={a.id} className="w-1 h-1 md:w-1.5 md:h-1.5 bg-indigo-500 rounded-full"></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl flex-[2] md:flex-none md:w-64 border shadow-sm transition-all focus-within:border-indigo-400">
                    <Search size={16} className="text-slate-400 md:w-[18px] md:h-[18px]"/><input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="搜索姓名或手机..." className="bg-transparent outline-none w-full text-xs md:text-sm font-bold text-slate-900" />
                  </div>
                  <div className="relative flex-1 md:flex-none md:w-64">
                    <div className="flex items-center gap-1 bg-white px-2 md:px-3 py-2 md:py-3 rounded-xl md:rounded-2xl w-full border shadow-sm transition-all focus-within:border-indigo-400 h-full">
                      <Tag size={14} className="text-slate-400 md:w-[18px] md:h-[18px]"/><input value={tagSearchTerm} onChange={e=>setTagSearchTerm(e.target.value)} onFocus={()=>setIsTagSearchFocused(true)} onBlur={()=>setTimeout(()=>setIsTagSearchFocused(false), 200)} placeholder="标签" className="bg-transparent outline-none w-full text-[10px] md:text-sm font-bold text-slate-900" />
                    </div>
                    {isTagSearchFocused && (
                      <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[120px]">
                        {Array.from(new Set(customers.flatMap(c => c.tags || []))).filter(t => !tagSearchTerm || t.toLowerCase().includes(tagSearchTerm.toLowerCase())).length > 0 ? (
                          Array.from(new Set(customers.flatMap(c => c.tags || []))).filter(t => !tagSearchTerm || t.toLowerCase().includes(tagSearchTerm.toLowerCase())).map(tag => (
                            <div key={tag} onClick={()=>setTagSearchTerm(tag)} className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer">{tag}</div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-slate-400">暂无匹配标签</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={()=>{setFormState({...formState, custName:'', custPhone:'', custRemarks:'', amount:''}); openModal('new_customer');}} className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-xl flex items-center justify-center gap-2 md:gap-3 hover:bg-black transition-all">
                  <UserPlus size={16} className="md:w-[18px] md:h-[18px]"/> <span className="tracking-widest">录入尊贵会员</span>
                </button>
              </div>
              <div className="bg-white rounded-2xl md:rounded-[2.5rem] border shadow-sm overflow-hidden overflow-x-auto custom-scroll">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b"><tr className="border-b"><th className="px-4 md:px-8 py-3 md:py-5">客户姓名</th><th className="px-4 md:px-8 py-3 md:py-5">联系手机</th><th className="px-4 md:px-8 py-3 md:py-5">卡内余额</th><th className="px-4 md:px-8 py-3 md:py-5">会员备注</th><th className="px-4 md:px-8 py-3 md:py-5 text-right hidden md:table-cell">档案管理</th></tr></thead>
                  <tbody className="divide-y text-xs md:text-sm">
                    {customers.filter(c=>{
                      const matchSearch = (c.name||'').toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone||'').includes(searchTerm);
                      const matchTag = !tagSearchTerm || (c.tags && c.tags.some(t => t.toLowerCase().includes(tagSearchTerm.toLowerCase())));
                      return matchSearch && matchTag;
                    }).map(c=>(
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer md:cursor-default" onClick={() => { if (window.innerWidth < 768) openModal(`customer_profile_${c.id}`); }}>
                        <td className="px-4 md:px-8 py-3 md:py-5 font-bold text-slate-800">{c.name || '未命名'}</td>
                        <td className="px-4 md:px-8 py-3 md:py-5 font-bold text-slate-500 tracking-wider italic">{c.phone || '无号码'}</td>
                        <td className="px-4 md:px-8 py-3 md:py-5 font-black text-indigo-600">¥{(c.balance || 0).toLocaleString()}</td>
                        <td className="px-4 md:px-8 py-3 md:py-5">
                          {c.remarks ? (
                            <button onClick={(e)=>{e.stopPropagation(); openModal(`customer_profile_${c.id}`);}} className="text-[10px] md:text-xs text-slate-500 hover:text-indigo-600 transition-colors truncate max-w-[120px] md:max-w-[200px] block text-left" title={c.remarks}>
                              {c.remarks}
                            </button>
                          ) : (
                            <span></span>
                          )}
                        </td>
                        <td className="px-4 md:px-8 py-3 md:py-5 text-right hidden md:flex justify-end gap-3 md:gap-5">
                      <button onClick={(e)=>{e.stopPropagation(); setEditingTarget(c as any); setFormState({...formState, custName:c.name, custPhone:c.phone, custRemarks:c.remarks, custGender:c.gender||'female', custBirthday:c.birthday||'', custSource:c.source||'', custTags:(c.tags||[]).join(', '), custAssignedStaffId: c.assigned_staff_id || '', amount:''}); openModal('new_customer');}} className="text-[9px] md:text-[10px] font-bold uppercase underline text-slate-400 hover:text-indigo-600">编辑</button>
                      <button onClick={(e)=>{e.stopPropagation(); openModal(`customer_profile_${c.id}`);}} className="text-[9px] md:text-[10px] font-bold uppercase underline text-slate-400 hover:text-indigo-600">轨迹档案</button>
                      <button onClick={(e)=>{e.stopPropagation(); setFormState({...formState, amount:'', itemName:'', note:''}); openModal(`consume_${c.id}`);}} className="text-[9px] md:text-[10px] font-bold uppercase underline text-indigo-600">结算</button>
                      <button onClick={(e)=>{e.stopPropagation(); setFormState({...formState, amount:''}); openModal(`recharge_${c.id}`);}} className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400 hover:text-slate-900">充值</button>
                      <button onClick={(e)=>{e.stopPropagation(); setFormState({...formState, cardPromoId:'', cardAmount:''}); openModal(`add_card_${c.id}`);}} className="text-[9px] md:text-[10px] font-bold uppercase text-purple-600 hover:text-purple-800">办卡</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border shadow-sm flex items-center justify-between">
                <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">职员档案与权限</h3>
                <button onClick={()=>{setEditingTarget(null); setFormState({...formState, staffName:'', staffRole:'', staffPass:'', staffPermissions: ['dashboard', 'appts', 'customers']}); setIsModalOpen('new_staff');}} className="px-4 md:px-6 py-2.5 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] shadow-lg uppercase tracking-widest transition-all hover:bg-indigo-700">入职登记</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {staff.map(s=>(
                  <div key={s.id} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border shadow-sm flex items-center gap-3 md:gap-4 hover:scale-[1.03] transition-all group">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-indigo-600 border uppercase transition-colors group-hover:bg-indigo-600 group-hover:text-white text-xs md:text-base">{s.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-xs md:text-sm truncate">{s.name}</div>
                      <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase truncate tracking-tighter">{s.role}</div>
                    </div>
                    <div className="flex gap-1 md:gap-2">
                      <button onClick={()=>{setEditingTarget(s); setFormState({...formState, staffName:s.name, staffRole:s.role, staffPass:'', staffPermissions: s.permissions || ['dashboard']}); setIsModalOpen('edit_staff');}} className="p-1.5 md:p-2 text-slate-300 hover:text-indigo-600 transition-all"><Edit3 size={14} className="md:w-4 md:h-4"/></button>
                      <button onClick={()=>{if(s.id==='1')return alert('超级管理不可移除'); if(confirm('确认移除该职员？')){deleteStaff(s.id); addLog('移除职员',s.name);}}} className="p-1.5 md:p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={14} className="md:w-4 md:h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'projects' && currentUser?.permissions.includes('all') && (
            <div className="space-y-6 animate-in fade-in">
              {!selectedProjectCategory ? (
                <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">项目大类管理</h3>
                    <button 
                      onClick={()=>setIsModalOpen('new_project_category')}
                      className="px-4 md:px-6 py-2.5 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] shadow-lg uppercase tracking-widest transition-all hover:bg-indigo-700"
                    >
                      添加大类
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {projectCategories.map((cat, idx) => (
                      <div 
                        key={cat.label} 
                        onClick={()=>setSelectedProjectCategory(cat.label)}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all group border border-transparent hover:border-indigo-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg md:text-xl">
                            {idx + 1}
                          </div>
                          <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                            <button 
                              onClick={()=>{setEditingTarget({type: 'category', data: cat}); setFormState({...formState, categoryName: cat.label}); setIsModalOpen('edit_project_category');}}
                              className="p-1.5 text-slate-300 hover:text-indigo-600 transition-all"
                            >
                              <Edit3 size={14}/>
                            </button>
                            <button 
                              onClick={async()=>{
                                if(confirm(`确认删除大类"${cat.label}"？这将同时删除该大类下的所有项目！`)){
                                  const response = await api.projects.deleteCategory(cat.label);
                                  if(response.success){
                                    refetchProjects();
                                    addLog('删除项目大类', cat.label);
                                  }
                                }
                              }}
                              className="p-1.5 text-slate-300 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-sm md:text-base mb-1">{cat.label}</h4>
                        <p className="text-[10px] md:text-xs text-slate-500">{cat.items.length} 个项目</p>
                        <div className="mt-3 flex items-center text-indigo-600 text-[10px] font-bold group-hover:translate-x-1 transition-transform">
                          <span>点击管理</span>
                          <ChevronRight size={12} className="ml-1"/>
                        </div>
                      </div>
                    ))}
                  </div>
                  {projectCategories.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Tag size={48} className="mx-auto mb-4 opacity-30"/>
                      <p className="text-sm">暂无项目大类</p>
                      <p className="text-xs mt-1">点击上方按钮添加第一个大类</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={()=>setSelectedProjectCategory(null)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <ChevronLeft size={20} className="text-slate-400"/>
                      </button>
                      <div>
                        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">具体项目管理</h3>
                        <p className="text-sm md:text-base font-black text-slate-800">{selectedProjectCategory}</p>
                      </div>
                    </div>
                    <button 
                      onClick={()=>setIsModalOpen('new_project_item')}
                      className="px-4 md:px-6 py-2.5 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] shadow-lg uppercase tracking-widest transition-all hover:bg-indigo-700"
                    >
                      添加项目
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase">序号</th>
                          <th className="text-left py-3 px-4 text-[10px] font-black text-slate-400 uppercase">项目名称</th>
                          <th className="text-right py-3 px-4 text-[10px] font-black text-slate-400 uppercase">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectCategories
                          .find(c => c.label === selectedProjectCategory)
                          ?.items.map((item, idx) => (
                            <tr key={item} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <span className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-800 text-sm">{item}</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button 
                                  onClick={async()=>{
                                    if(confirm(`确认删除项目"${item}"？`)){
                                      const response = await api.projects.deleteItem(item);
                                      if(response.success){
                                        refetchProjects();
                                        addLog('删除项目', `${selectedProjectCategory} - ${item}`);
                                      }
                                    }
                                  }}
                                  className="p-2 text-slate-300 hover:text-red-500 transition-all"
                                >
                                  <Trash2 size={16}/>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {projectCategories.find(c => c.label === selectedProjectCategory)?.items.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Tag size={48} className="mx-auto mb-4 opacity-30"/>
                      <p className="text-sm">暂无具体项目</p>
                      <p className="text-xs mt-1">点击上方按钮添加第一个项目</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-4 md:space-y-6 animate-in fade-in">
              <div className="flex bg-slate-100 p-1 rounded-xl md:rounded-2xl mb-4 md:mb-6 w-full md:w-auto self-start">
                <button onClick={()=>setFinanceSubTab('daily')} className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase transition-all ${financeSubTab==='daily'?'bg-white shadow-sm text-indigo-600':'text-slate-500 hover:text-slate-700'}`}>日结账单</button>
                <button onClick={()=>setFinanceSubTab('transactions')} className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase transition-all ${financeSubTab==='transactions'?'bg-white shadow-sm text-indigo-600':'text-slate-500 hover:text-slate-700'}`}>水单记录</button>
                <button onClick={()=>setFinanceSubTab('reports')} className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase transition-all ${financeSubTab==='reports'?'bg-white shadow-sm text-indigo-600':'text-slate-500 hover:text-slate-700'}`}>多维度报表</button>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">开始日期</label>
                  <input type="date" value={financeStartDate} onChange={e => setFinanceStartDate(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">结束日期</label>
                  <input type="date" value={financeEndDate} onChange={e => setFinanceEndDate(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => {
                    const today = new Date();
                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    setFinanceStartDate(dateStr);
                    setFinanceEndDate(dateStr);
                  }} className="flex-1 md:flex-none px-4 md:px-5 py-2.5 md:py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">今日</button>
                  <button onClick={() => {
                    const today = new Date();
                    const start = new Date(today);
                    start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6); // Sunday
                    setFinanceStartDate(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`);
                    setFinanceEndDate(`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`);
                  }} className="flex-1 md:flex-none px-4 md:px-5 py-2.5 md:py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">本周</button>
                  <button onClick={() => {
                    const today = new Date();
                    const start = new Date(today.getFullYear(), today.getMonth(), 1);
                    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    setFinanceStartDate(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`);
                    setFinanceEndDate(`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`);
                  }} className="flex-1 md:flex-none px-4 md:px-5 py-2.5 md:py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">本月</button>
                </div>
              </div>

              {financeSubTab === 'daily' && (
                <div className="space-y-4 md:space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-indigo-600 p-6 rounded-2xl md:rounded-[2rem] text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -z-0"></div>
                      <div className="relative z-10">
                        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-200 mb-2">实收总额 (¥)</h3>
                        <div className="text-3xl md:text-4xl font-black">{dailySettlementData.incomeDetails.total.toLocaleString()}</div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold">
                          <div>
                            <span className="text-indigo-200">余额充值: </span>
                            <span>¥{dailySettlementData.incomeDetails.rechargeBalance.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-indigo-200">活动开卡: </span>
                            <span>¥{dailySettlementData.incomeDetails.rechargeCard.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-indigo-200">散客收入: </span>
                            <span>¥{dailySettlementData.incomeDetails.consume.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl md:rounded-[2rem] border shadow-sm">
                      <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><CreditCard size={14}/> 支付方式汇总</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm font-bold">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div>微信</div>
                          <span>¥{dailySettlementData.paymentMethods.wechat.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>支付宝</div>
                          <span>¥{dailySettlementData.paymentMethods.alipay.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-800"></div>现金</div>
                          <span>¥{dailySettlementData.paymentMethods.cash.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div>美团</div>
                          <span>¥{dailySettlementData.paymentMethods.meituan.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl md:rounded-[2rem] border shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Users size={14}/> 客流与消耗</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <div className="text-[10px] font-black text-slate-400 uppercase mb-1">新客数</div>
                            <div className="text-xl font-black text-indigo-600">{dailySettlementData.newCustomersCount}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <div className="text-[10px] font-black text-slate-400 uppercase mb-1">老客数</div>
                            <div className="text-xl font-black text-slate-800">{dailySettlementData.oldCustomersCount}</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-xl flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-[10px] font-black text-amber-600 uppercase">卡耗总额 (不计入实收)</div>
                          <div className="text-sm font-black text-amber-700">¥{dailySettlementData.incomeDetails.cardConsume.toLocaleString()}</div>
                        </div>
                        <div className="flex justify-between text-[9px] text-amber-600/80 font-bold">
                          <span>储值卡: ¥{dailySettlementData.incomeDetails.cardConsumeBalance.toLocaleString()}</span>
                          <span>活动卡: ¥{dailySettlementData.incomeDetails.cardConsumePromotion.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {financeSubTab === 'transactions' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
                    <div className="flex bg-white p-1 rounded-xl md:rounded-2xl border shadow-sm overflow-x-auto custom-scroll">
                      {[
                        {id:'all',label:'全部'},
                        {id:'income',label:'实收'},
                        {id:'recharge_balance',label:'余额充值'},
                        {id:'recharge_card',label:'活动开卡'},
                        {id:'consume_balance',label:'余额消耗'},
                        {id:'consume_card',label:'活动卡消耗'}
                      ].map(f=>(
                        <button key={f.id} onClick={()=>setActiveFinanceFilter(f.id as any)} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase whitespace-nowrap transition-all ${activeFinanceFilter===f.id?'bg-indigo-600 text-white shadow-lg':'text-slate-400 hover:text-slate-600'}`}>{f.label}</button>
                      ))}
                    </div>
                    <button onClick={handleDownloadReport} className="w-full md:w-auto px-5 md:px-6 py-2.5 md:py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 md:gap-2">
                      <Download size={14} className="md:w-4 md:h-4"/>
                      <span>下载水单</span>
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl md:rounded-[2.5rem] border shadow-sm overflow-hidden overflow-x-auto custom-scroll">
                    <table className="w-full text-left min-w-full md:min-w-[800px]">
                      <thead className="bg-slate-50 text-[9px] md:text-[10px] font-black text-slate-400 uppercase border-b"><tr className="border-b"><th className="px-0.5 md:px-6 py-2 md:py-5">单号</th><th className="px-0.5 md:px-6 py-2 md:py-5">分类</th><th className="px-0.5 md:px-6 py-2 md:py-5">姓名</th><th className="px-0.5 md:px-6 py-2 md:py-5">项目/卡项</th><th className="px-0.5 md:px-6 py-2 md:py-5">金额</th><th className="px-0.5 md:px-6 py-2 md:py-5">操作人</th><th className="px-0.5 md:px-6 py-2 md:py-5">时间</th><th className="px-0.5 md:px-6 py-2 md:py-5 text-right">操作</th></tr></thead>
                      <tbody className="divide-y text-[10px] md:text-sm">
                        {filteredTransactions.map(t=>(
                          <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors ${t.is_revoked ? 'opacity-50' : ''}`}>
                            <td className="px-0.5 md:px-6 py-1.5 md:py-5 font-mono text-[8px] md:text-[9px] text-slate-300 uppercase">
                              {t.id.slice(-6)}
                              {t.is_revoked && <span className="ml-1 text-red-500 font-bold text-[8px]">已撤销</span>}
                            </td>
                            <td className="px-0.5 md:px-6 py-1.5 md:py-5">
                              <span className={`text-[7px] md:text-[8px] font-black px-1 md:px-1.5 py-0.5 rounded uppercase ${t.type==='recharge'?(t.customer_card_id?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'):(t.payment_method==='balance'?'bg-amber-100 text-amber-700':t.payment_method==='promotion_card'?'bg-purple-100 text-purple-700':'bg-indigo-100 text-indigo-700')}`}>
                                {t.type==='recharge'?(t.customer_card_id?`开卡(${getPaymentMethodText(t.payment_method)})`:`充值(${getPaymentMethodText(t.payment_method)})`):(t.payment_method==='balance'?'卡耗':t.payment_method==='promotion_card'?`活动卡`:`实收(${getPaymentMethodText(t.payment_method)})`)}
                              </span>
                            </td>
                            <td className={`px-0.5 md:px-6 py-1.5 md:py-5 font-bold text-[9px] md:text-xs text-slate-800 truncate max-w-[50px] md:max-w-none ${t.is_revoked ? 'line-through' : ''}`}>{t.customer_name || '未知客户'}</td>
                            <td className="px-0.5 md:px-6 py-1.5 md:py-5 font-bold text-[9px] md:text-xs text-slate-600 truncate max-w-[80px] md:max-w-none">{t.item_name || t.promotion_name || '-'}</td>
                            <td className={`px-0.5 md:px-6 py-1.5 md:py-5 font-black text-[9px] md:text-sm ${t.type==='recharge'?'text-green-600':'text-slate-900'} ${t.is_revoked ? 'line-through' : ''}`}>¥{(t.amount || 0).toLocaleString()}</td>
                            <td className="px-0.5 md:px-6 py-1.5 md:py-5 font-bold text-[9px] md:text-xs text-slate-600">{staff.find(s => s.id === t.staff_id)?.name || '未知'}</td>
                            <td className="px-0.5 md:px-6 py-1.5 md:py-5 text-[8px] md:text-[10px] text-slate-400 font-bold whitespace-nowrap">{new Date(t.timestamp).toLocaleString().slice(5,16)}</td>
                            <td className="px-0.5 md:px-6 py-1.5 md:py-5 text-right">
                              {!t.is_revoked && (
                                <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 md:p-2 text-slate-300 hover:text-amber-500 transition-all" title="撤销流水">
                                  <Undo2 size={12} className="md:w-4 md:h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {financeSubTab === 'reports' && (
                <div className="space-y-4 md:space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white p-6 rounded-2xl md:rounded-[2rem] border shadow-sm hover:shadow-md transition-all group cursor-pointer">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                        <Banknote size={24} />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 mb-2">资金报表</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">详细的营业收入、支出、利润分析，支持按门店、项目、支付方式多维度统计。</p>
                      <button className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">查看报表 <ChevronRight size={12}/></button>
                    </div>
                    <div className="bg-white p-6 rounded-2xl md:rounded-[2rem] border shadow-sm hover:shadow-md transition-all group cursor-pointer">
                      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                        <UserCheck size={24} />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 mb-2">人事报表</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">员工考勤、业绩提成、服务时长统计，帮助您精准评估员工绩效。</p>
                      <button className="mt-4 text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-1">查看报表 <ChevronRight size={12}/></button>
                    </div>
                    <div className="bg-white p-6 rounded-2xl md:rounded-[2rem] border shadow-sm hover:shadow-md transition-all group cursor-pointer">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 mb-2">会员报表</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">新增会员、流失预警、会员消费频次及客单价分析，助力精准营销。</p>
                      <button className="mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">查看报表 <ChevronRight size={12}/></button>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-2xl md:rounded-[2rem] border border-dashed border-slate-200 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Sparkles size={24} className="text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-black text-slate-700 mb-2">高级报表库</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">更多多维度分析报表正在开发中，敬请期待。如需定制特定报表，请联系系统管理员。</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'promotions' && (
            <div className="space-y-4 md:space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">活动管理</h2>
                <button onClick={() => setIsModalOpen('new_promotion')} className="bg-indigo-600 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 md:gap-2">
                  <Plus size={16} className="md:w-[18px] md:h-[18px]"/>
                  <span>新建活动</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {promotions.map(promo => {
                  const memberCount = customerCards.filter(c => c.promotion_id === promo.id).length;
                  return (
                  <div key={promo.id} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -z-10 opacity-50"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-800">{promo.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">创建于 {new Date(promo.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg font-black text-xs ${promo.type === 'count' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {promo.type === 'count' ? `${promo.total_count}次` : `${(promo.discount_rate || 1) * 10}折`}
                      </div>
                    </div>
                    
                    {promo.start_date || promo.end_date ? (
                      <div className="mb-4 text-[10px] text-slate-500 font-medium bg-slate-50 p-2 rounded-lg">
                        <span className="font-bold text-slate-700">办理期限:</span><br/>
                        {promo.start_date ? new Date(promo.start_date).toLocaleDateString() : '不限'} 至 {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : '不限'}
                      </div>
                    ) : (
                      <div className="mb-4 text-[10px] text-indigo-500 font-black bg-indigo-50 p-2 rounded-lg flex items-center gap-2">
                        <Clock size={12} />
                        <span>长期有效活动</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                      <button onClick={() => setSelectedPromoId(promo.id)} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 transition-colors text-xs font-bold">
                        <Users size={14} />
                        <span>{memberCount} 位会员</span>
                      </button>
                      <button onClick={() => handleDeletePromotion(promo.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )})}
                {promotions.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 font-bold text-sm">
                    暂无活动，点击右上角新建
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] border shadow-sm overflow-hidden">
              <div className="p-2 md:p-4 border-b flex items-center gap-2 md:gap-4 bg-slate-50/50 flex-wrap">
                <div className="flex bg-slate-200/50 p-1 rounded-lg md:rounded-xl">
                  <button onClick={()=>setLogDateFilter('all')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg text-[9px] md:text-xs font-bold transition-all ${logDateFilter==='all'?'bg-white shadow-sm text-indigo-600':'text-slate-500'}`}>全部</button>
                  <button onClick={()=>setLogDateFilter('today')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg text-[9px] md:text-xs font-bold transition-all ${logDateFilter==='today'?'bg-white shadow-sm text-indigo-600':'text-slate-500'}`}>今日</button>
                  <button onClick={()=>setLogDateFilter('yesterday')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg text-[9px] md:text-xs font-bold transition-all ${logDateFilter==='yesterday'?'bg-white shadow-sm text-indigo-600':'text-slate-500'}`}>昨日</button>
                  <button onClick={()=>setLogDateFilter('custom')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md md:rounded-lg text-[9px] md:text-xs font-bold transition-all ${logDateFilter==='custom'?'bg-white shadow-sm text-indigo-600':'text-slate-500'}`}>自定义</button>
                </div>
                {logDateFilter === 'custom' && (
                  <input 
                    type="date" 
                    value={customLogDate}
                    onChange={(e) => setCustomLogDate(e.target.value)}
                    className="px-3 py-1.5 md:px-4 md:py-2 border rounded-lg text-[9px] md:text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>
              <div className="md:overflow-x-auto md:custom-scroll">
                <table className="w-full text-left md:min-w-[700px]">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b"><tr><th className="px-4 md:px-8 py-3 md:py-5">操作员</th><th className="px-4 md:px-8 py-3 md:py-5">行为</th><th className="px-4 md:px-8 py-3 md:py-5">内容</th><th className="px-4 md:px-8 py-3 md:py-5 text-right">撤销</th></tr></thead>
                  <tbody className="divide-y text-xs md:text-sm">
                    {logs.filter(l => {
                      if (logDateFilter === 'all') return true;
                      const logDate = new Date(l.timestamp).toDateString();
                      const today = new Date().toDateString();
                      const yesterday = new Date(Date.now() - 86400000).toDateString();
                      if (logDateFilter === 'today') return logDate === today;
                      if (logDateFilter === 'yesterday') return logDate === yesterday;
                      if (logDateFilter === 'custom' && customLogDate) {
                        const customDate = new Date(customLogDate).toDateString();
                        return logDate === customDate;
                      }
                      return true;
                    }).map(l=>(
                      <tr key={l.id} className={`hover:bg-slate-50/50 transition-colors ${l.is_revoked?'opacity-30 line-through':''}`}>
                        <td className="px-4 md:px-8 py-3 md:py-5 font-bold text-[10px] md:text-xs text-slate-800">{l.operator}</td>
                        <td className="px-4 md:px-8 py-3 md:py-5 font-black text-indigo-600 text-[9px] md:text-[10px] uppercase">{l.action}</td>
                        <td className="px-4 md:px-8 py-3 md:py-5 text-[10px] md:text-xs text-slate-500 font-medium">
                          {l.detail} <span className="block text-[7px] md:text-[8px] text-slate-300 mt-1">{new Date(l.timestamp).toLocaleTimeString()}</span>
                        </td>
                        <td className="px-4 md:px-8 py-3 md:py-5 text-right">
                          {l.undo_data && !l.is_revoked && (
                            <button onClick={()=>setRevokingLog(l)} className="p-1.5 md:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"><Undo2 size={14} className="md:w-4 md:h-4"/></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <nav className="md:hidden h-16 bg-white border-t flex items-center justify-around px-1 shrink-0 z-[140] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {AVAILABLE_PERMISSIONS.filter(p => currentUser?.permissions.includes('all') || currentUser?.permissions.includes(p.id)).map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 transition-all w-14 ${activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>

      {(isModalOpen || revokingLog || selectedAppt || confirmReminderId || selectedPromoId || customConfirm || customAlert) && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => { 
            if(!revokingLog && !isModalOpen?.startsWith('consume_') && !confirmReminderId && !customConfirm && !customAlert) { 
              setIsModalOpen(null); 
              setEditingTarget(null); 
            } 
            setSelectedAppt(null); 
            setSelectedPromoId(null);
            setIsVoidingAppt(false);
            setConfirmReminderId(null);
            if (customConfirm) setCustomConfirm(null);
            if (customAlert) setCustomAlert(null);
          }}></div>
          <div onClick={(e) => e.stopPropagation()} className="relative z-10 bg-white w-full max-w-lg h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[3rem] p-5 md:p-10 shadow-2xl overflow-y-auto custom-scroll animate-in slide-in-from-bottom-10 md:zoom-in-95 text-slate-900">
            <button 
              onClick={() => { 
                closeModal(); 
                setEditingTarget(null); 
                setSelectedAppt(null); 
                setIsVoidingAppt(false);
                setConfirmReminderId(null);
                setSelectedPromoId(null);
              }} 
              className="absolute top-4 left-4 md:top-6 md:right-6 md:left-auto p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-20"
            >
              <div className="md:hidden flex items-center gap-1 text-slate-600 font-bold">
                <ChevronLeft size={20} />
                <span className="text-sm">返回</span>
              </div>
              <div className="hidden md:block">
                <X size={20} />
              </div>
            </button>
            <div className="md:hidden h-8"></div>
            
            {selectedPromoId && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b pb-4 gap-4">
                  <h3 className="text-xl font-black text-slate-800">活动卡会员列表</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="搜索会员姓名/手机号" 
                      value={formState.promoMemberSearch || ''} 
                      onChange={e => setFormState({...formState, promoMemberSearch: e.target.value})}
                      className="w-full md:w-64 pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-400"
                    />
                  </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto custom-scroll pr-2 space-y-3">
                  {(() => {
                    const promoCards = customerCards.filter(c => c.promotion_id === selectedPromoId);
                    if (promoCards.length === 0) {
                      return <div className="text-center py-8 text-slate-400 font-bold text-sm">暂无会员办理此卡</div>;
                    }

                    // 按会员分组
                    const groupedCards = promoCards.reduce((acc, card) => {
                      if (!acc[card.customer_id]) acc[card.customer_id] = [];
                      acc[card.customer_id].push(card);
                      return acc;
                    }, {} as Record<string, CustomerCard[]>);

                    const search = (formState.promoMemberSearch || '').toLowerCase();
                    const filteredEntries = Object.entries(groupedCards).filter(([customerId]) => {
                      if (!search) return true;
                      const cust = customers.find(c => c.id === customerId);
                      return cust?.name.toLowerCase().includes(search) || cust?.phone.includes(search);
                    });

                    if (filteredEntries.length === 0) {
                      return <div className="text-center py-8 text-slate-400 font-bold text-sm">未找到匹配会员</div>;
                    }

                    return filteredEntries.map(([customerId, cardsArray]) => {
                      const cards = cardsArray as CustomerCard[];
                      const cust = customers.find(c => c.id === customerId);
                      const promo = promotions.find(p => p.id === selectedPromoId);
                      
                      // 该会员在该活动下的所有充值记录
                      const rechargeTrans = transactions.filter(t => 
                        t.type === 'recharge' && 
                        !t.is_revoked &&
                        t.customer_id === customerId && 
                        (cards.some(c => c.id === t.customer_card_id) || (promo && t.item_name?.includes(promo.name)))
                      );
                      const totalRecharge = rechargeTrans.reduce((sum, t) => sum + (t.amount || 0), 0);
                      const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);

                      return (
                        <div key={customerId} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <span className="font-black text-slate-800 text-sm">{cust?.name || '未知会员'}</span>
                            <div className="text-xs text-right">
                              <div className="text-slate-500 font-medium">累计充值: <span className="font-bold text-indigo-600">¥{totalRecharge.toLocaleString()}</span></div>
                              <div className="text-slate-500 font-medium mt-0.5">总余额: <span className="font-bold text-emerald-600">¥{totalBalance.toLocaleString()}</span></div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {cards.map((card) => {
                              // 查找该次办卡对应的充值记录（通过 cardId 或 时间相近匹配）
                              const cardTrans = rechargeTrans.filter(t => 
                                t.customer_card_id === card.id || 
                                (promo && t.item_name?.includes(promo.name) && Math.abs(new Date(t.timestamp).getTime() - new Date(card.created_at).getTime()) < 60000)
                              );
                              const cardRecharge = cardTrans.reduce((sum, t) => sum + (t.amount || 0), 0);
                              
                              return (
                                <div key={card.id} className="flex justify-between items-center text-[10px] md:text-xs bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-slate-400 font-bold">{new Date(card.created_at).toLocaleDateString()}</span>
                                  <div className="flex gap-3 md:gap-4">
                                    <span className="text-slate-500">单次充值: <span className="font-bold text-indigo-500">¥{cardRecharge > 0 ? cardRecharge.toLocaleString() : '-'}</span></span>
                                    <span className="text-slate-500">余额: <span className="font-bold text-emerald-500">¥{card.balance.toLocaleString()}</span></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {confirmReminderId && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">确认已提醒？</h3>
                  <p className="text-slate-500 text-sm">
                    确认后，该生日提醒将被标记为已处理，不再显示在提醒列表中。
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setConfirmReminderId(null)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      completeReminder(confirmReminderId);
                      setConfirmReminderId(null);
                    }}
                    className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 font-medium transition-colors shadow-sm shadow-amber-500/20"
                  >
                    确认已提醒
                  </button>
                </div>
              </div>
            )}

            {/* 员工新增/编辑弹窗 */}
            {(isModalOpen === 'new_staff' || isModalOpen === 'edit_staff') && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase text-center tracking-widest">{editingTarget ? '职员档案调整' : '职员入职登记'}</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">职员姓名 *</label>
                    <input value={formState.staffName} onChange={e=>setFormState({...formState, staffName: e.target.value})} placeholder="输入姓名" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">职能角色 *</label>
                    <select value={formState.staffRole} onChange={e=>setFormState({...formState, staffRole: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm border-2 border-transparent focus:border-indigo-400 outline-none text-slate-900">
                      <option value="">选择角色...</option>
                      <option value="店长">店长</option>
                      <option value="技术总监">技术总监</option>
                      <option value="高级技师">高级技师</option>
                      <option value="普通技师">普通技师</option>
                      <option value="前台顾问">前台顾问</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">登录密码 {editingTarget ? '(留空不修改)' : '*'}</label>
                    <input type="password" value={formState.staffPass} onChange={e=>setFormState({...formState, staffPass: e.target.value})} placeholder="设置安全密码" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">账号权限 *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl md:rounded-2xl">
                      {AVAILABLE_PERMISSIONS.map(perm => (
                        <button
                          key={perm.id}
                          onClick={() => {
                            const current = formState.staffPermissions || [];
                            const next = current.includes(perm.id)
                              ? current.filter((id: string) => id !== perm.id)
                              : [...current, perm.id];
                            setFormState({...formState, staffPermissions: next});
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg text-[10px] font-bold transition-all ${
                            (formState.staffPermissions || []).includes(perm.id)
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <perm.icon size={12} />
                          <span>{perm.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={handleSaveStaff} className="w-full py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg tracking-widest active:scale-95 transition-all">保存档案记录</button>
              </div>
            )}

            {/* 项目大类新增弹窗 */}
            {isModalOpen === 'new_project_category' && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase text-center tracking-widest">添加项目大类</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">大类名称 *</label>
                    <input 
                      value={formState.categoryName || ''} 
                      onChange={e=>setFormState({...formState, categoryName: e.target.value})} 
                      placeholder="例如：美甲、美睫、美容等" 
                      className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" 
                    />
                  </div>
                </div>
                <button 
                  onClick={async()=>{
                    if(!formState.categoryName?.trim()){
                      setCustomAlert({message: '请输入大类名称'});
                      return;
                    }
                    setIsSubmitting(true);
                    const response = await createCategory({name: formState.categoryName.trim()});
                    setIsSubmitting(false);
                    if(response.success){
                      closeModal();
                      addLog('新增项目大类', formState.categoryName.trim());
                      setFormState({...formState, categoryName: ''});
                    }else{
                      setCustomAlert({message: response.error || '添加失败'});
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg tracking-widest active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : '保存'}
                </button>
              </div>
            )}

            {/* 项目大类编辑弹窗 */}
            {isModalOpen === 'edit_project_category' && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase text-center tracking-widest">编辑项目大类</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">大类名称 *</label>
                    <input 
                      value={formState.categoryName || ''} 
                      onChange={e=>setFormState({...formState, categoryName: e.target.value})} 
                      placeholder="大类名称" 
                      className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" 
                    />
                  </div>
                </div>
                <button 
                  onClick={async()=>{
                    if(!formState.categoryName?.trim()){
                      setCustomAlert({message: '请输入大类名称'});
                      return;
                    }
                    setIsSubmitting(true);
                    const oldName = editingTarget?.data?.label;
                    const response = await updateCategory(oldName, {name: formState.categoryName.trim()});
                    setIsSubmitting(false);
                    if(response.success){
                      closeModal();
                      addLog('编辑项目大类', `${oldName} -> ${formState.categoryName.trim()}`);
                      setFormState({...formState, categoryName: ''});
                    }else{
                      setCustomAlert({message: response.error || '保存失败'});
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg tracking-widest active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : '保存'}
                </button>
              </div>
            )}

            {/* 具体项目新增弹窗 */}
            {isModalOpen === 'new_project_item' && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase text-center tracking-widest">添加具体项目</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">所属大类 *</label>
                    <select 
                      value={formState.itemCategory || selectedProjectCategory || ''} 
                      onChange={e=>setFormState({...formState, itemCategory: e.target.value})} 
                      className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900"
                    >
                      <option value="">选择大类...</option>
                      {projectCategories.map(cat => (
                        <option key={cat.label} value={cat.label}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">项目名称 *</label>
                    <input 
                      value={formState.itemName || ''} 
                      onChange={e=>setFormState({...formState, itemName: e.target.value})} 
                      placeholder="例如：建构、单色、猫眼等" 
                      className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" 
                    />
                  </div>
                </div>
                <button 
                  onClick={async()=>{
                    const category = formState.itemCategory || selectedProjectCategory;
                    if(!category){
                      setCustomAlert({message: '请选择所属大类'});
                      return;
                    }
                    if(!formState.itemName?.trim()){
                      setCustomAlert({message: '请输入项目名称'});
                      return;
                    }
                    setIsSubmitting(true);
                    const response = await createItem({
                      category_id: category,
                      name: formState.itemName.trim()
                    });
                    setIsSubmitting(false);
                    if(response.success){
                      closeModal();
                      addLog('新增项目', `${category} - ${formState.itemName.trim()}`);
                      setFormState({...formState, itemCategory: '', itemName: ''});
                    }else{
                      setCustomAlert({message: response.error || '添加失败'});
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg tracking-widest active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : '保存'}
                </button>
              </div>
            )}

            {isModalOpen === 'new_promotion' && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase text-center tracking-widest">新建活动</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">活动名称 *</label>
                    <input value={formState.promoName} onChange={e=>setFormState({...formState, promoName: e.target.value})} placeholder="活动名称" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">活动类型 *</label>
                    <select value={formState.promoType || 'discount'} onChange={e=>setFormState({...formState, promoType: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900">
                      <option value="discount">折扣充值卡</option>
                      <option value="count">自定义项目次卡</option>
                    </select>
                  </div>
                  {(!formState.promoType || formState.promoType === 'discount') && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">折扣率 (0-1之间) *</label>
                      <input type="number" step="0.01" min="0.01" max="1" value={formState.promoDiscount} onChange={e=>setFormState({...formState, promoDiscount: e.target.value})} placeholder="0.8 代表 8折" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                    </div>
                  )}
                  {formState.promoType === 'count' && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">总次数 *</label>
                      <input type="number" min="1" step="1" value={formState.promoTotalCount || ''} onChange={e=>setFormState({...formState, promoTotalCount: e.target.value})} placeholder="输入总次数" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">活动有效期 *</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setFormState({...formState, promoIsPermanent: true})} 
                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${formState.promoIsPermanent ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
                      >
                        长期活动
                      </button>
                      <button 
                        onClick={() => setFormState({...formState, promoIsPermanent: false})} 
                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${!formState.promoIsPermanent ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
                      >
                        限期活动
                      </button>
                    </div>
                  </div>
                  {!formState.promoIsPermanent && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">开始时间</label>
                        <input type="date" value={formState.promoStartDate} onChange={e=>setFormState({...formState, promoStartDate: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">结束时间</label>
                        <input type="date" value={formState.promoEndDate} onChange={e=>setFormState({...formState, promoEndDate: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={handleAddPromotion} className="w-full py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg tracking-widest active:scale-95 transition-all">创建活动</button>
              </div>
            )}

            {/* 会员录入/编辑弹窗 */}
            {(isModalOpen === 'new_customer' || isModalOpen === 'edit_customer') && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-center relative">
                  {editingTarget && 'phone' in editingTarget && (
                    <button 
                      onClick={() => {
                        const customerBalance = (editingTarget as Customer)?.balance || 0;
                        const confirmMsg = customerBalance > 0 
                          ? `确认删除该会员？会员余额 ¥${customerBalance} 将退款，此操作不可撤销！`
                          : '确认删除该会员？此操作不可撤销！';
                        showConfirm(confirmMsg, async () => {
                          if (customerBalance > 0) {
                            await createTransaction({
                              type: 'refund',
                              customer_id: (editingTarget as Customer).id,
                              customer_name: (editingTarget as Customer).name,
                              amount: customerBalance,
                              payment_method: 'balance',
                              item_name: '会员退卡退款',
                              staff_id: currentUser?.id,
                            });
                            await addLog('会员退款', `${(editingTarget as Customer).name} 退款 ¥${customerBalance}`);
                          }
                          await deleteCustomer((editingTarget as Customer).id);
                          await addLog('删除会员', (editingTarget as Customer).name);
                          closeModal();
                          setEditingTarget(null);
                        }, '删除会员');
                      }} 
                      className="absolute right-0 md:left-0 md:right-auto p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="删除会员"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase text-center tracking-widest">{editingTarget && 'phone' in editingTarget ? '编辑会员资料' : '尊贵会员录入'}</h3>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">会员姓名 *</label>
                      <input value={formState.custName} onChange={e=>setFormState({...formState, custName: e.target.value})} placeholder="输入姓名" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">联系手机 *</label>
                      <input value={formState.custPhone} onChange={e=>setFormState({...formState, custPhone: e.target.value})} placeholder="手机号" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">性别</label>
                      <select value={formState.custGender} onChange={e=>setFormState({...formState, custGender: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900">
                        <option value="female">女</option>
                        <option value="male">男</option>
                        <option value="other">其他</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">生日</label>
                      <div className="flex gap-1 md:gap-2">
                        <select 
                          value={formState.custBirthday ? formState.custBirthday.split('-')[0] : ''} 
                          onChange={e => {
                            const parts = (formState.custBirthday || '1990-01-01').split('-');
                            setFormState({...formState, custBirthday: `${e.target.value}-${parts[1]}-${parts[2]}`});
                          }}
                          className="flex-1 p-2 md:p-3 bg-slate-50 rounded-xl font-bold text-[10px] md:text-xs outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900"
                        >
                          <option value="">年</option>
                          {Array.from({length: 80}).map((_, i) => {
                            const year = new Date().getFullYear() - i;
                            return <option key={year} value={year}>{year}</option>;
                          })}
                        </select>
                        <select 
                          value={formState.custBirthday ? formState.custBirthday.split('-')[1] : ''} 
                          onChange={e => {
                            const parts = (formState.custBirthday || '1990-01-01').split('-');
                            setFormState({...formState, custBirthday: `${parts[0]}-${e.target.value}-${parts[2]}`});
                          }}
                          className="w-16 md:w-20 p-2 md:p-3 bg-slate-50 rounded-xl font-bold text-[10px] md:text-xs outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900"
                        >
                          <option value="">月</option>
                          {Array.from({length: 12}).map((_, i) => {
                            const month = (i + 1).toString().padStart(2, '0');
                            return <option key={month} value={month}>{month}</option>;
                          })}
                        </select>
                        <select 
                          value={formState.custBirthday ? formState.custBirthday.split('-')[2] : ''} 
                          onChange={e => {
                            const parts = (formState.custBirthday || '1990-01-01').split('-');
                            setFormState({...formState, custBirthday: `${parts[0]}-${parts[1]}-${e.target.value}`});
                          }}
                          className="w-16 md:w-20 p-2 md:p-3 bg-slate-50 rounded-xl font-bold text-[10px] md:text-xs outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900"
                        >
                          <option value="">日</option>
                          {Array.from({length: 31}).map((_, i) => {
                            const day = (i + 1).toString().padStart(2, '0');
                            return <option key={day} value={day}>{day}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">来源渠道</label>
                      <select value={formState.custSource} onChange={e=>setFormState({...formState, custSource: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900">
                        <option value="">选择来源...</option>
                        <option value="老客介绍">老客介绍</option>
                        <option value="小红书">小红书</option>
                        <option value="美团">美团</option>
                        <option value="大众点评">大众点评</option>
                        <option value="抖音">抖音</option>
                        <option value="路过">路过</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    {(!editingTarget || !('phone' in editingTarget)) && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">初始充值 (¥)</label>
                        <input type="number" value={formState.amount} onChange={e=>setFormState({...formState, amount: e.target.value})} placeholder="0.00" className="w-full p-3 md:p-4 bg-indigo-50/50 rounded-xl md:rounded-2xl font-black text-indigo-600 border-2 border-transparent focus:border-indigo-400 outline-none" />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">专属标签 (逗号分隔)</label>
                      <input value={formState.custTags} onChange={e=>setFormState({...formState, custTags: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">专属客服</label>
                      <select value={formState.custAssignedStaffId} onChange={e=>setFormState({...formState, custAssignedStaffId: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900">
                        <option value="">未分配</option>
                        {staff.filter(s => s.id !== '1').map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">备注信息</label>
                    <input value={formState.custRemarks} onChange={e=>setFormState({...formState, custRemarks: e.target.value})} placeholder="对某产品过敏" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                  </div>
                </div>
                <button onClick={handleSaveCustomer} disabled={isSubmitting} className="w-full py-3 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg tracking-widest active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {isSubmitting ? '处理中...' : (editingTarget && 'phone' in editingTarget ? '保存修改' : '确认录入系统')}
                </button>
              </div>
            )}

            {isModalOpen?.startsWith('add_card_') && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase text-center tracking-widest">办理活动卡</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">选择活动 *</label>
                    <select value={formState.cardPromoId} onChange={e=>setFormState({...formState, cardPromoId: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900">
                      <option value="">请选择活动...</option>
                      {promotions.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type === 'count' ? `${p.total_count}次` : `${(p.discount_rate || 1) * 10}折`})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">
                      {promotions.find(p => p.id === formState.cardPromoId)?.type === 'count' ? '购买金额 (¥) *' : '充值金额 (¥) *'}
                    </label>
                    <input type="number" value={formState.cardAmount} onChange={e=>setFormState({...formState, cardAmount: e.target.value})} placeholder="0.00" className="w-full p-3 md:p-4 bg-indigo-50/50 rounded-xl md:rounded-2xl font-black text-indigo-600 border-2 border-transparent focus:border-indigo-400 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">支付方式 *</label>
                      <select value={formState.cardPaymentMethod} onChange={e=>setFormState({...formState, cardPaymentMethod: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900">
                        <option value="wechat">微信</option>
                        <option value="alipay">支付宝</option>
                        <option value="cash">现金</option>
                        <option value="meituan">美团</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">经办员工 *</label>
                      <select value={formState.cardStaffId} onChange={e=>setFormState({...formState, cardStaffId: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900">
                        <option value="">请选择员工...</option>
                        {scheduleStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleAddCustomerCard(isModalOpen.split('_')[2])} disabled={isSubmitting} className="w-full py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg tracking-widest active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {isSubmitting ? '处理中...' : '确认办理'}
                </button>
              </div>
            )}

            {/* 充值弹窗 */}
            {isModalOpen?.startsWith('recharge_') && (
              <div className="space-y-4 md:space-y-6 text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-green-50 rounded-xl md:rounded-2xl flex items-center justify-center text-green-600 mx-auto shadow-inner"><Wallet size={20} className="md:w-6 md:h-6"/></div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-widest">会员充值</h3>
                <div className="p-4 md:p-5 bg-slate-50 rounded-2xl md:rounded-3xl text-left border">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">正在为会员充值</p>
                  <p className="text-base md:text-lg font-bold text-slate-800">{customers.find(c=>c.id===isModalOpen.split('_')[1])?.name}</p>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">充值金额 (¥) *</label>
                  <input value={formState.amount} onChange={e=>setFormState({...formState, amount: e.target.value})} type="number" placeholder="0.00" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-black text-lg md:text-xl text-slate-900 outline-none border-2 border-transparent focus:border-indigo-400" />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">经办人</label>
                  <select value={formState.rechargeStaffId} onChange={e=>setFormState({...formState, rechargeStaffId: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900">
                    <option value="">默认 (当前登录)</option>
                    {staff.filter(s => s.id !== '1').map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                  </select>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">支付方式 *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cash', label: '现金', color: 'bg-slate-900' },
                      { id: 'wechat', label: '微信', color: 'bg-green-600' },
                      { id: 'alipay', label: '支付宝', color: 'bg-blue-600' },
                      { id: 'meituan', label: '美团', color: 'bg-orange-500' }
                    ].map(m => (
                      <button 
                        key={m.id}
                        onClick={() => handleRecharge(isModalOpen.split('_')[1], formState.amount, m.id as any)}
                        disabled={isSubmitting}
                        className={`py-3 rounded-xl font-black text-[10px] uppercase text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${m.color}`}
                      >
                        {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isModalOpen?.startsWith('customer_actions_') && (() => {
               const custId = isModalOpen.split('_')[2];
               const c = customers.find(x => x.id === custId);
               if (!c) return null;
               return (
                 <div className="space-y-4">
                   <div className="text-center pb-4 border-b">
                     <h3 className="text-xl font-black text-slate-900">{c.name}</h3>
                     <p className="text-sm text-slate-500 font-bold mt-1">{c.phone}</p>
                     <p className="text-lg font-black text-indigo-600 mt-2">¥{(c.balance || 0).toLocaleString()}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={()=>{setEditingTarget(c as any); setFormState({...formState, custName:c.name, custPhone:c.phone, custRemarks:c.remarks, custGender:c.gender||'female', custBirthday:c.birthday||'', custSource:c.source||'', custTags:(c.tags||[]).join(', '), custAssignedStaffId: c.assigned_staff_id || '', amount:''}); openModal('new_customer');}} className="p-4 bg-slate-50 rounded-xl font-bold text-slate-700 flex flex-col items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all">
                       <Edit3 size={20} className="text-slate-400"/> 编辑资料
                     </button>
                     <button onClick={()=>openModal(`customer_profile_${c.id}`)} className="p-4 bg-slate-50 rounded-xl font-bold text-slate-700 flex flex-col items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all">
                       <HistoryIcon size={20} className="text-indigo-400"/> 轨迹档案
                     </button>
                     <button onClick={()=>{setFormState({...formState, amount:'', itemName:'', note:''}); openModal(`consume_${c.id}`);}} className="p-4 bg-slate-50 rounded-xl font-bold text-slate-700 flex flex-col items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all">
                       <ReceiptText size={20} className="text-amber-500"/> 结算
                     </button>
                     <button onClick={()=>{setFormState({...formState, amount:''}); openModal(`recharge_${c.id}`);}} className="p-4 bg-slate-50 rounded-xl font-bold text-slate-700 flex flex-col items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all">
                       <Wallet size={20} className="text-green-500"/> 充值
                     </button>
                     <button onClick={()=>{setFormState({...formState, cardPromoId:'', cardAmount:''}); openModal(`add_card_${c.id}`);}} className="p-4 bg-slate-50 rounded-xl font-bold text-slate-700 flex flex-col items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all col-span-2">
                       <Sparkles size={20} className="text-purple-500"/> 办卡
                     </button>
                   </div>
                 </div>
               );
            })()}

            {isModalOpen?.startsWith('customer_profile_') && (() => {
               const custId = isModalOpen.split('_')[2];
               const cust = customers.find(c => c.id === custId);
               if (!cust) return null;
               const histTrans = transactions.filter(t => t.customer_id === custId).sort((a,b)=>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
               return (
                  <div className="space-y-6 md:space-y-8">
                     <div className="flex justify-between items-start">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 text-xl md:text-2xl font-black shadow-inner">{cust.name[0]}</div>
                         <button onClick={()=>{setEditingTarget(cust as any); setFormState({...formState, custName:cust.name, custPhone:cust.phone, custRemarks:cust.remarks, custGender:cust.gender||'female', custBirthday:cust.birthday||'', custSource:cust.source||'', custTags:(cust.tags||[]).join(', '), custAssignedStaffId: cust.assigned_staff_id || '', amount:''}); openModal('new_customer');}} className="hidden md:flex p-2 md:p-3 bg-slate-50 rounded-lg md:rounded-xl text-slate-400 hover:text-indigo-600 transition-all active:scale-90 items-center gap-2 font-bold text-xs"><Edit3 size={16}/> 编辑</button>
                     </div>
                                           <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{cust.name}</h3>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase">余额: ¥{(cust.balance || 0).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-400 font-bold mt-1 tracking-widest text-xs md:text-sm italic">{cust.phone}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">性别</p>
                          <p className="text-xs font-bold text-slate-700">{cust.gender === 'male' ? '男' : cust.gender === 'female' ? '女' : '其他'}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">生日</p>
                          <p className="text-xs font-bold text-slate-700">{cust.birthday || '未设置'}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">来源渠道</p>
                          <p className="text-xs font-bold text-slate-700">{cust.source || '未知'}</p>
                        </div>
                      </div>

                      {cust.tags && cust.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {cust.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-100">{tag}</span>
                          ))}
                        </div>
                      )}
                     
                     {cust.remarks && (
                       <div className="bg-amber-50 border border-amber-100 p-3 md:p-4 rounded-xl md:rounded-2xl">
                         <h4 className="font-black uppercase tracking-widest text-[9px] md:text-[10px] text-amber-600 flex items-center gap-2 mb-1.5 md:mb-2"><MessageSquareText size={12} className="md:w-3.5 md:h-3.5"/> 会员备注</h4>
                         <p className="text-[10px] md:text-xs text-amber-800 font-medium leading-relaxed whitespace-pre-wrap">{cust.remarks}</p>
                       </div>
                     )}

                     <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t">
                        <h4 className="font-black uppercase tracking-widest text-[9px] md:text-[10px] text-purple-600 flex items-center gap-2"><Sparkles size={12} className="md:w-3.5 md:h-3.5"/> 活动卡包 ({getAvailableCards(custId).length})</h4>
                        {getAvailableCards(custId).length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                             {getAvailableCards(custId).map(card => (
                                <div key={card.id} className="p-3 md:p-4 bg-purple-50 border border-purple-100 rounded-xl md:rounded-2xl flex justify-between items-center text-[10px] md:text-xs">
                                   <div className="truncate pr-2">
                                     <p className="font-bold text-purple-900 truncate">{card.displayText.split(' - ')[0]}</p>
                                     <p className="text-[9px] md:text-[10px] text-purple-500 font-bold mt-0.5">
                                       {card.type === 'count' 
                                         ? `剩余: ${(card.total_count || 0) - (card.used_count || 0)}次 / 共${card.total_count || 0}次` 
                                         : `剩余: ¥${(card.balance || 0).toLocaleString()}`}
                                     </p>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <div className="bg-purple-200 text-purple-800 px-2 py-1 rounded font-black text-[9px]">
                                       {card.type === 'count' ? '次卡' : `${(card.discount_rate || 1) * 10}折`}
                                     </div>
                                     <button 
                                       onClick={() => {
                                         const refundAmount = card.type === 'count' ? 0 : (card.balance || 0);
                                         const cardName = card.displayText.split(' - ')[0];
                                         showConfirm(
                                           card.type === 'count' 
                                             ? '确认退卡？次卡退卡后剩余次数作废，不予退款。' 
                                             : `确认退卡？储值卡余额 ¥${refundAmount} 将作废，不予退款。`,
                                           async () => {
                                             const result = await deleteCustomerCard(card.id);
                                             if (result.success) {
                                               await createTransaction({
                                                 type: 'consume',
                                                 customer_id: custId,
                                                 customer_name: customers.find(c => c.id === custId)?.name || '未知',
                                                 amount: 0,
                                                 payment_method: 'promotion_card',
                                                 item_name: `退卡: ${cardName}${refundAmount > 0 ? ` (余额¥${refundAmount}作废)` : ''}`,
                                                 staff_id: currentUser?.id,
                                               });
                                               await addLog('退卡', `${customers.find(c => c.id === custId)?.name} - ${cardName}${refundAmount > 0 ? ` (余额¥${refundAmount}作废)` : ''}`);
                                               await refetchCustomerCards();
                                               showAlert('退卡成功', 'success');
                                             } else {
                                               showAlert('退卡失败：' + (result.error || '未知错误'));
                                             }
                                           },
                                           '退卡'
                                         );
                                       }}
                                       className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                       title="退卡"
                                     >
                                       <Trash2 size={14} />
                                     </button>
                                   </div>
                                </div>
                             ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl flex flex-col items-center justify-center text-center">
                            <Sparkles size={20} className="text-slate-300 mb-2" />
                            <p className="text-[10px] md:text-xs font-bold text-slate-400">暂无活动卡</p>
                            <button onClick={() => { openModal(`add_card_${custId}`); setFormState({...formState, cardPromoId: '', cardAmount: ''}); }} className="mt-2 text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                              立即办理
                            </button>
                          </div>
                        )}
                     </div>

                     <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t">
                        <h4 className="font-black uppercase tracking-widest text-[9px] md:text-[10px] text-indigo-600 flex items-center gap-2"><HistoryIcon size={12} className="md:w-3.5 md:h-3.5"/> 消费轨迹 ({histTrans.length})</h4>
                        <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto custom-scroll pr-1">
                           {histTrans.length > 0 ? histTrans.map(t=>(
                              <div key={t.id} className={`p-3 md:p-4 bg-white border border-slate-100 rounded-xl md:rounded-2xl flex justify-between items-center text-[10px] md:text-xs ${t.is_revoked ? 'opacity-50' : ''}`}>
                                 <div className="truncate pr-2">
                                    <p className={`font-bold text-slate-800 truncate ${t.is_revoked ? 'line-through' : ''}`}>
                                      {t.item_name}
                                      {t.is_revoked && <span className="ml-2 text-[8px] text-red-500 bg-red-50 px-1 py-0.5 rounded">已撤销</span>}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <p className="text-[9px] md:text-[10px] text-slate-300 font-bold">{new Date(t.timestamp).toLocaleDateString()}</p>
                                      {t.staff_id && (
                                        <span className="text-[8px] md:text-[9px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded font-bold">服务: {staff.find(s => s.id === t.staff_id)?.name || '未知'}</span>
                                      )}
                                      <span className={`text-[7px] md:text-[8px] font-black px-1 md:px-1.5 py-0.5 rounded uppercase ${t.type==='recharge'?'bg-blue-100 text-blue-700':(t.payment_method==='balance'?'bg-amber-100 text-amber-700':t.payment_method==='promotion_card'?'bg-purple-100 text-purple-700':'bg-indigo-100 text-indigo-700')}`}>
                                        {t.type==='recharge'?`充值(${getPaymentMethodText(t.payment_method)})`:(t.payment_method==='balance'?'卡耗':t.payment_method==='promotion_card'?`活动卡(${t.promotion_name || '未知'})`:`实收(${getPaymentMethodText(t.payment_method)})`)}
                                      </span>
                                    </div>
                                  </div>
                                 <div className="text-right shrink-0">
                                   <p className={`font-black ${t.is_revoked ? 'line-through text-slate-400' : (t.type==='recharge'?'text-green-600':'text-slate-900')}`}>{t.type==='recharge'?'+':'-'}¥{t.amount}</p>
                                   {t.payment_method === 'promotion_card' && t.original_amount && (
                                     <p className="text-[8px] text-slate-400 line-through">原价: ¥{t.original_amount}</p>
                                   )}
                                 </div>
                              </div>
                           )) : <p className="text-center py-6 md:py-8 text-slate-300 font-bold italic">暂无流水记录</p>}
                        </div>
                     </div>

                     {/* Mobile Bottom Menu */}
                     <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around py-2 px-2 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                        <button onClick={()=>{setEditingTarget(cust as any); setFormState({...formState, custName:cust.name, custPhone:cust.phone, custRemarks:cust.remarks, custGender:cust.gender||'female', custBirthday:cust.birthday||'', custSource:cust.source||'', custTags:(cust.tags||[]).join(', '), custAssignedStaffId: cust.assigned_staff_id || '', amount:''}); openModal('new_customer');}} className="flex flex-col items-center gap-1 text-slate-500">
                          <Edit3 size={16} />
                          <span className="text-[8px] font-black uppercase">编辑</span>
                        </button>
                        <button onClick={() => {}} className="flex flex-col items-center gap-1 text-indigo-600">
                          <HistoryIcon size={16} />
                          <span className="text-[8px] font-black uppercase">档案</span>
                        </button>
                        <button onClick={()=>{setFormState({...formState, amount:'', itemName:'', note:''}); openModal(`consume_${cust.id}`);}} className="flex flex-col items-center gap-1 text-slate-500">
                          <ReceiptText size={16} />
                          <span className="text-[8px] font-black uppercase">结算</span>
                        </button>
                        <button onClick={()=>{setFormState({...formState, amount:''}); openModal(`recharge_${cust.id}`);}} className="flex flex-col items-center gap-1 text-slate-500">
                          <Wallet size={16} />
                          <span className="text-[8px] font-black uppercase">充值</span>
                        </button>
                        <button onClick={()=>{setFormState({...formState, cardPromoId:'', cardAmount:''}); openModal(`add_card_${cust.id}`);}} className="flex flex-col items-center gap-1 text-slate-500">
                          <Sparkles size={16} />
                          <span className="text-[8px] font-black uppercase">办卡</span>
                        </button>
                     </div>
                  </div>
               );
            })()}

            {isModalOpen?.startsWith('consume_') && (() => {
               const custId = isModalOpen.split('_')[1];
               const customer = customers.find(c => c.id === custId);
               const amount = parseFloat(formState.amount) || 0;
               let isInsufficient = amount > (customer?.balance || 0);
               let actualAmount = amount;
               let isCountCard = false;
               
               if (formState.cardId) {
                 const card = customerCards.find(c => c.id === formState.cardId);
                 const promo = promotions.find(p => p.id === card?.promotion_id);
                 if (card && promo) {
                   if (promo.type === 'count') {
                     isCountCard = true;
                     actualAmount = amount;
                     isInsufficient = actualAmount > ((card.total_count || 0) - (card.used_count || 0));
                   } else {
                     actualAmount = amount * (promo.discount_rate || 1);
                     isInsufficient = actualAmount > (card.balance || 0);
                   }
                 }
               }
               
               const apptId = isModalOpen.split('_')[3];

               return (
               <div className="space-y-4 md:space-y-6 text-center">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 mx-auto shadow-inner"><ReceiptText size={20} className="md:w-6 md:h-6"/></div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-widest">单据结算</h3>
                  
                  <div className="p-4 md:p-5 bg-slate-50 rounded-2xl md:rounded-3xl text-left border flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-1">正在核算客户</p>
                      <p className="text-base md:text-lg font-bold text-slate-800">{customer?.name}</p>
                    </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{formState.cardId ? (isCountCard ? '活动卡剩余次数' : '活动卡余额') : '当前余额'}</p>
                        <p className={`text-base md:text-lg font-black ${isInsufficient ? 'text-red-500' : 'text-indigo-600'}`}>
                          {formState.cardId ? (isCountCard ? `${(customerCards.find(c => c.id === formState.cardId)?.total_count || 0) - (customerCards.find(c => c.id === formState.cardId)?.used_count || 0)}次` : `¥${(customerCards.find(c => c.id === formState.cardId)?.balance || 0).toLocaleString()}`) : `¥${(customer?.balance || 0).toLocaleString()}`}
                        </p>
                        {formState.cardId && !isCountCard && amount > 0 && (
                          <div className="mt-1 flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 line-through">原价: ¥{amount.toLocaleString()}</span>
                            <span className="text-[10px] font-black text-purple-600">折后: ¥{actualAmount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                  </div>

                  {isInsufficient && amount > 0 && !formState.cardId && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex flex-col gap-2 text-left animate-in slide-in-from-top-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-red-700">余额不足</p>
                          <p className="text-[10px] text-red-500 mt-0.5">当前余额不足以支付本次消费，请充值或使用现金收款。</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="number" 
                          placeholder="输入充值金额" 
                          id="quick-recharge-input"
                          className="flex-1 p-2 bg-white rounded-lg text-xs font-bold border border-red-200 focus:border-red-400 outline-none"
                        />
                        <button 
                          onClick={async () => {
                            const input = document.getElementById('quick-recharge-input') as HTMLInputElement;
                            if (input && input.value) {
                              const rechargeAmount = parseFloat(input.value);
                              if (!isNaN(rechargeAmount) && rechargeAmount > 0) {
                                await apiUpdateBalance(custId, rechargeAmount, 'add');
                                await createTransaction({
                                  type: 'recharge',
                                  customer_id: custId,
                                  customer_name: customer?.name || '未知',
                                  amount: rechargeAmount,
                                  payment_method: 'cash',
                                  item_name: '充值',
                                  staff_id: currentUser?.id,
                                });
                                await addLog('充值', `${customer?.name} 充值 ¥${rechargeAmount}`);
                                input.value = '';
                              }
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase active:scale-95 transition-all"
                        >
                          立即充值
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1 text-left">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-2">消费金额 *</label>
                       <input type="number" value={formState.amount} onChange={e=>setFormState({...formState, amount: e.target.value})} placeholder="输入金额" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-black text-xs md:text-sm text-indigo-600 outline-none border-2 border-transparent focus:border-indigo-400" />
                    </div>
                    <div className="space-y-1 text-left">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-2">项目大类 *</label>
                       <select 
                         value={formState.itemCategory} 
                         onChange={e=>setFormState({...formState, itemCategory: e.target.value, itemName: ''})} 
                         className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-slate-900 outline-none border-2 border-transparent focus:border-indigo-400"
                       >
                         <option value="">选择大类...</option>
                         {projectCategories.map(cat => (
                           <option key={cat.label} value={cat.label}>{cat.label}</option>
                         ))}
                       </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:gap-4">
                    <div className="space-y-1 text-left">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-2">具体项目 *</label>
                       <select 
                         value={formState.itemName} 
                         onChange={e=>setFormState({...formState, itemName: e.target.value})} 
                         disabled={!formState.itemCategory}
                         className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-slate-900 outline-none border-2 border-transparent focus:border-indigo-400 disabled:opacity-50"
                       >
                         <option value="">选择项目...</option>
                         {projectCategories.find(c => c.label === formState.itemCategory)?.items.map(item => (
                           <option key={item} value={item}>{item}</option>
                         ))}
                       </select>
                    </div>
                  </div>
                  <div className="space-y-1 text-left">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-2">业务备注</label>
                     <input value={formState.note} onChange={e=>setFormState({...formState, note: e.target.value})} placeholder="添加核销备注 (选填)" className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-slate-900 outline-none border-2 border-transparent focus:border-indigo-400" />
                  </div>
                  {getAvailableCards(custId).length > 0 && (
                    <div className="space-y-1 text-left">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-2">使用活动卡</label>
                       <select value={formState.cardId || ''} onChange={e=>setFormState({...formState, cardId: e.target.value})} className="w-full p-3 md:p-4 bg-purple-50 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm text-purple-900 outline-none border-2 border-transparent focus:border-purple-400">
                         <option value="">不使用活动卡</option>
                         {getAvailableCards(custId).map(card => (
                           <option key={card.id} value={card.id}>{card.displayText}</option>
                         ))}
                       </select>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 md:gap-4 pt-2 md:pt-4">
                    {formState.cardId ? (
                      <button 
                        onClick={() => handleConsume(custId, formState.amount, formState.itemName, 'promotion_card', apptId, formState.cardId)} 
                        disabled={isInsufficient && amount > 0} 
                        className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg transition-all ${isInsufficient && amount > 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-purple-600 text-white shadow-purple-200 active:scale-95'}`}
                      >
                        活动卡划扣
                      </button>
                    ) : (
                      <>
                        <div className="flex gap-3 md:gap-4">
                          <button onClick={()=>handleConsume(custId, formState.amount, formState.itemName, 'balance', apptId)} disabled={isInsufficient && amount > 0} className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg transition-all ${isInsufficient && amount > 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white shadow-indigo-100 active:scale-95'}`}>余额核销</button>
                          <button onClick={()=>handleConsume(custId, formState.amount, formState.itemName, 'cash', apptId)} className="flex-1 py-3 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg active:scale-95 transition-all">现金收款</button>
                        </div>
                        <div className="flex gap-3 md:gap-4">
                          <button onClick={()=>handleConsume(custId, formState.amount, formState.itemName, 'wechat', apptId)} className="flex-1 py-3 md:py-4 bg-green-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg active:scale-95 transition-all">微信</button>
                          <button onClick={()=>handleConsume(custId, formState.amount, formState.itemName, 'alipay', apptId)} className="flex-1 py-3 md:py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg active:scale-95 transition-all">支付宝</button>
                          <button onClick={()=>handleConsume(custId, formState.amount, formState.itemName, 'meituan', apptId)} className="flex-1 py-3 md:py-4 bg-orange-500 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg active:scale-95 transition-all">美团</button>
                        </div>
                      </>
                    )}
                  </div>
               </div>
               );
            })()}

            {isModalOpen === 'new_appt' && (
               <div className="space-y-3 md:space-y-4">
                 <h3 className="text-base md:text-lg font-black text-slate-800 uppercase text-center tracking-widest">预约中心</h3>
                 <div className="flex p-0.5 bg-slate-100 rounded-lg md:rounded-xl">
                    <button onClick={()=>setIsQuickAddCustomer(false)} className={`flex-1 py-1.5 md:py-2 rounded-md md:rounded-lg text-[8px] md:text-[9px] font-black uppercase transition-all ${!isQuickAddCustomer?'bg-white shadow-sm text-indigo-600':'text-slate-400'}`}>常客库</button>
                    <button onClick={()=>setIsQuickAddCustomer(true)} className={`flex-1 py-1.5 md:py-2 rounded-md md:rounded-lg text-[8px] md:text-[9px] font-black uppercase transition-all ${isQuickAddCustomer?'bg-white shadow-sm text-indigo-600':'text-slate-400'}`}>极速录入</button>
                 </div>
                 <div className="space-y-2 md:space-y-3">
                    {isQuickAddCustomer ? (
                      <div className="grid grid-cols-2 gap-2 md:gap-3 animate-in slide-in-from-top-2">
                        <input value={formState.custName} onChange={e=>setFormState({...formState, custName: e.target.value})} placeholder="新客姓名 *" className="w-full p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                        <input value={formState.custPhone} onChange={e=>setFormState({...formState, custPhone: e.target.value})} placeholder="联系手机 *" className="w-full p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                        <div className="col-span-2"><input value={formState.amount} onChange={e=>setFormState({...formState, amount: e.target.value})} type="number" placeholder="初始充值金额 (选填)" className="w-full p-2.5 md:p-3 bg-indigo-50/50 rounded-lg md:rounded-xl font-black text-indigo-600 border-2 border-transparent focus:border-indigo-400 outline-none text-[10px] md:text-xs" /></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {!formState.apptCustId ? (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input 
                                value={formState.custSearch || ''} 
                                onChange={e=>setFormState({...formState, custSearch: e.target.value})}
                                placeholder="搜索会员姓名或手机号..." 
                                className="w-full pl-9 p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" 
                              />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-lg md:rounded-xl max-h-40 overflow-y-auto custom-scroll shadow-inner">
                              {(formState.custSearch 
                                ? customers.filter(c => c.name.toLowerCase().includes((formState.custSearch || '').toLowerCase()) || (c.phone || '').includes(formState.custSearch || ''))
                                : customers
                              ).map(c => (
                                <div 
                                  key={c.id} 
                                  className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer text-[10px] font-bold text-slate-800 flex justify-between items-center border-b last:border-0 border-slate-50 transition-colors"
                                  onClick={() => setFormState({...formState, custSearch: c.name, apptCustId: c.id})}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[8px] text-slate-500">{c.name[0]}</div>
                                    <span>{c.name}</span>
                                  </div>
                                  <span className="text-[8px] text-slate-400 font-normal">{c.phone}</span>
                                </div>
                              ))}
                              {customers.length === 0 && (
                                <div className="px-3 py-6 text-center text-[10px] text-slate-400 font-bold">会员库暂无数据</div>
                              )}
                              {customers.length > 0 && formState.custSearch && customers.filter(c => c.name.toLowerCase().includes((formState.custSearch || '').toLowerCase()) || (c.phone || '').includes(formState.custSearch || '')).length === 0 && (
                                <div className="px-3 py-6 text-center text-[10px] text-slate-400 font-bold">未找到匹配会员</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="px-3 py-3 bg-indigo-50 text-indigo-700 rounded-lg md:rounded-xl text-[10px] font-bold flex items-center justify-between border border-indigo-100 animate-in zoom-in-95">
                            <div className="flex items-center gap-2">
                              <UserCheck size={14} className="text-indigo-500" />
                              <span>已选择会员: <span className="text-indigo-900">{customers.find(c => c.id === formState.apptCustId)?.name}</span></span>
                            </div>
                            <button onClick={() => setFormState({...formState, apptCustId: '', custSearch: ''})} className="text-indigo-400 hover:text-indigo-600 p-1 hover:bg-indigo-100 rounded-full transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">预约日期 *</label>
                      <input type="date" value={formState.apptDate} onChange={e=>setFormState({...formState, apptDate: e.target.value})} className="w-full p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">开始时间 *</label>
                        <select value={formState.apptStartTime} onChange={e=>setFormState({...formState, apptStartTime: e.target.value, apptEndTime: (parseFloat(e.target.value) + 0.5).toString()})} className="w-full p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs border-2 border-transparent focus:border-indigo-400 outline-none text-slate-900">
                          {Array.from({length:29}).map((_,i)=>{
                            const val = i * 0.5 + 8;
                            const h = Math.floor(val);
                            const m = (val % 1) * 60;
                            const label = `${h}:${m === 0 ? '00' : m}`;
                            return <option key={i} value={val}>{label}</option>
                          })}
                        </select>
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">结束时间 *</label>
                        <select value={formState.apptEndTime} onChange={e=>setFormState({...formState, apptEndTime: e.target.value})} className="w-full p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs border-2 border-transparent focus:border-indigo-400 outline-none text-slate-900">
                          {Array.from({length:30}).map((_,i)=>{
                            const val = i * 0.5 + 8;
                            const h = Math.floor(val);
                            const m = (val % 1) * 60;
                            const label = `${h}:${m === 0 ? '00' : m}`;
                            return (
                              <option key={i} value={val} disabled={val <= parseFloat(formState.apptStartTime)}>{label}</option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">指派技师 *</label>
                      <select value={formState.apptStaffId} onChange={e=>setFormState({...formState, apptStaffId: e.target.value})} className="w-full p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs border-2 border-transparent focus:border-indigo-400 outline-none text-slate-900">
                        <option value="">选择技师...</option>
                        {scheduleStaff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">项目大类 *</label>
                        <select 
                          value={formState.apptCategory} 
                          onChange={e=>setFormState({...formState, apptCategory: e.target.value, apptProject: ''})} 
                          className="w-full p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs border-2 border-transparent focus:border-indigo-400 outline-none text-slate-900"
                        >
                          <option value="">选择大类...</option>
                          {projectCategories.map(cat => (
                            <option key={cat.label} value={cat.label}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">具体项目 *</label>
                        <select 
                          value={formState.apptProject} 
                          onChange={e=>setFormState({...formState, apptProject: e.target.value})} 
                          disabled={!formState.apptCategory}
                          className="w-full p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs border-2 border-transparent focus:border-indigo-400 outline-none text-slate-900 disabled:opacity-50"
                        >
                          <option value="">选择项目...</option>
                          {projectCategories.find(c => c.label === formState.apptCategory)?.items.map(item => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">预约备注 (选填)</label>
                      <input value={formState.apptNote || ''} onChange={e=>setFormState({...formState, apptNote: e.target.value})} placeholder="输入预约备注" className="w-full p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs outline-none border-2 border-transparent focus:border-indigo-400 text-slate-900" />
                    </div>
                 </div>
                 <button onClick={async ()=>{
                    let finalCustId = formState.apptCustId;
                    let finalCustName = customers.find(c=>c.id===finalCustId)?.name || '';
                    if(isQuickAddCustomer){
                      if(!formState.custName || !formState.custPhone) return showAlert('提示', '请补全会员资料');
                      const custResponse = await createCustomer({name: formState.custName, phone: formState.custPhone, balance: 0, remarks: ''});
                      if (custResponse.success && custResponse.data) {
                        finalCustId = custResponse.data.id;
                        finalCustName = custResponse.data.name;
                        await addLog('录入会员', finalCustName);
                        if(parseFloat(formState.amount)>0) await handleRecharge(finalCustId, formState.amount, 'cash', finalCustName);
                      }
                    }
                    const startH = parseFloat(formState.apptStartTime);
                    const endH = parseFloat(formState.apptEndTime);
                    if(finalCustId && formState.apptStaffId && formState.apptProject && endH > startH){
                      const [y, m, d] = formState.apptDate.split('-').map(Number);
                      const apptDateTime = new Date(y, m - 1, d, startH);
                      const duration = endH - startH;
                      
                      const conflictCheck = await checkAppointmentConflicts({
                        staff_id: formState.apptStaffId,
                        start_time: apptDateTime.toISOString(),
                        duration: duration
                      });
                      
                      if (conflictCheck.success && conflictCheck.data?.hasConflicts) {
                        const conflictList = conflictCheck.data.conflicts.map(c => 
                          `${c.customer_name} (${formatTime(c.start_hour)}-${formatTime(c.start_hour + c.duration)})`
                        ).join('、');
                        const staffName = staff.find(s => s.id === formState.apptStaffId)?.name || '该员工';
                        return showAlert('预约时间冲突', `${staffName}在该时间段已有预约：${conflictList}，请调整时间或更换员工。`);
                      }
                      
                      await createAppointment({
                        customer_id: finalCustId,
                        customer_name: finalCustName,
                        staff_id: formState.apptStaffId,
                        project_name: formState.apptProject,
                        start_time: apptDateTime.toISOString(),
                        start_hour: startH,
                        duration: duration,
                        status: 'confirmed',
                        note: formState.apptNote
                      });
                      closeModal(); await addLog('新增预约', `${finalCustName} - ${formState.apptProject} (${formatTime(startH)})`);
                      setFormState({...formState, apptCategory: '', apptProject: '', apptNote: '', custSearch: '', apptCustId: ''});
                    } else {
                      showAlert('提示', '请补全预约信息，并确保结束时间晚于开始时间');
                    }
                  }} className="w-full py-2.5 md:py-3 bg-indigo-600 text-white rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase shadow-lg tracking-widest active:scale-95 transition-all">发布任务指令</button>
               </div>
            )}

            {selectedAppt && !revokingLog && (
               <div className="space-y-6 md:space-y-8 animate-in fade-in">
                  {!isVoidingAppt ? (
                    <>
                      <div className="flex justify-between items-start">
                         <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><Clock size={20} className="md:w-6 md:h-6"/></div>
                         <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${selectedAppt.status==='confirmed'?'bg-indigo-100 text-indigo-600':selectedAppt.status==='completed'?'bg-green-100 text-green-600':'bg-slate-100 text-slate-600'}`}>
                            {selectedAppt.status === 'confirmed' ? '已确认' : selectedAppt.status === 'completed' ? '已完成' : '已取消'}
                         </span>
                      </div>
                      <div>
                         <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{selectedAppt.customer_name}</h4>
                         <p className="text-xs md:text-sm font-bold text-indigo-500 uppercase tracking-widest mt-1 italic">{selectedAppt.project_name}</p>
                         <div className="mt-3 md:mt-4 space-y-2">
                           <p className="text-[10px] md:text-xs text-slate-500 font-bold flex items-center gap-2"><Calendar size={12} className="md:w-3.5 md:h-3.5"/> 时间: <span className="text-slate-800 font-bold">{new Date(selectedAppt.start_time).toLocaleDateString()} {formatTime(selectedAppt.start_hour)} - {formatTime(selectedAppt.start_hour + selectedAppt.duration)}</span></p>
                           <p className="text-[10px] md:text-xs text-slate-500 font-bold flex items-center gap-2"><User size={12} className="md:w-3.5 md:h-3.5"/> 技师: <span className="text-slate-800 font-bold">{staff.find(s=>s.id===selectedAppt.staff_id)?.name}</span></p>
                           {selectedAppt.note && <p className="text-[10px] md:text-xs text-slate-500 font-bold flex items-start gap-2"><MessageSquareText size={12} className="md:w-3.5 md:h-3.5 shrink-0 mt-0.5"/> 备注: <span className="text-slate-800 font-bold">{selectedAppt.note}</span></p>}
                         </div>
                      </div>
                      <div className="space-y-2 md:space-y-3">
                         {selectedAppt.status==='confirmed' && (
                           <button 
                             onClick={()=>{
                               const category = projectCategories.find(cat => cat.items.includes(selectedAppt.project_name))?.label || '';
                               setFormState({
                                 ...formState, 
                                 itemCategory: category,
                                 itemName: selectedAppt.project_name, 
                                 amount: '',
                                 cardId: '',
                                 note: ''
                               }); 
                               openModal(`consume_${selectedAppt.customer_id}_appt_${selectedAppt.id}`); 
                               setSelectedAppt(null);
                             }} 
                             className="w-full py-3 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg active:scale-95 transition-all"
                           >
                             完工结算指令
                           </button>
                         )}
                         {selectedAppt.status==='completed' && (
                           <div className="w-full py-3 md:py-4 bg-green-100 text-green-700 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase text-center flex items-center justify-center gap-2 border border-green-200">
                             <CheckCircle size={16} className="md:w-5 md:h-5"/>
                             <span>已完成结算</span>
                           </div>
                         )}
                         
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsVoidingAppt(true);
                            }} 
                            className="w-full py-3 md:py-4 bg-red-50 text-red-600 font-black text-[10px] md:text-xs uppercase rounded-xl md:rounded-2xl hover:bg-red-100 transition-all cursor-pointer active:scale-95 border border-red-200 flex items-center justify-center gap-2"
                          >
                            <Trash2 size={14} className="md:w-4 md:h-4"/>
                            <span>作废并删除预约单</span>
                          </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 md:py-6 text-center space-y-4 md:space-y-6 animate-in zoom-in-95">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto border-4 border-white shadow-xl shadow-red-100/50">
                        <AlertTriangle size={32} className="md:w-10 md:h-10 animate-pulse"/>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl md:text-2xl font-black text-slate-900">确认作废删除？</h3>
                        <p className="text-xs md:text-sm text-slate-500 font-bold leading-relaxed px-2 md:px-4">
                          您正在尝试彻底删除 <span className="text-red-600 underline decoration-2 underline-offset-4">{selectedAppt.customer_name}</span> 的预约单。此操作将从排班表中永久移除，且无法撤销。
                        </p>
                      </div>
                      <div className="flex gap-3 md:gap-4 pt-2 md:pt-4">
                        <button 
                          onClick={() => setIsVoidingAppt(false)} 
                          className="flex-1 py-3 md:py-4 bg-slate-100 text-slate-500 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase hover:bg-slate-200 transition-all active:scale-95"
                        >
                          返回
                        </button>
                        <button 
                          onClick={() => handleVoidAppt(selectedAppt)} 
                          className="flex-1 py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                        >
                          确认作废
                        </button>
                      </div>
                    </div>
                  )}
               </div>
            )}

            {revokingLog && (
               <div className="space-y-4 md:space-y-6 text-center animate-in zoom-in-95">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto"><AlertTriangle size={24} className="md:w-7 md:h-7"/></div>
                  <div><h3 className="text-lg md:text-xl font-black text-slate-900 mb-1 md:mb-2">确认撤销流水？</h3><p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4 md:px-8">撤销后对应的财务与预约状态将强制回滚，请谨慎操作。</p></div>
                  <div className="flex gap-3 md:gap-4">
                    <button 
                      onClick={()=>setRevokingLog(null)} 
                      disabled={isSubmitting}
                      className="flex-1 py-3 md:py-4 bg-slate-50 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase text-slate-400 disabled:opacity-50"
                    >放弃</button>
                    <button 
                      onClick={handleRevokeConfirm} 
                      disabled={isSubmitting}
                      className="flex-1 py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      {isSubmitting ? '处理中...' : '立即执行'}
                    </button>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {customAlert && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
              <Info size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">{customAlert.title}</h3>
              <p className="text-sm text-slate-500 font-bold mt-2 whitespace-pre-wrap">{customAlert.message}</p>
            </div>
            <button onClick={() => setCustomAlert(null)} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
              我知道了
            </button>
          </div>
        </div>
      )}

      {customConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">{customConfirm.title}</h3>
              <p className="text-sm text-slate-500 font-bold mt-2 whitespace-pre-wrap">{customConfirm.message}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { if(!isConfirmLoading) setCustomConfirm(null); }} disabled={isConfirmLoading} className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase transition-all disabled:opacity-50">
                取消
              </button>
              <button 
                onClick={async () => {
                  if (isConfirmLoading) return;
                  setIsConfirmLoading(true);
                  try {
                    await customConfirm.onConfirm();
                  } catch (error) {
                    console.error('操作失败:', error);
                  }
                  setIsConfirmLoading(false);
                  setCustomConfirm(null);
                }} 
                disabled={isConfirmLoading}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConfirmLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {isConfirmLoading ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
