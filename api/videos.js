// 使用 Edge Runtime 并配置新加坡区域
export const config = {
  runtime: 'edge',
  regions: ['sin1']  // 新加坡区域
}

// 使用官方 @supabase/supabase-js 客户端
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase环境变量未配置')
}

// 创建 Supabase 客户端，适配 Serverless 环境
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

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

// API: 获取学生视频列表
export async function GET(request) {
  try {
    console.log('API被调用 - 使用 @supabase/supabase-js 客户端')
    
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    let query = supabase
      .from('videos')
      .select('*')
      .order('upload_time', { ascending: false })
    
    // 如果指定学生ID，筛选该学生的视频
    if (studentId) {
      query = query.eq('student_id', studentId)
    } else {
      // 否则限制返回100条
      query = query.limit(100)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Supabase查询错误:', error.message, error)
      return createResponse({ videos: [], error: `查询失败: ${error.message}` }, 500)
    }
    
    console.log('查询成功，返回', data?.length || 0, '条记录')
    return createResponse({ videos: data || [] })
    
  } catch (error) {
    console.error('获取视频列表失败:', error.message, error)
    return createResponse({ videos: [], error: `获取失败: ${error.message}` }, 500)
  }
}

// API: 更新视频反馈
export async function PUT(request) {
  try {
    const body = await request.json()
    const { videoId, feedback, status } = body

    if (!videoId) {
      return createResponse({ error: '缺少videoId' }, 400)
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
      console.error('更新视频失败:', error.message, error)
      return createResponse({ error: `更新失败: ${error.message}` }, 500)
    }

    console.log('更新成功:', data)
    return createResponse({ success: true, video: data })
    
  } catch (error) {
    console.error('更新视频异常:', error.message, error)
    return createResponse({ error: `更新异常: ${error.message}` }, 500)
  }
}
