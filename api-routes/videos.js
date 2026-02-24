import express from 'express'
import https from 'https'

const router = express.Router()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// 使用 https 模块请求 Supabase REST API
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL)
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      }
    }
    
    if (data) {
      const postData = JSON.stringify(data)
      options.headers['Content-Length'] = Buffer.byteLength(postData)
    }
    
    const req = https.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData)
          resolve({ status: res.statusCode, data: parsedData })
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData })
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

// GET: 获取视频列表
router.get('/', async (req, res) => {
  try {
    console.log('=== GET /api/videos ===')
    
    const studentId = req.query.studentId
    
    let path = '/rest/v1/videos?select=*,student:students(id,name,wechat_group)&order=upload_time.desc'
    
    if (studentId) {
      path += `&student_id=eq.${encodeURIComponent(studentId)}`
    } else {
      path += '&limit=100'
    }
    
    console.log('请求路径:', path)
    
    const response = await makeRequest(path)
    
    console.log('响应状态:', response.status)
    
    if (response.status >= 200 && response.status < 300) {
      return res.status(200).json({ videos: response.data || [] })
    } else {
      console.error('Supabase API 错误:', response.data)
      return res.status(500).json({ 
        videos: [], 
        error: `查询失败: ${JSON.stringify(response.data)}` 
      })
    }
    
  } catch (error) {
    console.error('GET处理错误:', error)
    return res.status(500).json({ 
      videos: [], 
      error: `服务器错误: ${error.message}` 
    })
  }
})

// PUT: 更新视频反馈
router.put('/', async (req, res) => {
  try {
    console.log('=== PUT /api/videos ===')
    
    const { videoId, feedback, status } = req.body
    
    if (!videoId) {
      return res.status(400).json({ error: '缺少videoId' })
    }
    
    const updateData = {}
    if (feedback !== undefined) updateData.feedback = feedback
    if (status !== undefined) updateData.status = status
    
    const path = `/rest/v1/videos?id=eq.${videoId}`
    
    const response = await makeRequest(path, 'PATCH', updateData)
    
    if (response.status >= 200 && response.status < 300) {
      console.log('更新成功:', response.data)
      return res.status(200).json({ success: true, video: response.data?.[0] })
    } else {
      console.error('Supabase API 错误:', response.data)
      return res.status(500).json({ error: `更新失败: ${JSON.stringify(response.data)}` })
    }
    
  } catch (error) {
    console.error('PUT处理错误:', error)
    return res.status(500).json({ error: `服务器错误: ${error.message}` })
  }
})

export default router
