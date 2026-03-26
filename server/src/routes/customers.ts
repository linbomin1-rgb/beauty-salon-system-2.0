import { Router, Request, Response } from 'express';
import dualWriteService from '../services/dualWriteService.js';
import { Customer, ApiResponse } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await dualWriteService.customers.getAll();
    res.json({ success: true, data } as ApiResponse<Customer[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await dualWriteService.customers.getById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, error: '顾客不存在' } as ApiResponse<null>);
    }
    res.json({ success: true, data } as ApiResponse<Customer>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.customers.create(req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.status(201).json({ success: true, data: result.data, message: '顾客创建成功' } as ApiResponse<Customer>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.customers.update(req.params.id, req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    if (!result.data) {
      return res.status(404).json({ success: false, error: '顾客不存在' } as ApiResponse<null>);
    }
    res.json({ success: true, data: result.data, message: '顾客更新成功' } as ApiResponse<Customer>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.customers.delete(req.params.id);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.json({ success: true, message: '顾客删除成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
