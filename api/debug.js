export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' })
  }
  
  // 检查环境变量（隐藏敏感信息）
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasOssRegion = !!process.env.OSS_REGION
  const hasOssKeyId = !!process.env.OSS_ACCESS_KEY_ID
  const hasOssSecret = !!process.env.OSS_ACCESS_KEY_SECRET
  const hasOssBucket = !!process.env.OSS_BUCKET
  const hasDashScopeKey = !!process.env.DASHSCOPE_API_KEY
  
  return res.status(200).json({
    env: {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_URL_LENGTH: supabaseUrl.length,
      HAS_SUPABASE_SERVICE_KEY: hasServiceKey,
      HAS_OSS_REGION: hasOssRegion,
      HAS_OSS_KEY_ID: hasOssKeyId,
      HAS_OSS_SECRET: hasOssSecret,
      HAS_OSS_BUCKET: hasOssBucket,
      HAS_DASHSCOPE_KEY: hasDashScopeKey
    },
    message: '环境变量检查完成'
  })
}
