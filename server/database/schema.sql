-- 美业管理系统数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 员工表
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password VARCHAR(255),
  avatar VARCHAR(10),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 顾客/会员表
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  balance DECIMAL(10, 2) DEFAULT 0,
  remarks TEXT,
  gender VARCHAR(20) DEFAULT 'female',
  birthday DATE,
  source VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  assigned_staff_id UUID REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 活动/促销表
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) DEFAULT 'discount',
  discount_rate DECIMAL(3, 2),
  total_count INTEGER,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 顾客活动卡表
CREATE TABLE IF NOT EXISTS customer_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id),
  balance DECIMAL(10, 2),
  used_count INTEGER DEFAULT 0,
  total_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预约表
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(100) NOT NULL,
  staff_id UUID NOT NULL REFERENCES staff(id),
  project_name VARCHAR(200) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  start_hour DECIMAL(4, 2),
  duration DECIMAL(4, 2) DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(100),
  customer_card_id UUID REFERENCES customer_cards(id),
  promotion_name VARCHAR(200),
  original_amount DECIMAL(10, 2),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  item_name VARCHAR(200),
  staff_id UUID REFERENCES staff(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  undo_data JSONB,
  is_revoked BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 员工提醒表
CREATE TABLE IF NOT EXISTS staff_reminders (
  id VARCHAR(100) PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  staff_id UUID REFERENCES staff(id),
  reminder_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_staff ON customers(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_staff ON transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_customer_cards_customer ON customer_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_reminders_staff ON staff_reminders(staff_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON staff_reminders(status);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为各表添加更新时间触发器
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_cards_updated_at BEFORE UPDATE ON customer_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON staff_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认管理员账号
INSERT INTO staff (id, name, role, password, avatar, permissions)
VALUES (
  uuid_generate_v4(),
  'admin',
  '总店长',
  'admin',
  'A',
  ARRAY['all']
) ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS) 策略
-- 注意：生产环境需要根据实际安全需求调整

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_reminders ENABLE ROW LEVEL SECURITY;

-- 允许所有操作（开发环境）
-- 生产环境应该根据用户角色设置更严格的策略
CREATE POLICY "Allow all for staff" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for promotions" ON promotions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for customer_cards" ON customer_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for system_logs" ON system_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for staff_reminders" ON staff_reminders FOR ALL USING (true) WITH CHECK (true);
