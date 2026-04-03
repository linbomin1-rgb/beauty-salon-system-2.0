import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabases, dualWriteService } from './services/dualWriteService.js';
import { performFullSync, getSyncStatus, startAutoSync, stopAutoSync } from './services/syncService.js';
import staffRoutes from './routes/staff.js';
import customerRoutes from './routes/customers.js';
import appointmentRoutes from './routes/appointments.js';
import transactionRoutes from './routes/transactions.js';
import promotionRoutes from './routes/promotions.js';
import customerCardRoutes from './routes/customerCards.js';
import logRoutes from './routes/logs.js';
import reminderRoutes from './routes/reminders.js';

dotenv.config();
initDatabases();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || '300000', 10);

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'https://beauty-salon.bobonas.online'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../../dist')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/sync-status', (req, res) => {
  const failedSyncs = dualWriteService.getSyncStatus();
  const syncStatusInfo = getSyncStatus();
  res.json({
    success: true,
    data: {
      dualWriteEnabled: process.env.DUAL_WRITE_ENABLED === 'true',
      primaryDatabase: process.env.PRIMARY_DATABASE || 'supabase',
      syncInterval: SYNC_INTERVAL,
      lastSync: syncStatusInfo.lastSync,
      isSyncing: syncStatusInfo.isSyncing,
      error: syncStatusInfo.error,
      failedSyncCount: failedSyncs.length,
      failedSyncs
    }
  });
});

app.post('/api/sync', async (req, res) => {
  try {
    const result = await performFullSync();
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/sync/start', (req, res) => {
  const interval = req.body.interval || SYNC_INTERVAL;
  startAutoSync(interval);
  res.json({
    success: true,
    message: `自动同步已启动，间隔: ${interval / 1000} 秒`
  });
});

app.post('/api/sync/stop', (req, res) => {
  stopAutoSync();
  res.json({
    success: true,
    message: '自动同步已停止'
  });
});

app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/customer-cards', customerCardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/reminders', reminderRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 API 端点: http://localhost:${PORT}/api`);
  
  if (process.env.DUAL_WRITE_ENABLED === 'true') {
    startAutoSync(SYNC_INTERVAL);
    console.log(`🔄 双向同步已启用，自动同步间隔: ${SYNC_INTERVAL / 1000} 秒`);
  }
});
