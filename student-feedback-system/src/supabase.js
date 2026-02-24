import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 环境变量未配置，请检查 .env.local 文件')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表结构说明：

// 1. students 表（学生账号）
// CREATE TABLE students (
//   id TEXT PRIMARY KEY,
//   name TEXT NOT NULL,
//   password TEXT,
//   wechat_group TEXT,
//   created_at TIMESTAMP DEFAULT NOW()
// );

// 2. videos 表（视频记录）
// CREATE TABLE videos (
//   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//   student_id TEXT REFERENCES students(id),
//   file_name TEXT NOT NULL,
//   file_url TEXT NOT NULL,
//   file_size INTEGER,
//   duration TEXT,
//   status TEXT DEFAULT 'pending', -- pending, processing, completed, sent
//   upload_time TIMESTAMP DEFAULT NOW(),
//   ai_analysis TEXT, -- AI分析结果
//   feedback TEXT -- 老师最终反馈
// );

// 3. upload_history 表（上传历史，可选）
// CREATE TABLE upload_history (
//   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//   student_id TEXT REFERENCES students(id),
//   file_name TEXT NOT NULL,
//   file_url TEXT NOT NULL,
//   upload_time TIMESTAMP DEFAULT NOW()
// );
