import express from 'express'
import OSS from 'ali-oss'
import https from 'https'

const router = express.Router()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// OSS 客户端
const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
})

// 使用 https 模块请求 Supabase REST API
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

// GET: 获取OSS上传签名
router.get('/', async (req, res) => {
  try {
    console.log('=== GET /api/upload (获取OSS签名) ===')
    
    const studentId = req.query.studentId
    const fileName = req.query.fileName
    
    if (!studentId || !fileName) {
      return res.status(400).json({ error: '缺少参数' })
    }

    // 生成OSS上传路径
    const timestamp = Date.now()
    const ext = fileName.split('.').pop()
    const random = Math.random().toString(36).substring(2, 8)
    const objectKey = `videos/${studentId}/${timestamp}_${random}.${ext}`

    // 获取OSS签名URL（前端直传）
    const signedUrl = await ossClient.signatureUrl(objectKey, {
      expires: 3600,
      method: 'PUT',
      contentType: 'video/mp4'
    })

    // 返回文件访问URL（上传后）
    const fileUrl = ossClient.address(objectKey)

    console.log('生成签名成功:', objectKey)
    
    return res.status(200).json({
      success: true,
      uploadUrl: signedUrl,
      fileUrl: fileUrl,
      objectKey: objectKey
    })
  } catch (error) {
    console.error('获取上传签名失败:', error)
    return res.status(500).json({ error: '获取上传签名失败' })
  }
})

// POST: 保存视频记录到数据库
router.post('/', async (req, res) => {
  try {
    console.log('=== POST /api/upload (保存视频记录) ===')
    
    const { student_id, file_name, file_url, file_size, duration, object_key } = req.body

    if (!student_id || !file_url) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    // 使用 https 插入视频记录
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
      console.log('保存视频记录成功')
      return res.status(200).json({
        success: true,
        video: response.data
      })
    } else {
      console.error('保存视频记录失败:', response.data)
      return res.status(500).json({ error: '保存失败' })
    }
  } catch (error) {
    console.error('保存视频记录异常:', error)
    return res.status(500).json({ error: '服务器错误' })
  }
})

export default router
