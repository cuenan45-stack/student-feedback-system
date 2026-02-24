import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase环境变量未配置')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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

// API: 获取学生视频列表
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    // 如果指定学生ID，返回该学生的视频
    if (studentId) {
      const { data, error } = await supabaseAdmin
        .from('videos')
        .select('*')
        .eq('student_id', studentId)
        .order('upload_time', { ascending: false })
      
      if (error) throw error
      return createResponse({ videos: data })
    }

    // 否则返回所有学生的最新视频统计
    const { data, error } = await supabaseAdmin
      .from('videos')
      .select(`
        *,
        student:students(id, name, wechat_group)
      `)
      .order('upload_time', { ascending: false })
      .limit(100)

    if (error) throw error

    return createResponse({ videos: data })
  } catch (error) {
    console.error('获取视频列表失败:', error)
    return createError('获取失败', 500)
  }
}

// API: 更新视频反馈
export async function PUT(request) {
  try {
    const body = await request.json()
    const { videoId, feedback, status } = body

    if (!videoId) {
      return createError('缺少videoId', 400)
    }

    const updateData = {}
    if (feedback !== undefined) updateData.feedback = feedback
    if (status !== undefined) updateData.status = status

    const { data, error } = await supabaseAdmin
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .select()
      .single()

    if (error) throw error

    return createResponse({
      success: true,
      video: data
    })
  } catch (error) {
    console.error('更新视频失败:', error)
    return createError('更新失败', 500)
  }
}
