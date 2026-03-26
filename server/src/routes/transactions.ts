import { Router, Request, Response } from 'express';
import dualWriteService from '../services/dualWriteService.js';
import { Transaction, ApiResponse } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, customer_id, staff_id, start_date, end_date, payment_method } = req.query;
    const filters: any = {};
    
    if (type) filters.type = type;
    if (customer_id) filters.customer_id = customer_id;
    if (staff_id) filters.staff_id = staff_id;
    
    const data = await dualWriteService.transactions.getAll(filters);
    res.json({ success: true, data } as ApiResponse<Transaction[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.transactions.create(req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.status(201).json({ success: true, data: result.data, message: '交易创建成功' } as ApiResponse<Transaction>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
