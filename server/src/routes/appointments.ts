import { Router, Request, Response } from 'express';
import dualWriteService from '../services/dualWriteService.js';
import { Appointment, ApiResponse } from '../types/index.js';

const router = Router();

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

export default router;
