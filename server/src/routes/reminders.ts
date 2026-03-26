import { Router, Request, Response } from 'express';
import dualWriteService from '../services/dualWriteService.js';
import { StaffReminder, ApiResponse } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { staff_id, status, type } = req.query;
    const filters: any = {};
    
    if (staff_id) filters.staff_id = staff_id as string;
    if (status) filters.status = status as string;
    if (type) filters.type = type as string;
    
    const data = await dualWriteService.reminders.getAll(filters);
    res.json({ success: true, data } as ApiResponse<StaffReminder[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.reminders.create(req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.status(201).json({ success: true, data: result.data, message: '提醒创建成功' } as ApiResponse<StaffReminder>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
