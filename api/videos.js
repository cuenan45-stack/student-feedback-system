// 使用 Supabase REST API 直接访问
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase环境变量未配置')
}

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

// 直接使用 fetch 访问 Supabase REST API
async function querySupabase(table, options = {}) {
  const { select = '*', order, limit, eq } = options
  
  let url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`
  
  if (order) {
    url += `&order=${encodeURIComponent(order)}`
  }
  if (limit) {
    url += `&limit=${limit}`
  }
  if (eq) {
    url += `&${encodeURIComponent(eq.column)}=eq.${encodeURIComponent(eq.value)}`
  }

  console.log('查询URL:', url.substring(0, 50) + '...')

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Supabase API错误:', response.status, errorText)
    throw new Error(`Supabase API错误: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

// API: 获取学生视频列表
export async function GET(request) {
  try {
    console.log('API被调用')
    
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    // 如果指定学生ID，返回该学生的视频
    if (studentId) {
      const data = await querySupabase('videos', {
        select: '*',
        eq: { column: 'student_id', value: studentId },
        order: 'upload_time.desc'
      })
      
      return createResponse({ videos: data || [] })
    }

    // 否则返回所有视频
    const data = await querySupabase('videos', {
      select: '*',
      order: 'upload_time.desc',
      limit: 100
    })

    console.log('查询成功，返回', data?.length || 0, '条记录')
    return createResponse({ videos: data || [] })
    
  } catch (error) {
    console.error('获取视频列表失败:', error.message)
    return createResponse({ videos: [], error: error.message }, 500)
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

    const url = `${supabaseUrl}/rest/v1/videos?id=eq.${videoId}`
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`更新失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return createResponse({ success: true, video: data[0] })
    
  } catch (error) {
    console.error('更新视频失败:', error)
    return createResponse({ error: error.message }, 500)
  }
}
