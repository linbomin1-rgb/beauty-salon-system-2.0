import { Router, Request, Response } from 'express';
import dualWriteService from '../services/dualWriteService.js';
import { Promotion, ApiResponse } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await dualWriteService.promotions.getAll();
    res.json({ success: true, data } as ApiResponse<Promotion[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.promotions.create(req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.status(201).json({ success: true, data: result.data, message: '活动创建成功' } as ApiResponse<Promotion>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.promotions.update(req.params.id, req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.json({ success: true, data: result.data, message: '活动更新成功' } as ApiResponse<Promotion>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.promotions.delete(req.params.id);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.json({ success: true, message: '活动删除成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
