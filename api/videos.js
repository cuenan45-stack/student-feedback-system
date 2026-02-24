// 使用标准 Node.js Serverless Function
// 注意：不设置 config，默认使用 Node.js Runtime

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('环境变量缺失:', { 
    url: !!supabaseUrl, 
    key: !!supabaseServiceKey 
  })
  throw new Error('Supabase环境变量未配置')
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// API: 获取学生视频列表
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    try {
      console.log('=== GET /api/videos ===')
      
      const studentId = req.query.studentId
      
      let query = supabase
        .from('videos')
        .select('*')
        .order('upload_time', { ascending: false })
      
      if (studentId) {
        query = query.eq('student_id', studentId)
      } else {
        query = query.limit(100)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Supabase查询错误:', error)
        return res.status(500).json({ 
          videos: [], 
          error: `查询失败: ${error.message}` 
        })
      }
      
      console.log('查询成功，返回', data?.length || 0, '条记录')
      return res.status(200).json({ videos: data || [] })
      
    } catch (error) {
      console.error('GET处理错误:', error)
      return res.status(500).json({ 
        videos: [], 
        error: `服务器错误: ${error.message}` 
      })
    }
  }
  
  if (req.method === 'PUT') {
    try {
      console.log('=== PUT /api/videos ===')
      
      const { videoId, feedback, status } = req.body
      
      if (!videoId) {
        return res.status(400).json({ error: '缺少videoId' })
      }
      
      const updateData = {}
      if (feedback !== undefined) updateData.feedback = feedback
      if (status !== undefined) updateData.status = status
      
      const { data, error } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', videoId)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase更新错误:', error)
        return res.status(500).json({ error: `更新失败: ${error.message}` })
      }
      
      console.log('更新成功:', data)
      return res.status(200).json({ success: true, video: data })
      
    } catch (error) {
      console.error('PUT处理错误:', error)
      return res.status(500).json({ error: `服务器错误: ${error.message}` })
    }
  }
  
  return res.status(405).json({ error: '方法不允许' })
}
