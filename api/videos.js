// 使用 Edge Runtime 并配置新加坡区域
export const config = {
  runtime: 'edge',
  regions: ['sin1']  // 新加坡区域
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 直接使用 Supabase REST API
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

  console.log('Query URL:', url.substring(0, 60))

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
    console.error('HTTP Error:', response.status, errorText)
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }

  return await response.json()
}

// API: 获取学生视频列表
export async function GET(request) {
  try {
    console.log('=== API Called ===')
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Supabase Key exists:', !!supabaseServiceKey)
    
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    const options = {
      select: '*',
      order: 'upload_time.desc'
    }
    
    if (studentId) {
      options.eq = { column: 'student_id', value: studentId }
    } else {
      options.limit = 100
    }
    
    const data = await querySupabase('videos', options)
    
    console.log('Query success, returned', data?.length || 0, 'records')
    
    return new Response(JSON.stringify({ videos: data || [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('GET Error:', error.message, error.stack)
    return new Response(JSON.stringify({ 
      videos: [], 
      error: error.message 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

// API: 更新视频反馈
export async function PUT(request) {
  try {
    const body = await request.json()
    const { videoId, feedback, status } = body

    if (!videoId) {
      return new Response(JSON.stringify({ error: '缺少videoId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
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
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    return new Response(JSON.stringify({ success: true, video: data[0] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('PUT Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
