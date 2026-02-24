// 使用 Vercel Edge Runtime
export const config = {
  runtime: 'edge',
  regions: ['sin1']
}

import OSS from 'ali-oss'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// OSS 客户端配置
const ossConfig = {
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
}

// API: 学生视频上传
export default async function handler(request) {
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  
  // GET: 获取OSS上传签名
  if (request.method === 'GET') {
    try {
      console.log('=== GET /api/upload (Edge) ===')
      
      const url = new URL(request.url)
      const studentId = url.searchParams.get('studentId')
      const fileName = url.searchParams.get('fileName')
      
      if (!studentId || !fileName) {
        return new Response(
          JSON.stringify({ error: '缺少参数' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 生成OSS上传路径
      const timestamp = Date.now()
      const ext = fileName.split('.').pop()
      const random = Math.random().toString(36).substring(2, 8)
      const objectKey = `videos/${studentId}/${timestamp}_${random}.${ext}`

      // 创建 OSS 客户端并获取签名URL
      const ossClient = new OSS(ossConfig)
      
      const signedUrl = await ossClient.signatureUrl(objectKey, {
        expires: 3600,
        method: 'PUT',
        contentType: 'video/mp4'
      })

      const fileUrl = ossClient.address(objectKey)

      console.log('生成签名成功:', objectKey)
      
      return new Response(
        JSON.stringify({
          success: true,
          uploadUrl: signedUrl,
          fileUrl: fileUrl,
          objectKey: objectKey
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('获取上传签名失败:', error)
      return new Response(
        JSON.stringify({ error: '获取上传签名失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
  
  // POST: 保存视频记录到数据库
  if (request.method === 'POST') {
    try {
      console.log('=== POST /api/upload (Edge) ===')
      
      const body = await request.json()
      const { student_id, file_name, file_url, file_size, duration, object_key } = body

      if (!student_id || !file_url) {
        return new Response(
          JSON.stringify({ error: '缺少必要参数' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 使用 Edge Runtime 的 fetch 保存到 Supabase
      const apiUrl = `${SUPABASE_URL}/rest/v1/videos`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id,
          file_name,
          file_url,
          object_key: object_key || null,
          file_size: file_size || null,
          duration: duration || null,
          status: 'pending',
          upload_time: new Date().toISOString()
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('保存视频记录成功')
        return new Response(
          JSON.stringify({ success: true, video: data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        const errorText = await response.text()
        console.error('保存视频记录失败:', errorText)
        return new Response(
          JSON.stringify({ error: '保存失败' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (error) {
      console.error('保存视频记录异常:', error)
      return new Response(
        JSON.stringify({ error: '服务器错误' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return new Response(
    JSON.stringify({ error: '方法不允许' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
