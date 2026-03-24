import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { memoryStore } from '../services/memoryStore.js';
import { StaffReminder, ApiResponse } from '../types/index.js';

const router = Router();
const useMemory = !supabase;

router.get('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      return res.json({ success: true, data: memoryStore.getReminders() } as ApiResponse<StaffReminder[]>);
    }
    const { staff_id, status, type } = req.query;
    let query = supabase.from('staff_reminders').select('*').order('reminder_date', { ascending: true });

    if (staff_id) query = query.eq('staff_id', staff_id);
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data } as ApiResponse<StaffReminder[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.createReminder(req.body);
      return res.status(201).json({ success: true, data, message: '提醒创建成功' } as ApiResponse<StaffReminder>);
    }
    const reminderData: Partial<StaffReminder> = {
      ...req.body,
      status: req.body.status || 'pending',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('staff_reminders').upsert([reminderData]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data, message: '提醒创建成功' } as ApiResponse<StaffReminder>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
