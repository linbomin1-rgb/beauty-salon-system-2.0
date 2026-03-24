import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { memoryStore } from '../services/memoryStore.js';
import { Transaction, ApiResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const useMemory = !supabase;

router.get('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      return res.json({ success: true, data: memoryStore.getTransactions() } as ApiResponse<Transaction[]>);
    }
    const { type, customer_id, staff_id, start_date, end_date, payment_method } = req.query;
    let query = supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false });

    if (type) query = query.eq('type', type);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (staff_id) query = query.eq('staff_id', staff_id);
    if (payment_method) query = query.eq('payment_method', payment_method);
    if (start_date) query = query.gte('timestamp', start_date as string);
    if (end_date) query = query.lte('timestamp', end_date as string);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data } as ApiResponse<Transaction[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.createTransaction(req.body);
      return res.status(201).json({ success: true, data, message: '交易创建成功' } as ApiResponse<Transaction>);
    }
    const transactionData: Partial<Transaction> = {
      id: uuidv4(),
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString(),
      is_revoked: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data, message: '交易创建成功' } as ApiResponse<Transaction>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
