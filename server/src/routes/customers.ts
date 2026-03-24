import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { memoryStore } from '../services/memoryStore.js';
import { Customer, ApiResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const useMemory = !supabase;

router.get('/', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      return res.json({ success: true, data: memoryStore.getCustomers() } as ApiResponse<Customer[]>);
    }
    const { search, staff_id } = req.query;
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    
    if (staff_id) {
      query = query.eq('assigned_staff_id', staff_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ success: true, data } as ApiResponse<Customer[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.getCustomerById(req.params.id);
      if (!data) {
        return res.status(404).json({ success: false, error: '顾客不存在' } as ApiResponse<null>);
      }
      return res.json({ success: true, data } as ApiResponse<Customer>);
    }
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
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
    if (useMemory) {
      const data = memoryStore.createCustomer(req.body);
      return res.status(201).json({ success: true, data, message: '顾客创建成功' } as ApiResponse<Customer>);
    }
    const customerData: Partial<Customer> = {
      id: uuidv4(),
      ...req.body,
      balance: req.body.balance || 0,
      tags: req.body.tags || [],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data, message: '顾客创建成功' } as ApiResponse<Customer>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const data = memoryStore.updateCustomer(req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ success: false, error: '顾客不存在' } as ApiResponse<null>);
      }
      return res.json({ success: true, data, message: '顾客更新成功' } as ApiResponse<Customer>);
    }
    const { data, error } = await supabase
      .from('customers')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: '顾客不存在' } as ApiResponse<null>);
    }
    res.json({ success: true, data, message: '顾客更新成功' } as ApiResponse<Customer>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (useMemory) {
      const success = memoryStore.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: '顾客不存在' } as ApiResponse<null>);
      }
      return res.json({ success: true, message: '顾客删除成功' } as ApiResponse<null>);
    }
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: '顾客删除成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
