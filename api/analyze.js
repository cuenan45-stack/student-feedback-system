// 使用 Vercel Edge Runtime
export const config = {
  runtime: 'edge',
  regions: ['sin1']
}

import OSS from 'ali-oss'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY

// OSS 客户端配置
const ossConfig = {
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
}

// API: AI分析视频
export default async function handler(request) {
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: '方法不允许' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  try {
    console.log('=== POST /api/analyze (Edge) ===')
    
    const body = await request.json()
    const { videoId, studentName, videos, date } = body

    if (!videoId || !studentName || !videos) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. 获取视频信息
    const videoApiUrl = `${SUPABASE_URL}/rest/v1/videos?id=eq.${videoId}&select=*`
    const videoResponse = await fetch(videoApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    })
    
    if (!videoResponse.ok) {
      return new Response(
        JSON.stringify({ error: '视频不存在' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const videoData = await videoResponse.json()
    if (!videoData || videoData.length === 0) {
      return new Response(
        JSON.stringify({ error: '视频不存在' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const video = videoData[0]
    console.log('获取视频信息成功:', video.id)

    // 2. 调用AI分析
    const analysisResult = await callDashScopeAI(studentName, videos, date, video)
    console.log('AI分析完成')

    // 3. 更新视频记录
    const updateApiUrl = `${SUPABASE_URL}/rest/v1/videos?id=eq.${videoId}`
    const updateResponse = await fetch(updateApiUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ai_analysis: JSON.stringify(analysisResult),
        status: 'completed'
      })
    })

    if (updateResponse.ok) {
      console.log('更新视频记录成功')
      
      // 获取更新后的视频记录
      const updatedVideoResponse = await fetch(videoApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        }
      })
      
      const updatedVideoData = await updatedVideoResponse.json()
      
      return new Response(
        JSON.stringify({
          success: true,
          video: updatedVideoData?.[0] || video,
          analysis: analysisResult
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('更新视频状态失败')
      return new Response(
        JSON.stringify({ error: '分析完成但保存失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('AI分析失败:', error)
    return new Response(
      JSON.stringify({ error: `AI分析失败: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// 调用通义千问API
async function callDashScopeAI(studentName, videos, date, video) {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('通义千问API Key未配置')
  }

  const prompt = buildPrompt(studentName, videos, date)

  try {
    // 创建 OSS 客户端并生成STS签名URL
    const ossClient = new OSS(ossConfig)
    const signedUrl = ossClient.signatureUrl(video.object_key, {
      expires: 7200,
      method: 'GET'
    })

    // 调用通义千问多模态分析
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-analysis/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        input: {
          messages: [
            {
              role: 'system',
              content: [
                {
                  type: 'text',
                  text: '你是一位英语老师。分析学生视频：1.是否点击核对 2.发音准确吗 3.词义对吗 4.错误后是否两英一中纠正。用JSON返回：{"issues":[{"issue":"问题描述"}],"feedback":"完整反馈"}'
                }
              ]
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'video_url',
                  video_url: {
                    url: signedUrl
                  }
                }
              ]
            }
          ]
        },
        parameters: {
          result_format: 'message',
          max_length: 800,
          temperature: 0.5
        }
      })
    })

    if (response.ok) {
      const data = await response.json()
      const aiText = data.output.choices[0].message.content
      return parseAIResult(aiText, videos.length)
    } else {
      console.error('通义千问API错误')
      // 降级到文本分析
      return await callTextOnlyAI(studentName, videos, date)
    }

  } catch (error) {
    console.error('通义千问调用异常:', error)
    // 降级到文本分析
    return await callTextOnlyAI(studentName, videos, date)
  }
}

// 纯文本分析（备用方案）
async function callTextOnlyAI(studentName, videos, date) {
  const prompt = buildPrompt(studentName, videos, date)

  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'system',
            content: '你是一位专业的英语老师，根据学生视频的问题描述生成反馈。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        result_format: 'message',
        max_length: 1000,
        temperature: 0.7
      }
    })
  })

  if (response.ok) {
    const data = await response.json()
    return parseAIResult(data.output.choices[0].message.content, videos.length)
  } else {
    throw new Error('文本分析也失败')
  }
}

// 构建提示词
function buildPrompt(studentName, videos, date) {
  const videoList = videos.map((v, i) => 
    `视频${i + 1}（${v.duration}）：${v.issue || '无'}`
  ).join('\n')

  return `学生：${studentName}
日期：${date}
视频：
${videoList}

分析：1.流程正确吗 2.发音准吗 3.词义对吗 4.是否两英一中纠正

返回JSON：{"issues":[{"issue":"问题"}],"feedback":"完整反馈"}`
}

// 解析AI结果
function parseAIResult(aiText, videoCount) {
  try {
    const jsonMatch = aiText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      return {
        summary: data.summary || '分析完成',
        issues: data.issues || [],
        feedback: data.feedback || aiText,
        raw: aiText
      }
    }
  } catch (e) {
    console.warn('解析JSON失败，使用原始文本')
  }

  return {
    summary: '分析完成',
    issues: Array.from({ length: videoCount }, (_, i) => ({
      videoIndex: i + 1,
      issue: '需要根据视频内容补充',
      suggestion: '继续努力'
    })),
    feedback: aiText,
    raw: aiText
  }
}
