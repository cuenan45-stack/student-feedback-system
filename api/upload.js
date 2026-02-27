import OSS from 'ali-oss'
import https from 'https'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  secure: true
})

function makeSupabaseRequest(path, method = 'GET', data = null) {
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
    
    const req = https.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk) => responseData += chunk)
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) })
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData })
        }
      })
    })
    
    req.on('error', reject)
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // GET 请求 - 获取上传配置信息
  if (req.method === 'GET') {
    try {
      const studentId = req.query.studentId
      const fileName = req.query.fileName
      
      console.log('收到上传请求:', { studentId, fileName })
      
      if (!studentId || !fileName) {
        console.log('缺少参数:', { studentId, fileName })
        return res.status(400).json({ error: '缺少参数' })
      }

      // 检查OSS客户端配置
      console.log('OSS配置检查:', {
        region: process.env.OSS_REGION,
        bucket: process.env.OSS_BUCKET,
        hasAccessKey: !!process.env.OSS_ACCESS_KEY_ID,
        hasSecret: !!process.env.OSS_ACCESS_KEY_SECRET
      })

      const timestamp = Date.now()
      const ext = fileName.split('.').pop()
      const random = Math.random().toString(36).substring(2, 8)
      const objectKey = `videos/${studentId}/${timestamp}_${random}.${ext}`

      console.log('生成objectKey:', objectKey)

      // 构建文件访问URL - 使用正确的OSS域名格式
      const bucket = process.env.OSS_BUCKET
      const region = process.env.OSS_REGION
      // OSS外网访问地址格式: https://bucket.oss-region.aliyuncs.com
      const fileUrl = `https://${bucket}.oss-${region}.aliyuncs.com/${objectKey}`
      console.log('构建文件URL:', fileUrl)

      return res.status(200).json({
        success: true,
        objectKey: objectKey,
        fileUrl: fileUrl,
        uploadType: 'server' // 告诉前端使用服务器上传
      })
    } catch (err) {
      console.error('获取上传配置失败:', err)
      return res.status(500).json({ error: err.message })
    }
  }
  
  // POST 请求 - 处理文件上传和保存记录
  if (req.method === 'POST') {
    try {
      const body = req.body
      console.log('收到POST请求:', Object.keys(body))
      
      // 检查是否是 base64 文件上传
      if (body.fileData && body.objectKey) {
        // 服务器端上传到 OSS
        const buffer = Buffer.from(body.fileData, 'base64')
        console.log('准备上传到OSS:', body.objectKey, '大小:', buffer.length)
        
        try {
          const result = await ossClient.put(body.objectKey, buffer)
          console.log('OSS上传成功:', result.url)
        } catch (ossErr) {
          console.error('OSS上传失败:', ossErr)
          return res.status(500).json({ error: 'OSS上传失败: ' + ossErr.message })
        }
        
        // 保存到 Supabase
        const { status, data } = await makeSupabaseRequest('/rest/v1/videos', 'POST', {
          student_id: body.student_id,
          file_name: body.file_name,
          file_url: body.file_url,
          object_key: body.object_key,
          file_size: body.file_size,
          duration: body.duration || null,
          status: 'uploaded'
        })
        
        console.log('Supabase保存结果:', { status })
        
        if (status >= 200 && status < 300) {
          return res.status(200).json({ success: true, data })
        } else {
          return res.status(500).json({ error: '保存记录失败', details: data })
        }
      }
      
      // 普通表单上传（文件已上传到OSS，只保存记录）
      const { student_id, file_name, file_url, object_key, file_size, duration } = body
      
      if (!student_id || !file_name || !file_url) {
        return res.status(400).json({ error: '缺少必要参数' })
      }
      
      const { status, data } = await makeSupabaseRequest('/rest/v1/videos', 'POST', {
        student_id,
        file_name,
        file_url,
        object_key,
        file_size,
        duration: duration || null,
        status: 'uploaded'
      })
      
      console.log('Supabase保存结果:', { status })
      
      if (status >= 200 && status < 300) {
        return res.status(200).json({ success: true, data })
      } else {
        return res.status(500).json({ error: '保存记录失败', details: data })
      }
    } catch (err) {
      console.error('处理上传失败:', err)
      return res.status(500).json({ error: err.message })
    }
  }
  
  return res.status(405).json({ error: '方法不允许' })
}
