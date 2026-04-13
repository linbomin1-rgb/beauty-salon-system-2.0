import { Router, Request, Response } from 'express';
import { localDb } from '../config/localDb.js';
import { ProjectCategory, ProjectItem, ApiResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const data = localDb.projectCategories.getAll();
    res.json({ success: true, data } as ApiResponse<ProjectCategory[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/categories', async (req: Request, res: Response) => {
  try {
    const categories = localDb.projectCategories.getAll();
    const categoryData: ProjectCategory = {
      id: uuidv4(),
      name: req.body.name || '',
      sort_order: req.body.sort_order ?? categories.length,
      created_at: new Date().toISOString(),
    };
    const result = localDb.projectCategories.create(categoryData);
    res.status(201).json({ success: true, data: result, message: '项目大类创建成功' } as ApiResponse<ProjectCategory>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    let category = localDb.projectCategories.getById(req.params.id);
    if (!category) {
      const categories = localDb.projectCategories.getAll();
      category = categories.find(c => c.name === req.params.id);
    }
    if (!category) {
      return res.status(404).json({ success: false, error: '项目大类不存在' } as ApiResponse<null>);
    }
    const result = localDb.projectCategories.update(category.id, req.body);
    res.json({ success: true, data: result, message: '项目大类更新成功' } as ApiResponse<ProjectCategory>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    let category = localDb.projectCategories.getById(req.params.id);
    if (!category) {
      const categories = localDb.projectCategories.getAll();
      category = categories.find(c => c.name === req.params.id);
    }
    if (!category) {
      return res.status(404).json({ success: false, error: '项目大类不存在' } as ApiResponse<null>);
    }
    const result = localDb.projectCategories.delete(category.id);
    res.json({ success: true, message: '项目大类删除成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.get('/items', async (req: Request, res: Response) => {
  try {
    const filters: { category_id?: string } = {};
    if (req.query.category_id) {
      filters.category_id = req.query.category_id as string;
    }
    const data = localDb.projectItems.getAll(filters);
    res.json({ success: true, data } as ApiResponse<ProjectItem[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.post('/items', async (req: Request, res: Response) => {
  try {
    let categoryId = req.body.category_id;
    const categories = localDb.projectCategories.getAll();
    const categoryByName = categories.find(c => c.name === categoryId);
    if (categoryByName) {
      categoryId = categoryByName.id;
    }
    const items = localDb.projectItems.getAll({ category_id: categoryId });
    const itemData: ProjectItem = {
      id: uuidv4(),
      category_id: categoryId,
      name: req.body.name || '',
      sort_order: req.body.sort_order ?? items.length,
      created_at: new Date().toISOString(),
    };
    const result = localDb.projectItems.create(itemData);
    res.status(201).json({ success: true, data: result, message: '具体项目创建成功' } as ApiResponse<ProjectItem>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    let item = localDb.projectItems.getById(req.params.id);
    if (!item) {
      const items = localDb.projectItems.getAll();
      item = items.find(i => i.name === req.params.id);
    }
    if (!item) {
      return res.status(404).json({ success: false, error: '具体项目不存在' } as ApiResponse<null>);
    }
    const result = localDb.projectItems.update(item.id, req.body);
    res.json({ success: true, data: result, message: '具体项目更新成功' } as ApiResponse<ProjectItem>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    let item = localDb.projectItems.getById(req.params.id);
    if (!item) {
      const items = localDb.projectItems.getAll();
      item = items.find(i => i.name === req.params.id);
    }
    if (!item) {
      return res.status(404).json({ success: false, error: '具体项目不存在' } as ApiResponse<null>);
    }
    const result = localDb.projectItems.delete(item.id);
    res.json({ success: true, message: '具体项目删除成功' } as ApiResponse<null>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const categories = localDb.projectCategories.getAll();
    const items = localDb.projectItems.getAll();
    
    const result = categories.map(cat => ({
      label: cat.name,
      items: items.filter(item => item.category_id === cat.id).map(item => item.name)
    }));
    
    res.json({ success: true, data: result } as ApiResponse<any[]>);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse<null>);
  }
});

export default router;
