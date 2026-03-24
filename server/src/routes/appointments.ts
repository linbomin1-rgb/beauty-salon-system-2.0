import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { memoryStore } from '../services/memoryStore.js';
import { Appointment, ApiResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const useMemory = !supabase;

router.get('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      return res.json({ success: true, data: memoryStore.getAppointments() } as ApiResponse<Appointment[]>);
    }
    const { date, staff_id, status, start_date, end_date } = req.query;
    let query = supabase
      .from('appointments')
      .select('*')
      .order('start_time', { ascending: true });

    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);
      query = query.gte('start_time', startDate.toISOString()).lte('start_time', endDate.toISOString());
    }

    if (start_date && end_date) {
      query = query.gte('start_time', start_date as string).lte('start_time', end_date as string);
    }

    if (staff_id) {
      query = query.eq('staff_id', staff_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ success: true, data } as ApiResponse<Appointment[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.createAppointment(req.body);
      return res.status(201).json({ success: true, data, message: '预约创建成功' } as ApiResponse<Appointment>);
    }
    const appointmentData: Partial<Appointment> = {
      id: uuidv4(),
      ...req.body,
      status: req.body.status || 'pending',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data, message: '预约创建成功' } as ApiResponse<Appointment>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.updateAppointment(req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
      }
      return res.json({ success: true, data, message: '预约更新成功' } as ApiResponse<Appointment>);
    }
    const { data, error } = await supabase
      .from('appointments')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
    }
    res.json({ success: true, data, message: '预约更新成功' } as ApiResponse<Appointment>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const success = memoryStore.deleteAppointment(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
      }
      return res.json({ success: true, message: '预约删除成功' } as ApiResponse<null>);
    }
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: '预约删除成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
