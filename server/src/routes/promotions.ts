import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { memoryStore } from '../services/memoryStore.js';
import { Promotion, ApiResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const useMemory = !supabase;

router.get('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      return res.json({ success: true, data: memoryStore.getPromotions() } as ApiResponse<Promotion[]>);
    }
    const { active } = req.query;
    let query = supabase.from('promotions').select('*').order('created_at', { ascending: false });

    if (active === 'true') {
      const now = new Date().toISOString().split('T')[0];
      query = query.or(`end_date.is.null,end_date.gte.${now}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data } as ApiResponse<Promotion[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.createPromotion(req.body);
      return res.status(201).json({ success: true, data, message: '活动创建成功' } as ApiResponse<Promotion>);
    }
    const promotionData: Partial<Promotion> = {
      id: uuidv4(),
      ...req.body,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('promotions').insert([promotionData]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data, message: '活动创建成功' } as ApiResponse<Promotion>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
