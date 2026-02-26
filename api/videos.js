import https from 'https'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // 检查环境变量
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables:', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_SERVICE_ROLE_KEY
    })
    return res.status(500).json({ 
      videos: [], 
      error: '服务器配置错误：缺少数据库连接信息',
      details: '请检查 Vercel 环境变量设置',
      debug: {
        supabaseUrl: SUPABASE_URL || 'undefined',
        urlLength: SUPABASE_URL ? SUPABASE_URL.length : 0,
        hasKey: !!SUPABASE_SERVICE_ROLE_KEY
      }
    })
  }
  
  if (req.method === 'GET') {
    try {
      const studentId = req.query.studentId
      let path = '/rest/v1/videos?select=*,student:students(id,name,wechat_group)&order=upload_time.desc'
      
      if (studentId) {
        path += `&student_id=eq.${encodeURIComponent(studentId)}`
      } else {
        path += '&limit=100'
      }
      
      console.log('Fetching from:', SUPABASE_URL + path)
      const response = await makeRequest(path)
      console.log('Response status:', response.status)
      
      if (response.status >= 200 && response.status < 300) {
        return res.status(200).json({ videos: response.data || [] })
      } else {
        console.error('Supabase error:', response.data)
        return res.status(500).json({ 
          videos: [], 
          error: `查询失败: ${response.data?.message || '未知错误'}`
        })
      }
    } catch (error) {
      console.error('API error:', error)
      return res.status(500).json({ 
        videos: [], 
        error: `服务器错误: ${error.message}`
      })
    }
  }
  
  if (req.method === 'PUT') {
    try {
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
        return res.status(200).json({ success: true })
      } else {
        return res.status(500).json({ error: '更新失败' })
      }
    } catch (error) {
      return res.status(500).json({ error: '服务器错误' })
    }
  }
  
  return res.status(405).json({ error: '方法不允许' })
}
