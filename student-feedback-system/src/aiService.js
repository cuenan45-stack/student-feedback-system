// 阿里通义千问 AI 服务
// 文档：https://help.aliyun.com/zh/dashscope/developer-reference/quick-start

const DASHSCOPE_API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY
const DASHSCOPE_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-analysis/generation'

export function checkAIConfig() {
  if (!DASHSCOPE_API_KEY) {
    console.warn('通义千问API Key未配置，请检查 .env.local 文件')
    return false
  }
  return true
}

// 分析视频并生成反馈
export async function analyzeVideoWithAI(studentName, videos, date, videoFileUrl) {
  if (!checkAIConfig()) {
    throw new Error('AI服务未配置，请联系管理员配置API Key')
  }

  try {
    // 构建提示词
    const prompt = buildPrompt(studentName, videos, date)

    // 调用通义千问多模态分析
    const response = await fetch(DASHSCOPE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus', // 支持视频理解的模型
        input: {
          messages: [
            {
              role: 'system',
              content: [
                {
                  type: 'text',
                  text: '你是一位专业的英语老师，擅长分析学生的英语学习视频。请根据视频内容判断：1. 学生是否点击了核对按钮 2. 发音是否准确 3. 词义是否正确 4. 如果错误是否进行了两英一中纠正 5. 给出具体的问题描述和改进建议。'
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
                    url: videoFileUrl
                  }
                }
              ]
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
      const error = await response.json()
      console.error('通义千问API错误:', error)
      throw new Error(`AI分析失败: ${error.message || response.statusText}`)
    }

    const data = await response.json()
    
    // 解析AI返回的结果
    const aiFeedback = data.output.choices[0].message.content
    
    // 提取问题详情（从AI分析中提取每个视频的问题）
    const issues = parseIssuesFromAI(aiFeedback, videos.length)
    
    return {
      feedback: formatFeedback(studentName, aiFeedback, date),
      issues: issues
    }

  } catch (error) {
    console.error('AI分析异常:', error)
    throw error
  }
}

// 构建提示词
function buildPrompt(studentName, videos, date) {
  const videoList = videos.map((v, i) => 
    `视频${i + 1}（时长：${v.duration}）：${v.issue || '无问题描述'}`
  ).join('\n')

  return `请分析学生 ${studentName} 的英语学习视频。

日期：${date}
视频列表：
${videoList}

请分析每个视频：
1. 学生是否完成了完整的流程（读单词→说中文→点击核对）？
2. 如果出现错误，是否进行了"两英一中"纠正？
3. 发音是否准确？
4. 词义是否正确？
5. 给出具体的问题描述和改进建议。

请以JSON格式返回分析结果，包含：
{
  "summary": "总体评价",
  "details": [
    { "videoIndex": 1, "issue": "具体问题", "suggestion": "改进建议" }
  ]
}`
}

// 从AI返回中提取问题详情
function parseIssuesFromAI(aiResponse, videoCount) {
  try {
    // 尝试解析JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      if (data.details && Array.isArray(data.details)) {
        return data.details.map(d => ({
          duration: '', // 需要从原视频数据获取
          issue: d.issue || ''
        }))
      }
    }
  } catch (e) {
    console.warn('解析AI返回失败，使用默认格式')
  }

  // 默认返回：每个视频一个问题
  return Array.from({ length: videoCount }, (_, i) => ({
    duration: '',
    issue: `视频${i + 1}：需要根据AI分析补充具体问题`
  }))
}

// 格式化反馈文本
function formatFeedback(studentName, aiFeedback, date) {
  const today = new Date().toLocaleDateString('zh-CN', { 
    month: 'numeric', 
    day: 'numeric' 
  })
  
  return `${aiFeedback}\n\n${today} ✅`
}

// 简化版分析（如果视频URL无法直接访问，使用文本分析）
export async function analyzeTextOnly(studentName, videos, date) {
  const prompt = buildPrompt(studentName, videos, date)
  
  // 调用通义千问文本模型
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
            content: '你是一位专业的英语老师，擅长给予学生积极、具体的反馈。'
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
    throw new Error('AI文本分析失败')
  }

  const data = await response.json()
  return {
    feedback: formatFeedback(studentName, data.output.choices[0].message.content, date),
    issues: parseIssuesFromAI(data.output.choices[0].message.content, videos.length)
  }
}
