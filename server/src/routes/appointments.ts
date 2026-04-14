import { Router, Request, Response } from 'express';
import dualWriteService from '../services/dualWriteService.js';
import { Appointment, ApiResponse } from '../types/index.js';

const router = Router();

router.post('/check-conflicts', async (req: Request, res: Response) => {
  try {
    const { staff_id, start_time, start_hour, duration, exclude_id } = req.body;
    
    if (!staff_id || duration === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数',
        conflicts: [] 
      } as ApiResponse<any>);
    }

    let dateStr: string;
    let newStartHour: number;
    
    if (start_time) {
      const startDate = new Date(start_time);
      dateStr = startDate.toISOString().split('T')[0];
      newStartHour = start_hour !== undefined ? start_hour : startDate.getHours() + startDate.getMinutes() / 60;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: '缺少start_time参数',
        conflicts: [] 
      } as ApiResponse<any>);
    }
    
    const newEndHour = newStartHour + duration;

    const allAppointments = await dualWriteService.appointments.getAll({ date: dateStr });
    
    const staffAppointments = allAppointments.filter(a => 
      a.staff_id === staff_id && 
      a.status !== 'cancelled' &&
      a.status !== 'completed' &&
      a.id !== exclude_id
    );

    const conflicts: Appointment[] = [];
    
    for (const appt of staffAppointments) {
      const apptStartHour = appt.start_hour;
      const apptEndHour = appt.start_hour + appt.duration;
      
      if (newStartHour < apptEndHour && newEndHour > apptStartHour) {
        conflicts.push(appt);
      }
    }

    res.json({ 
      success: true, 
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts: conflicts
      }
    } as ApiResponse<any>);
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      conflicts: [] 
    } as ApiResponse<any>);
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { date, staff_id, status, start_date, end_date } = req.query;
    const filters: any = {};
    
    if (date) filters.date = date as string;
    if (staff_id) filters.staff_id = staff_id as string;
    if (status) filters.status = status as string;
    
    const data = await dualWriteService.appointments.getAll(filters);
    res.json({ success: true, data } as ApiResponse<Appointment[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.appointments.create(req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.status(201).json({ success: true, data: result.data, message: '预约创建成功' } as ApiResponse<Appointment>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.appointments.update(req.params.id, req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    if (!result.data) {
      return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
    }
    res.json({ success: true, data: result.data, message: '预约更新成功' } as ApiResponse<Appointment>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.appointments.delete(req.params.id);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.json({ success: true, message: '预约删除成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const result = await dualWriteService.appointments.update(req.params.id, { status });
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    if (!result.data) {
      return res.status(404).json({ success: false, error: '预约不存在' } as ApiResponse<null>);
    }
    res.json({ success: true, data: result.data, message: '状态更新成功' } as ApiResponse<Appointment>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
