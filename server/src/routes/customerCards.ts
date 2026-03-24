import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { memoryStore } from '../services/memoryStore.js';
import { CustomerCard, ApiResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const useMemory = !supabase;

router.get('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      return res.json({ success: true, data: memoryStore.getCustomerCards() } as ApiResponse<CustomerCard[]>);
    }
    const { customer_id, promotion_id } = req.query;
    let query = supabase.from('customer_cards').select('*').order('created_at', { ascending: false });

    if (customer_id) query = query.eq('customer_id', customer_id);
    if (promotion_id) query = query.eq('promotion_id', promotion_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data } as ApiResponse<CustomerCard[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.createCustomerCard(req.body);
      return res.status(201).json({ success: true, data, message: '活动卡创建成功' } as ApiResponse<CustomerCard>);
    }
    const cardData: Partial<CustomerCard> = {
      id: uuidv4(),
      ...req.body,
      used_count: 0,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('customer_cards').insert([cardData]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data, message: '活动卡创建成功' } as ApiResponse<CustomerCard>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
