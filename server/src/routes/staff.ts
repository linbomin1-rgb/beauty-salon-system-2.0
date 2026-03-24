import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { memoryStore } from '../services/memoryStore.js';
import { Staff, ApiResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const useMemory = !supabase;

router.get('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      return res.json({ success: true, data: memoryStore.getStaff() } as ApiResponse<Staff[]>);
    }
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data } as ApiResponse<Staff[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.getStaffById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, error: '员工不存在' } as ApiResponse<null>);
      }
      return res.json({ success: true, data } as ApiResponse<Staff>);
    }
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
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
    if (useMemory) {
      const data = memoryStore.createStaff(req.body);
      return res.status(201).json({ success: true, data, message: '员工创建成功' } as ApiResponse<Staff>);
    }
    const staffData: Partial<Staff> = {
      id: uuidv4(),
      ...req.body,
      permissions: req.body.permissions || ['dashboard', 'appts', 'customers'],
    };

    const { data, error } = await supabase
      .from('staff')
      .insert([staffData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data, message: '员工创建成功' } as ApiResponse<Staff>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.updateStaff(req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, error: '员工不存在' } as ApiResponse<null>);
      }
      return res.json({ success: true, data, message: '员工更新成功' } as ApiResponse<Staff>);
    }
    const { data, error } = await supabase
      .from('staff')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: '员工不存在' } as ApiResponse<null>);
    }
    res.json({ success: true, data, message: '员工更新成功' } as ApiResponse<Staff>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const success = memoryStore.deleteStaff(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: '员工不存在' } as ApiResponse<null>);
      }
      return res.json({ success: true, message: '员工删除成功' } as ApiResponse<null>);
    }
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: '员工删除成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;
    
    if (useMemory) {
      const data = memoryStore.loginStaff(name, password);
      if (!data) {
        return res.status(401).json({ success: false, error: '用户名或密码错误' } as ApiResponse<null>);
      }
      const { password: _, ...staffWithoutPassword } = data;
      return res.json({ success: true, data: staffWithoutPassword, message: '登录成功' } as ApiResponse<Partial<Staff>>);
    }
    
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('name', name)
      .eq('password', password)
      .single();

    if (error || !data) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' } as ApiResponse<null>);
    }

    const { password: _, ...staffWithoutPassword } = data;
    res.json({ success: true, data: staffWithoutPassword, message: '登录成功' } as ApiResponse<Partial<Staff>>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
