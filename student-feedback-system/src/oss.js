// 阿里云 OSS 配置
const OSS_CONFIG = {
  region: import.meta.env.VITE_OSS_REGION,
  accessKeyId: import.meta.env.VITE_OSS_ACCESS_KEY_ID,
  accessKeySecret: import.meta.env.VITE_OSS_ACCESS_KEY_SECRET,
  bucket: import.meta.env.VITE_OSS_BUCKET
}

// 检查配置
export function checkOSSConfig() {
  const missing = []
  if (!OSS_CONFIG.region) missing.push('VITE_OSS_REGION')
  if (!OSS_CONFIG.accessKeyId) missing.push('VITE_OSS_ACCESS_KEY_ID')
  if (!OSS_CONFIG.accessKeySecret) missing.push('VITE_OSS_ACCESS_KEY_SECRET')
  if (!OSS_CONFIG.bucket) missing.push('VITE_OSS_BUCKET')
  
  if (missing.length > 0) {
    console.warn(`OSS配置缺失: ${missing.join(', ')}，请检查 .env.local 文件`)
    return false
  }
  return true
}

// 生成OSS签名（前端直传需要）
export async function getOSSUploadPolicy() {
  // 注意：生产环境应该由后端生成签名，避免暴露Secret
  // 这里为了简化，使用STS临时凭证或后端代理
  
  // 返回上传配置
  return {
    region: OSS_CONFIG.region,
    bucket: OSS_CONFIG.bucket,
    accessKeyId: OSS_CONFIG.accessKeyId,
    // 实际应该从后端获取临时token
    stsToken: null
  }
}

// 生成文件上传路径
export function generateUploadPath(studentId, fileName) {
  const timestamp = Date.now()
  const ext = fileName.split('.').pop()
  const random = Math.random().toString(36).substring(2, 8)
  return `videos/${studentId}/${timestamp}_${random}.${ext}`
}

// 获取文件完整URL
export function getFileUrl(bucket, key) {
  if (OSS_CONFIG.region === 'oss-cn-hangzhou') {
    return `https://${bucket}.${OSS_CONFIG.region}.aliyuncs.com/${key}`
  }
  return `https://${bucket}.${OSS_CONFIG.region}.aliyuncs.com/${key}`
}
