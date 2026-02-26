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

      const signedUrl = await ossClient.signatureUrl(objectKey, {
        expires: 3600,
        method: 'PUT',
        contentType: 'video/mp4'
      })

      console.log('生成签名URL成功')

      // 构建文件访问URL - 使用正确的OSS域名格式
      const bucket = process.env.OSS_BUCKET
      const region = process.env.OSS_REGION
      // OSS外网访问地址格式: https://bucket.oss-region.aliyuncs.com
      const fileUrl = `https://${bucket}.oss-${region}.aliyuncs.com/${objectKey}`
      console.log('构建文件URL:', fileUrl)

      return res.status(200).json({
        success: true,
        uploadUrl: signedUrl,
        fileUrl: fileUrl,
        objectKey: objectKey
      })
    } catch (error) {
      console.error('获取上传签名失败:', error)
      return res.status(500).json({ error: '获取上传签名失败', details: error.message })
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { student_id, file_name, file_url, file_size, duration, object_key } = req.body

      if (!student_id || !file_url) {
        return res.status(400).json({ error: '缺少必要参数' })
      }

      const response = await makeSupabaseRequest('/rest/v1/videos', 'POST', {
        student_id,
        file_name,
        file_url,
        object_key: object_key || null,
        file_size: file_size || null,
        duration: duration || null,
        status: 'pending',
        upload_time: new Date().toISOString()
      })

      if (response.status >= 200 && response.status < 300) {
        return res.status(200).json({ success: true, video: response.data })
      } else {
        return res.status(500).json({ error: '保存失败' })
      }
    } catch (error) {
      return res.status(500).json({ error: '服务器错误' })
    }
  }
  
  return res.status(405).json({ error: '方法不允许' })
}
