import { Router, Request, Response } from 'express';
import dualWriteService from '../services/dualWriteService.js';
import { SystemLog, ApiResponse } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { operator, action, start_date, end_date, limit } = req.query;
    const filters: any = {};
    
    if (operator) filters.operator = operator;
    if (action) filters.action = action;
    
    const data = await dualWriteService.logs.getAll(filters);
    res.json({ success: true, data } as ApiResponse<SystemLog[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.logs.create(req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.status(201).json({ success: true, data: result.data, message: '日志创建成功' } as ApiResponse<SystemLog>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/:id/revoke', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.logs.revoke(req.params.id);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.json({ success: true, message: '日志撤销成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
