# 学生视频反馈系统部署问题总结

> 用于咨询 Gemini 的完整问题描述
> 生成时间：2026-02-24

---

## 项目信息

- **项目名称**：student-feedback-system-help
- **部署平台**：Vercel (cuena's projects Hobby 账号)
- **GitHub 账号**：cuenan45-stack
- **数据库**：Supabase (student-feedback-system 项目)
- **存储**：阿里云 OSS
- **AI 服务**：阿里云通义千问

---

## 核心问题：加载数据失败

### 现象
前端页面显示红色错误提示：
```
加载数据失败，请刷新重试
```

### Vercel Function Logs 错误
```
Status: 500
Message: 获取视频列表失败: { message: 'TypeError: fetch failed' }
Request: GET /api/videos
```

---

## 已完成的配置（确认无误）

### 1. Vercel 环境变量 ✅
| 变量名 | 状态 |
|--------|------|
| SUPABASE_URL | ✅ 已配置 |
| SUPABASE_SERVICE_ROLE_KEY | ✅ 已配置 |
| OSS_REGION | ✅ 已配置 |
| OSS_ACCESS_KEY_ID | ✅ 已配置 |
| OSS_ACCESS_KEY_SECRET | ✅ 已配置 |
| OSS_BUCKET | ✅ 已配置 |
| DASHSCOPE_API_KEY | ✅ 已配置 |

### 2. Supabase 数据库 ✅
- **项目状态**：ACTIVE（正常运行）
- **地区**：AWS ap-southeast-1（新加坡）
- **表结构**：
  - `students` 表：3条记录 ✅
  - `videos` 表：0条记录（空表，但结构正确）✅
- **RLS**：已禁用 ✅

### 3. 代码修改历史
1. ✅ 添加了 `@supabase/supabase-js` 依赖
2. ✅ 修复了 `require` 改为 `import` 语法
3. ✅ 添加了 `.gitignore` 文件
4. ✅ 尝试了多种 Supabase 客户端配置
5. ✅ 改用 Supabase REST API 直接访问（最新尝试）

---

## 已尝试的解决方案（均失败）

### 尝试1：标准 Supabase 客户端
```javascript
import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(url, key)
```
**结果**：TypeError: fetch failed

### 尝试2：禁用自动刷新和会话持久化
```javascript
const supabaseAdmin = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```
**结果**：TypeError: fetch failed

### 尝试3：添加 db schema 配置
```javascript
const supabaseAdmin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
})
```
**结果**：TypeError: fetch failed

### 尝试4：使用 Supabase REST API 直接访问
```javascript
// 不使用 @supabase/supabase-js，直接用 fetch
const response = await fetch(`${supabaseUrl}/rest/v1/videos`, {
  headers: {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`
  }
})
```
**结果**：TypeError: fetch failed

---

## 关键信息

### Supabase 项目 URL
```
https://pcapccleoinemmxtxnlxl.supabase.co
```

### 当前 API 代码（videos.js）
```javascript
// 使用原生 fetch 访问 Supabase REST API
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function querySupabase(table, options = {}) {
  const { select = '*', order, limit } = options
  let url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`
  if (order) url += `&order=${encodeURIComponent(order)}`
  if (limit) url += `&limit=${limit}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    }
  })
  return await response.json()
}
```

---

## 可能的原因分析

1. **Vercel Serverless 到 Supabase 的网络连接问题**
   - Vercel 部署在 AWS us-east-1（美国）
   - Supabase 在 AWS ap-southeast-1（新加坡）
   - 跨区域连接可能超时

2. **Node.js fetch 在 Vercel Serverless 环境的问题**
   - Vercel 使用 Node.js 18/20
   - fetch API 在 Serverless 环境可能有兼容性问题

3. **Supabase 项目配置问题**
   - 需要检查 Connection Pooling 设置
   - 可能需要配置 IPv4/IPv6

4. **Vercel 函数配置问题**
   - 可能需要增加超时时间
   - 可能需要指定 Node.js 版本

---

## 需要咨询的问题

1. 如何在 Vercel Serverless 环境中正确连接 Supabase？
2. 是否需要使用 Connection Pooling（PgBouncer）？
3. 是否需要配置特定的 Node.js 版本或 fetch  polyfill？
4. 跨区域（美国→新加坡）连接是否有已知问题？
5. 是否需要使用 Supabase 的 IPv4 连接字符串？

---

## 其他相关问题

### 问题2：阿里云千问免费额度页面 404
- 原链接失效：`https://help.aliyun.com/zh/dashscope/developer-reference/quick-start`
- 需要新的申请地址

### 问题3：视频上传进度为0
- 上传视频时进度条一直显示 0%
- 可能与 OSS 配置或 Supabase 连接问题相关

---

## 附件

- 项目仓库：https://github.com/cuenan45-stack/student-feedback-system-help
- 部署地址：https://student-feedback-system-help.vercel.app/
- Supabase 项目：student-feedback-system (AWS ap-southeast-1)

---

*文档结束*
