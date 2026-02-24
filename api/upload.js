import { createClient } from '@supabase/supabase-js'
import OSS from 'ali-oss'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase环境变量未配置')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
})

// 通义千问配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY

// 工具函数：生成响应
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

function createError(message, status = 500) {
  return createResponse({ error: message }, status)
}

// API 1: 学生视频上传（获取OSS签名）
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const fileName = searchParams.get('fileName')
    
    if (!studentId || !fileName) {
      return createError('缺少参数', 400)
    }

    // 生成OSS上传路径
    const timestamp = Date.now()
    const ext = fileName.split('.').pop()
    const random = Math.random().toString(36).substring(2, 8)
    const objectKey = `videos/${studentId}/${timestamp}_${random}.${ext}`

    // 获取OSS签名URL（前端直传）
    const signedUrl = await ossClient.signatureUrl(objectKey, {
      expires: 3600, // 1小时有效
      method: 'PUT',
      contentType: 'video/mp4'
    })

    // 返回文件访问URL（上传后）
    const fileUrl = ossClient.address(objectKey)

    return createResponse({
      success: true,
      uploadUrl: signedUrl,
      fileUrl: fileUrl,
      objectKey: objectKey
    })
  } catch (error) {
    console.error('获取上传签名失败:', error)
    return createError('获取上传签名失败', 500)
  }
}

// API 2: 保存视频记录到数据库
export async function POST(request) {
  try {
    const body = await request.json()
    const { student_id, file_name, file_url, file_size, duration, object_key } = body

    if (!student_id || !file_url) {
      return createError('缺少必要参数', 400)
    }

    // 插入视频记录
    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert({
        student_id,
        file_name,
        file_url,
        object_key: object_key || null,  // 保存OSS路径，用于后续STS签名
        file_size: file_size || null,
        duration: duration || null,
        status: 'pending',
        upload_time: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('保存视频记录失败:', error)
      return createError('保存失败', 500)
    }

    return createResponse({
      success: true,
      video: data
    })
  } catch (error) {
    console.error('保存视频记录异常:', error)
    return createError('服务器错误', 500)
  }
}
