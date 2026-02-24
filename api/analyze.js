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

// 阿里云OSS客户端（用于生成签名URL）
const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
})

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY

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

// API: AI分析视频
export async function POST(request) {
  try {
    const body = await request.json()
    const { videoId, studentName, videos, date } = body

    if (!videoId || !studentName || !videos) {
      return createError('缺少必要参数', 400)
    }

    // 1. 获取视频信息
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return createError('视频不存在', 404)
    }

    // 2. 调用AI分析（使用STS签名URL，AI直接访问OSS）
    // video.object_key 是OSS路径，用于生成签名URL
    const analysisResult = await callDashScopeAI(studentName, videos, date, video, studentId)

    // 3. 更新视频记录
    const { data: updatedVideo, error: updateError } = await supabaseAdmin
      .from('videos')
      .update({
        ai_analysis: JSON.stringify(analysisResult),
        status: 'completed'
      })
      .eq('id', videoId)
      .select()
      .single()

    if (updateError) {
      console.error('更新视频状态失败:', updateError)
      return createError('分析完成但保存失败', 500)
    }

    return createResponse({
      success: true,
      video: updatedVideo,
      analysis: analysisResult
    })

  } catch (error) {
    console.error('AI分析失败:', error)
    return createError(`AI分析失败: ${error.message}`, 500)
  }
}

// 调用通义千问API（使用STS签名URL）
async function callDashScopeAI(studentName, videos, date, video, studentId) {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('通义千问API Key未配置')
  }

  // 构建提示词（简短，确保10秒内完成）
  const prompt = buildPrompt(studentName, videos, date)

  try {
    // 生成STS签名URL（有效期2小时，7200秒）
    // 注意：video.object_key 是从数据库获取的OSS路径
    const signedUrl = ossClient.signatureUrl(video.object_key, {
      expires: 7200,
      method: 'GET'
    })

    // 调用通义千问多模态分析
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-analysis/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
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
                    url: signedUrl  // 使用签名URL，AI可直接访问
                  }
                }
              ]
            }
          ]
        },
        parameters: {
          result_format: 'message',
          max_length: 800,  // 减少token，加快响应
          temperature: 0.5   // 降低随机性，加快生成
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('通义千问API错误:', error)
      
      // 如果视频分析失败，降级到文本分析
      if (response.status === 400 || response.status === 422) {
        console.warn('视频分析失败，降级到文本分析')
        return await callTextOnlyAI(studentName, videos, date)
      }
      
      throw new Error(error.message || 'AI API调用失败')
    }

    const data = await response.json()
    const aiText = data.output.choices[0].message.content

    // 解析结果
    return parseAIResult(aiText, videos.length)

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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
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

  if (!response.ok) {
    throw new Error('文本分析也失败')
  }

  const data = await response.json()
  return parseAIResult(data.output.choices[0].message.content, videos.length)
}

// 构建提示词（简短版，减少token）
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

  // 默认结构
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
