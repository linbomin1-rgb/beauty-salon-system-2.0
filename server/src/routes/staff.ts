import { Router, Request, Response } from 'express';
import dualWriteService from '../services/dualWriteService.js';
import { Staff, ApiResponse } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await dualWriteService.staff.getAll();
    res.json({ success: true, data } as ApiResponse<Staff[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await dualWriteService.staff.getById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, error: '员工不存在' } as ApiResponse<null>);
    }
    res.json({ success: true, data } as ApiResponse<Staff>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.staff.create(req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.status(201).json({ success: true, data: result.data, message: '员工创建成功' } as ApiResponse<Staff>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.staff.update(req.params.id, req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    if (!result.data) {
      return res.status(404).json({ success: false, error: '员工不存在' } as ApiResponse<null>);
    }
    res.json({ success: true, data: result.data, message: '员工更新成功' } as ApiResponse<Staff>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await dualWriteService.staff.delete(req.params.id);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error } as ApiResponse<null>);
    }
    res.json({ success: true, message: '员工删除成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;
    const data = await dualWriteService.staff.login(name, password);
    if (!data) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' } as ApiResponse<null>);
    }
    const { password: _, ...staffWithoutPassword } = data;
    res.json({ success: true, data: staffWithoutPassword, message: '登录成功' } as ApiResponse<Partial<Staff>>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
