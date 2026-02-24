// 使用 Node.js Serverless Function + OSS + https 请求 Supabase 和 DashScope
import OSS from 'ali-oss'
import https from 'https'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY

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

// 使用 https 模块请求 DashScope API
function makeDashScopeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
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
    req.write(JSON.stringify(data))
    req.end()
  })
}

// API: AI分析视频
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' })
  }
  
  try {
    console.log('=== POST /api/analyze (AI分析) ===')
    
    const { videoId, studentName, videos, date } = req.body

    if (!videoId || !studentName || !videos) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    // 1. 获取视频信息
    const videoResponse = await makeSupabaseRequest(`/rest/v1/videos?id=eq.${videoId}&select=*`, 'GET')
    
    if (videoResponse.status !== 200 || !videoResponse.data || videoResponse.data.length === 0) {
      return res.status(404).json({ error: '视频不存在' })
    }
    
    const video = videoResponse.data[0]
    console.log('获取视频信息成功:', video.id)

    // 2. 调用AI分析
    const analysisResult = await callDashScopeAI(studentName, videos, date, video)
    console.log('AI分析完成')

    // 3. 更新视频记录
    const updateResponse = await makeSupabaseRequest(`/rest/v1/videos?id=eq.${videoId}`, 'PATCH', {
      ai_analysis: JSON.stringify(analysisResult),
      status: 'completed'
    })

    if (updateResponse.status >= 200 && updateResponse.status < 300) {
      console.log('更新视频记录成功')
      
      // 获取更新后的视频记录
      const updatedVideoResponse = await makeSupabaseRequest(`/rest/v1/videos?id=eq.${videoId}&select=*`, 'GET')
      
      return res.status(200).json({
        success: true,
        video: updatedVideoResponse.data?.[0] || video,
        analysis: analysisResult
      })
    } else {
      console.error('更新视频状态失败:', updateResponse.data)
      return res.status(500).json({ error: '分析完成但保存失败' })
    }

  } catch (error) {
    console.error('AI分析失败:', error)
    return res.status(500).json({ error: `AI分析失败: ${error.message}` })
  }
}

// 调用通义千问API
async function callDashScopeAI(studentName, videos, date, video) {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('通义千问API Key未配置')
  }

  const prompt = buildPrompt(studentName, videos, date)

  try {
    // 生成STS签名URL
    const signedUrl = ossClient.signatureUrl(video.object_key, {
      expires: 7200,
      method: 'GET'
    })

    // 调用通义千问多模态分析
    const response = await makeDashScopeRequest('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-analysis/generation', {
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

    if (response.status >= 200 && response.status < 300) {
      const aiText = response.data.output.choices[0].message.content
      return parseAIResult(aiText, videos.length)
    } else {
      console.error('通义千问API错误:', response.data)
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

  const response = await makeDashScopeRequest('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
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

  if (response.status >= 200 && response.status < 300) {
    return parseAIResult(response.data.output.choices[0].message.content, videos.length)
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
