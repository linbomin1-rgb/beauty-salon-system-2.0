import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { memoryStore } from '../services/memoryStore.js';
import { SystemLog, ApiResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const useMemory = !supabase;

router.get('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      return res.json({ success: true, data: memoryStore.getLogs() } as ApiResponse<SystemLog[]>);
    }
    const { operator, action, start_date, end_date, limit } = req.query;
    let query = supabase.from('system_logs').select('*').order('timestamp', { ascending: false });

    if (operator) query = query.eq('operator', operator);
    if (action) query = query.eq('action', action);
    if (start_date) query = query.gte('timestamp', start_date as string);
    if (end_date) query = query.lte('timestamp', end_date as string);
    if (limit) query = query.limit(parseInt(limit as string));

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data } as ApiResponse<SystemLog[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.createLog(req.body);
      return res.status(201).json({ success: true, data, message: '日志创建成功' } as ApiResponse<SystemLog>);
    }
    const logData: Partial<SystemLog> = {
      id: uuidv4(),
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString(),
      is_revoked: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('system_logs').insert([logData]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data, message: '日志创建成功' } as ApiResponse<SystemLog>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
