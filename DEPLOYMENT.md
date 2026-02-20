# 学生视频反馈系统 - 真实部署指南

## 📋 目录

1. [系统架构](#系统架构)
2. [准备工作](#准备工作)
3. [配置Supabase数据库](#配置supabase数据库)
4. [配置阿里云OSS](#配置阿里云oss)
5. [申请通义千问API](#申请通义千问api)
6. [部署到Vercel](#部署到vercel)
7. [测试系统](#测试系统)
8. [常见问题](#常见问题)

---

## 系统架构

```
学生上传视频 → 阿里云OSS（存储） → Supabase（记录）
                              ↓
老师查看列表 ← 前端 ← Vercel API ← 数据库
老师点AI分析 → 后端 → 通义千问 → 保存结果 → 前端显示
```

**技术栈**：
- 前端：React + Vite + Tailwind CSS
- 后端：Vercel Serverless Functions
- 数据库：Supabase PostgreSQL
- 存储：阿里云OSS
- AI：阿里通义千问

---

## 准备工作

### 1. 注册账号（全部免费）

| 服务 | 网址 | 用途 | 免费额度 |
|------|------|------|---------|
| **Supabase** | https://supabase.com | 数据库 | 500MB |
| **阿里云** | https://www.aliyun.com | 文件存储 | 6GB/月 |
| **Vercel** | https://vercel.com | 部署托管 | 100GB/月 |
| **通义千问** | https://dashscope.aliyun.com | AI分析 | 100万tokens |

**注意**：
- 阿里云需要实名认证
- 通义千问需要实名认证
- 所有服务都有免费额度，够10个老师使用

---

## 配置Supabase数据库

### 步骤1：创建项目

1. 登录 https://app.supabase.com/
2. 点击 "New Project"
3. 填写：
   - Name: `student-feedback`
   - Database Password: 记住这个密码
   - Region: 选择离你最近的（如：East Asia）
4. 等待创建完成（约2分钟）

### 步骤2：创建数据表

在Supabase控制台，进入 **SQL Editor**，点击 **New Query**，粘贴以下SQL：

```sql
-- 1. 学生账号表
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password TEXT,
  wechat_group TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. 视频记录表
CREATE TABLE videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id TEXT REFERENCES students(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  object_key TEXT,  -- OSS存储路径，用于生成签名URL
  file_size INTEGER,
  duration TEXT,
  status TEXT DEFAULT 'pending',
  upload_time TIMESTAMP DEFAULT NOW(),
  ai_analysis TEXT,
  feedback TEXT
);

-- 3. 索引（优化查询）
CREATE INDEX idx_videos_student_id ON videos(student_id);
CREATE INDEX idx_videos_upload_time ON videos(upload_time);

-- 4. 插入初始学生数据（可选）
INSERT INTO students (id, name, wechat_group) VALUES
  ('A', '学生 A', '一年级英语打卡群A'),
  ('B', '学生 B', '一年级英语打卡群B'),
  ('C', '学生 C', '一年级英语打卡群A'),
  ('D', '学生 D', '一年级英语打卡群C'),
  ('12345678', '李明', '一年级英语打卡群A')
ON CONFLICT (id) DO NOTHING;
```

点击 **Run** 执行。

### 步骤3：获取API密钥

1. 进入 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyxxx...`

---

## 配置阿里云OSS

### 步骤1：开通OSS

1. 登录 https://www.aliyun.com/
2. 进入 **控制台**
3. 搜索 **OSS**（对象存储）
4. 点击 **开通OSS**
5. 选择：
   - 地域：选择离你近的（如：华东1 杭州）
   - 存储类型：标准存储
6. 勾选协议，点击 **立即开通**

### 步骤2：创建Bucket

1. 进入 **Bucket列表**
2. 点击 **创建Bucket**
3. 填写：
   - Bucket名称：`student-feedback-${你的随机字符串}`（全局唯一）
   - 地域：与上面一致
   - 存储类型：标准
   - 读写权限：**私有**
4. 点击 **确定**

### 步骤3：获取密钥

1. 进入 **AccessKey管理**（右上角头像）
2. 点击 **创建AccessKey**
3. 记录：
   - **AccessKey ID**
   - **AccessKey Secret**
4. 注意：Secret只显示一次，请保存好

---

## 申请通义千问API

### 步骤1：开通服务

1. 访问 https://dashscope.aliyun.com/
2. 点击 **登录**（用阿里云账号）
3. 进入 **控制台**
4. 点击 **开通服务**，勾选协议

### 步骤2：获取API Key

1. 进入 **API-KEY管理**
2. 点击 **创建API-KEY**
3. 输入名称（如：`student-feedback`）
4. 复制生成的 **API Key**

---

## 部署到Vercel

### 步骤1：准备代码

确保你的项目结构包含：
```
e:\assignment helper\
├── api\
│   ├── upload.js
│   ├── videos.js
│   └── analyze.js
├── src\
│   ├── App.jsx
│   ├── supabase.js
│   ├── oss.js
│   └── aiService.js
├── .env.example
├── vercel.json
├── package.json
└── ...
```

### 步骤2：创建Vercel项目

1. 访问 https://vercel.com/
2. 点击 **Add New...** → **Project**
3. 导入Git仓库（需要先推送到GitHub）
   - 或使用 **Deploy** 按钮直接上传

### 步骤3：配置环境变量

在Vercel项目设置中，进入 **Environment Variables**，添加：

```
SUPABASE_URL = 你的Supabase URL
SUPABASE_SERVICE_ROLE_KEY = 你的Supabase Service Role Key（在Settings → API → service_role key）
OSS_REGION = 你的OSS区域（如：oss-cn-hangzhou）
OSS_ACCESS_KEY_ID = 你的AccessKey ID
OSS_ACCESS_KEY_SECRET = 你的AccessKey Secret
OSS_BUCKET = 你的Bucket名称
DASHSCOPE_API_KEY = 你的通义千问API Key
```

**重要**：
- `SUPABASE_SERVICE_ROLE_KEY` 不是 anon key！
- 在Supabase的 **Settings** → **API** → **service_role key** 中复制

### 步骤4：安装依赖并部署

**重要**：需要安装阿里云OSS依赖

```bash
npm install ali-oss
```

然后：

1. 点击 **Deploy**
2. 等待部署完成（约2分钟）
3. 获得访问域名（如：`https://student-feedback.vercel.app`）

---

## 配置前端环境变量

在Vercel部署时，环境变量已经配置。如果本地开发，需要创建 `.env.local`：

```bash
# 复制 .env.example 为 .env.local
cp .env.example .env.local
```

然后填入你的配置。

---

## 视频限制说明

**重要**：为了确保免费版Vercel（10秒超时）能正常工作，系统限制了：

- ✅ 视频时长：**60秒以内**
- ✅ 视频大小：**20MB以内**
- ✅ 预计分析时间：**6-8秒**

如果上传的视频超过限制，系统会拒绝并提示。

**如何制作1分钟视频**：
1. 用手机录屏时控制时间
2. 用剪映等软件剪辑
3. 导出时选择"中等质量"（720p）

---

## 测试系统

### 测试流程

1. **访问老师界面**
   - 打开：`https://你的项目.vercel.app`
   - 密码：`teacher123`
   - 登录后点击 **AI设置**
   - 输入通义千问API Key，点击"测试连接"
   - 保存

2. **学生上传测试**
   - 访问：`https://你的项目.vercel.app/student`
   - 输入：ID `12345678`，姓名 `李明`
   - 点击"上传新视频"
   - 选择一个MP4视频文件
   - 观察上传进度

3. **老师AI分析测试**
   - 返回老师界面
   - 刷新页面（或等待1分钟自动刷新）
   - 应该看到李明的视频记录
   - 点击 **AI一键反馈**
   - 等待分析完成（约10-30秒）
   - 查看反馈内容是否生成

4. **确认发送**
   - 检查反馈内容
   - 点击"确认发送"
   - 状态变为"已发送"

---

## 常见问题

### Q1: 上传失败，提示"获取上传签名失败"

**原因**：OSS配置错误或Bucket不存在

**解决**：
1. 检查 `.env.local` 中的OSS配置
2. 确认Bucket已创建且名称正确
3. 检查AccessKey是否有权限

### Q2: AI分析失败，提示"API Key未配置"

**原因**：通义千问API Key未设置

**解决**：
1. 老师登录后点击"AI设置"
2. 输入正确的API Key
3. 点击"测试连接"验证

### Q3: 视频上传成功，但老师看不到

**原因**：数据库记录未保存或查询失败

**解决**：
1. 打开浏览器控制台（F12）
2. 查看Network标签，检查 `/api/videos` 请求是否成功
3. 检查Supabase中是否有数据

### Q4: 通义千问返回错误"视频URL不可访问"

**原因**：OSS文件是私有的，通义千问无法访问

**解决**：
- 方案1：将Bucket设为公开（不推荐，有安全风险）
- 方案2：使用STS临时凭证（需要后端支持，当前版本暂未实现）
- 方案3：降级到文本分析（系统已自动降级，但效果较差）

**当前建议**：先测试文本分析功能，视频分析需要后续优化。

### Q5: 如何修改学生账号？

**答**：
1. 老师登录后点击"学生账号"
2. 搜索学生
3. 点击"编辑"修改信息
4. 点击"保存"

### Q6: 免费额度用完后怎么办？

**答**：
- Supabase：$25/月升级（够1000个学生）
- 阿里云OSS：￥0.12/GB/月（超便宜）
- 通义千问：￥0.004/千tokens（约￥0.4/100个视频）
- Vercel：$20/月升级（够100万请求）

**总成本**：约￥50-100/月（10个老师）

---

## 后续优化建议

1. **视频分析优化**：实现STS临时凭证，让通义千问能访问私有视频
2. **批量分析**：支持一键分析所有学生
3. **反馈模板**：老师可以自定义反馈模板
4. **数据统计**：统计每个学生的学习情况
5. **消息推送**：分析完成后自动推送给学生

---

## 联系支持

如果遇到问题：
1. 检查浏览器控制台错误信息
2. 检查Vercel函数日志（在Vercel项目查看）
3. 检查Supabase日志（在Supabase控制台）

---

**祝你部署顺利！🎉**
