// 使用 Node.js Serverless Function + PostgreSQL 直接连接
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.SUPABASE_POOL_URL,
  ssl: {
    rejectUnauthorized: false
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
      
      let query = 'SELECT * FROM videos'
      const params = []
      
      if (studentId) {
        query += ' WHERE student_id = $1'
        params.push(studentId)
      }
      
      query += ' ORDER BY upload_time DESC'
      
      if (!studentId) {
        query += ' LIMIT 100'
      }
      
      const { rows } = await pool.query(query, params)
      
      console.log('查询成功，返回', rows.length, '条记录')
      return res.status(200).json({ videos: rows })
      
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
      
      const updates = []
      const values = []
      let paramCount = 1
      
      if (feedback !== undefined) {
        updates.push(`feedback = $${paramCount}`)
        values.push(feedback)
        paramCount++
      }
      
      if (status !== undefined) {
        updates.push(`status = $${paramCount}`)
        values.push(status)
        paramCount++
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: '没有要更新的字段' })
      }
      
      values.push(videoId)
      
      const query = `
        UPDATE videos 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING *
      `
      
      const { rows } = await pool.query(query, values)
      
      console.log('更新成功:', rows[0])
      return res.status(200).json({ success: true, video: rows[0] })
      
    } catch (error) {
      console.error('PUT处理错误:', error)
      return res.status(500).json({ error: `服务器错误: ${error.message}` })
    }
  }
  
  return res.status(405).json({ error: '方法不允许' })
}
