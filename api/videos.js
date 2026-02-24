// 使用 Vercel Edge Runtime
export const config = {
  runtime: 'edge',
  regions: ['sin1'] // 新加坡区域，离 Supabase 亚太区域近
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// API: 获取学生视频列表
export default async function handler(request) {
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  
  if (request.method === 'GET') {
    try {
      console.log('=== GET /api/videos (Edge) ===')
      console.log('SUPABASE_URL:', SUPABASE_URL)
      
      const url = new URL(request.url)
      const studentId = url.searchParams.get('studentId')
      
      // 构建 Supabase REST API URL
      let apiUrl = `${SUPABASE_URL}/rest/v1/videos?select=*,student:students(id,name,wechat_group)&order=upload_time.desc`
      
      if (studentId) {
        apiUrl += `&student_id=eq.${encodeURIComponent(studentId)}`
      } else {
        apiUrl += '&limit=100'
      }
      
      console.log('请求 URL:', apiUrl)
      
      // 使用 Edge Runtime 的 fetch
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('响应状态:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('查询成功，返回', data?.length || 0, '条记录')
        return new Response(
          JSON.stringify({ videos: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        const errorText = await response.text()
        console.error('Supabase API 错误:', errorText)
        return new Response(
          JSON.stringify({ videos: [], error: `查询失败: ${errorText}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
    } catch (error) {
      console.error('GET处理错误:', error)
      return new Response(
        JSON.stringify({ videos: [], error: `服务器错误: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
  
  if (request.method === 'PUT') {
    try {
      console.log('=== PUT /api/videos (Edge) ===')
      
      const body = await request.json()
      const { videoId, feedback, status } = body
      
      if (!videoId) {
        return new Response(
          JSON.stringify({ error: '缺少videoId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const updateData = {}
      if (feedback !== undefined) updateData.feedback = feedback
      if (status !== undefined) updateData.status = status
      
      const apiUrl = `${SUPABASE_URL}/rest/v1/videos?id=eq.${videoId}`
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('更新成功:', data)
        return new Response(
          JSON.stringify({ success: true, video: data?.[0] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        const errorText = await response.text()
        console.error('Supabase API 错误:', errorText)
        return new Response(
          JSON.stringify({ error: `更新失败: ${errorText}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
    } catch (error) {
      console.error('PUT处理错误:', error)
      return new Response(
        JSON.stringify({ error: `服务器错误: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return new Response(
    JSON.stringify({ error: '方法不允许' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
