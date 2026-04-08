import { Router, Request, Response } from 'express';
import dualWriteService from '../services/dualWriteService.js';
import { CustomerCard, ApiResponse } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { customer_id, promotion_id } = req.query;
    const filters: any = {};
    
    if (customer_id) filters.customer_id = customer_id as string;
    if (promotion_id) filters.promotion_id = promotion_id as string;
    
    const data = await dualWriteService.customerCards.getAll(filters);
    res.json({ success: true, data } as ApiResponse<CustomerCard[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.customerCards.create(req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.status(201).json({ success: true, data: result.data, message: '活动卡创建成功' } as ApiResponse<CustomerCard>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.customerCards.update(req.params.id, req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.json({ success: true, data: result.data, message: '活动卡更新成功' } as ApiResponse<CustomerCard>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.customerCards.delete(req.params.id);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.json({ success: true, message: '活动卡删除成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
