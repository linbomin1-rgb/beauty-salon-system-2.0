import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import staffRoutes from './routes/staff.js';
import customerRoutes from './routes/customers.js';
import appointmentRoutes from './routes/appointments.js';
import transactionRoutes from './routes/transactions.js';
import promotionRoutes from './routes/promotions.js';
import customerCardRoutes from './routes/customerCards.js';
import logRoutes from './routes/logs.js';
import reminderRoutes from './routes/reminders.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/customer-cards', customerCardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/reminders', reminderRoutes);

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
});
