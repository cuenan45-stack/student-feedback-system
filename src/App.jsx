import { useState, useCallback, useRef, useEffect } from 'react'

// 模拟数据
const mockData = [
  {
    id: "A",
    name: "学生 A",
    date: "1月27日",
    status: "pending",
    videos: [
      { duration: "01:20", issue: "发音准确，流程正确，继续保持！" },
      { duration: "03:15", issue: "apple 读音有误后未进行'两英一中'纠正，需要注意" },
      { duration: "02:10", issue: "整体表现良好，注意语速控制" }
    ],
    feedback: "宝贝，今天表现很棒！你采用了优秀生流程（先自读再核对）。但在视频2中 apple 读音有误后未进行'两英一中'纠正。继续加油！\n\n1.25 ✅ 1.26 ✅ 1.27 ✅",
    wechatGroup: "一年级英语打卡群A"
  },
  {
    id: "B",
    name: "学生 B",
    date: "1月27日",
    status: "pending",
    videos: [
      { duration: "01:00", issue: "流程正确，发音标准" },
      { duration: "02:00", issue: "流程正确，词义和发音都没有问题" },
      { duration: "01:30", issue: "注意下 book 和 look 两个词汇的发音混淆" },
      { duration: "00:45", issue: "时间较短，建议完整跟读" }
    ],
    feedback: "今天整体流畅，但流程上稍微有点偷懒哦，建议尝试先自读再听音。内容上全部正确！\n\n1.25 ✅ 1.26 ❌ 1.27 ✅",
    wechatGroup: "一年级英语打卡群B"
  },
  {
    id: "C",
    name: "学生 C",
    date: "1月27日",
    status: "pending",
    videos: [
      { duration: "02:30", issue: "朗读有感情，发音标准，非常棒！" },
      { duration: "01:45", issue: "流程正确，继续保持这种学习状态" }
    ],
    feedback: "今天的朗读非常有感情！发音也很标准。继续保持这种学习状态！\n\n1.25 ✅ 1.26 ✅ 1.27 ✅",
    wechatGroup: "一年级英语打卡群A"
  },
  {
    id: "D",
    name: "学生 D",
    date: "1月27日",
    status: "pending",
    videos: [
      { duration: "00:55", issue: "时间偏短，建议放慢节奏" },
      { duration: "02:20", issue: "注意 th 音的发音方式，舌尖要轻触上齿" },
      { duration: "01:10", issue: "整体不错，注意句子停顿" },
      { duration: "03:00", issue: "时长充足，但中间有分心，建议专注" },
      { duration: "01:30", issue: "发音准确，流程正确" }
    ],
    feedback: "今天完成了5个视频，学习量很足！建议注意发音细节，特别是th音的发音方式。\n\n1.25 ❌ 1.26 ✅ 1.27 ✅",
    wechatGroup: "一年级英语打卡群C"
  },
  {
    id: "12345678",
    name: "李明",
    date: "1月27日",
    status: "pending",
    videos: [
      { duration: "02:15", issue: "整体表现不错，注意单词重音" },
      { duration: "01:50", issue: "发音清晰，建议多练习连读" }
    ],
    feedback: "李明同学今天表现很好！发音清晰，学习态度认真。建议多练习单词重音和连读技巧。\n\n1.25 ✅ 1.26 ✅ 1.27 ✅",
    wechatGroup: "一年级英语打卡群A"
  }
]

// 学生账号数据（独立管理）
let studentAccounts = JSON.parse(localStorage.getItem('studentAccounts')) || [
  { id: "A", name: "学生 A", password: "", wechatGroup: "一年级英语打卡群A" },
  { id: "B", name: "学生 B", password: "", wechatGroup: "一年级英语打卡群B" },
  { id: "C", name: "学生 C", password: "", wechatGroup: "一年级英语打卡群A" },
  { id: "D", name: "学生 D", password: "", wechatGroup: "一年级英语打卡群C" },
  { id: "12345678", name: "李明", password: "", wechatGroup: "一年级英语打卡群A" }
]

// 保存学生账号到localStorage
const saveStudentAccounts = () => {
  localStorage.setItem('studentAccounts', JSON.stringify(studentAccounts))
}

// 获取学生账号列表
const getStudentAccounts = () => studentAccounts

// 添加学生账号
const addStudentAccount = (account) => {
  studentAccounts.push(account)
  saveStudentAccounts()
}

// 更新学生账号
const updateStudentAccount = (id, updates) => {
  const index = studentAccounts.findIndex(a => a.id === id)
  if (index !== -1) {
    studentAccounts[index] = { ...studentAccounts[index], ...updates }
    saveStudentAccounts()
  }
}

// 删除学生账号
const deleteStudentAccount = (id) => {
  studentAccounts = studentAccounts.filter(a => a.id !== id)
  saveStudentAccounts()
}

// 图标组件
const ChevronIcon = ({ expanded }) => (
  <svg className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const UploadIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
)

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
    <span className="ml-2 text-gray-500">AI 正在深度解析中...</span>
  </div>
)

// 提醒通知组件
function Notification({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-20 right-6 z-50 p-4 rounded-lg shadow-lg animate-slide-in ${
      type === 'warning' ? 'bg-amber-100 border border-amber-300 text-amber-800' :
      type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
      'bg-blue-100 border border-blue-300 text-blue-800'
    }`}>
      <div className="flex items-center gap-3">
        <BellIcon />
        <div>
          <p className="font-medium">{message.title}</p>
          <p className="text-sm opacity-80">{message.content}</p>
        </div>
        <button onClick={onClose} className="ml-4 text-lg leading-none hover:opacity-70">&times;</button>
      </div>
    </div>
  )
}

// 学生视频提交页面
function StudentUploadPage({ studentId, studentName, onBack }) {
  const [uploads, setUploads] = useState([])
  const [currentUpload, setCurrentUpload] = useState(null)
  const [uploadHistory, setUploadHistory] = useState(() => {
    const saved = localStorage.getItem(`uploadHistory_${studentId}`)
    return saved ? JSON.parse(saved) : []
  })
  const [error, setError] = useState('')

  useEffect(() => {
    localStorage.setItem(`uploadHistory_${studentId}`, JSON.stringify(uploadHistory))
  }, [uploadHistory, studentId])

  const handleFileSelect = async (e) => {
    // 检查 studentId 是否有效
    if (!studentId || studentId === 'undefined') {
      setError('学生ID无效，请通过正确的链接访问此页面')
      return
    }

    const files = Array.from(e.target.files)
    setError('')

    // 限制：单个文件不超过20MB，视频时长不超过60秒
    const MAX_FILE_SIZE = 20 * 1024 * 1024  // 20MB
    const MAX_DURATION = 60  // 60秒

    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      
      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        setError(`文件 ${file.name} 超过20MB限制，请压缩后上传`)
        return
      }
      
      // 检查视频时长
      const duration = await getVideoDuration(file)
      if (duration > MAX_DURATION) {
        setError(`视频 ${file.name} 时长超过60秒，请剪辑后上传`)
        return
      }
      
      const uploadId = Date.now() + index
      
      const newUpload = {
        id: uploadId,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
        progress: 0,
        status: 'uploading',
        date: new Date().toLocaleString('zh-CN')
      }
      
      setCurrentUpload(newUpload)
      setUploads(prev => [...prev, newUpload])

      try {
        console.log('开始上传，studentId:', studentId)
        
        // 步骤1：获取OSS上传签名
        console.log('请求签名...')
        const signResponse = await fetch(`/api/upload?studentId=${studentId}&fileName=${encodeURIComponent(file.name)}`)
        console.log('签名响应状态:', signResponse.status)
        
        if (!signResponse.ok) {
          const errorText = await signResponse.text()
          console.error('获取签名失败:', errorText)
          throw new Error('获取上传签名失败: ' + errorText)
        }
        const signData = await signResponse.json()
        console.log('签名数据:', signData)
        
        if (!signData.success) {
          throw new Error(signData.error || '获取上传签名失败')
        }

        // 步骤2：直接上传到OSS
        const uploadResult = await uploadToOSS(file, signData.uploadUrl)
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || '上传失败')
        }

        // 步骤3：保存记录到数据库
        const saveResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            file_name: file.name,
            file_url: signData.fileUrl,
            object_key: signData.objectKey,  // 保存OSS路径
            file_size: file.size,
            duration: '' // 可以后续提取视频时长
          })
        })

        if (!saveResponse.ok) {
          throw new Error('保存记录失败')
        }

        const saveData = await saveResponse.json()

        // 更新状态为完成
        setUploads(prev => prev.map(u => 
          u.id === uploadId ? { ...u, progress: 100, status: 'completed', videoId: saveData.video.id } : u
        ))
        
        setUploadHistory(prev => [{
          ...newUpload,
          progress: 100,
          status: 'completed',
          videoId: saveData.video.id
        }, ...prev].slice(0, 30))

      } catch (err) {
        console.error('上传失败:', err)
        setUploads(prev => prev.map(u => 
          u.id === uploadId ? { ...u, status: 'error', error: err.message } : u
        ))
        setError(`上传失败: ${err.message}`)
      }
    }

    setTimeout(() => setCurrentUpload(null), 1000)
  }

  // 获取视频时长
  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.src = URL.createObjectURL(file)
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }
      video.onerror = () => {
        resolve(0) // 无法获取时长，默认0
      }
    })
  }

  // 上传文件到OSS
  const uploadToOSS = async (file, signedUrl) => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', signedUrl)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded * 100) / e.total)
          setUploads(prev => prev.map(u => 
            u.id === currentUpload?.id ? { ...u, progress } : u
          ))
        }
      }
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: `HTTP ${xhr.status}` })
        }
      }
      xhr.onerror = () => {
        resolve({ success: false, error: '网络错误' })
      }
      xhr.send(file)
    })
  }

  // 如果 studentId 无效，显示登录提示
  if (!studentId || studentId === 'undefined') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <InfoIcon />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">无法识别学生身份</h2>
          <p className="text-gray-600 mb-6">请通过学生登录页面访问上传功能</p>
          <button 
            onClick={() => window.location.href = '/student'}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            前往登录页面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white shadow-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <BackIcon />
            <span>返回</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{studentName || '学生'} - 视频提交</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* 上传区域 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UploadIcon className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">上传学习视频</h2>
            <p className="text-gray-500 mb-6">支持 MP4、MOV 格式，单个文件不超过 500MB</p>
            
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
              <PlusIcon />
              <span>选择视频文件</span>
              <input type="file" accept="video/*" multiple className="hidden" onChange={handleFileSelect} />
            </label>
          </div>
        </div>

        {/* 当前上传进度 */}
        {uploads.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">上传进度</h3>
            <div className="space-y-4">
              {uploads.map(upload => (
                <div key={upload.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {upload.status === 'completed' ? (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckIcon className="w-5 h-5 text-green-500" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UploadIcon className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{upload.name}</p>
                        <p className="text-sm text-gray-500">{upload.size} MB</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${
                      upload.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {upload.status === 'completed' ? '上传完成' : `${upload.progress}%`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        upload.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 上传历史 */}
        {uploadHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">上传记录</h3>
            <div className="space-y-3">
              {uploadHistory.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 font-medium">已完成</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// 老师登录/入口页面
function TeacherLoginPage({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === 'teacher123') {
      localStorage.setItem('teacherLoggedIn', 'true')
      onLogin()
    } else {
      setError('密码错误，请重试')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-96">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">教师登录</h1>
          <p className="text-gray-500 mt-2">学生视频反馈系统</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">登录密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="请输入密码"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            进入系统
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">默认密码: teacher123</p>
        </div>
      </div>
    </div>
  )
}

// 学生账号管理页面
function StudentManagePage({ onBack }) {
  const [accounts, setAccounts] = useState(() => getStudentAccounts())
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ id: '', name: '', password: '', wechatGroup: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const wechatGroups = ['一年级英语打卡群A', '一年级英语打卡群B', '一年级英语打卡群C']

  const handleEdit = (account) => {
    setEditingId(account.id)
    setFormData({ 
      id: account.id, 
      name: account.name, 
      password: account.password || '', 
      wechatGroup: account.wechatGroup || '' 
    })
  }

  const handleSave = (originalId) => {
    if (formData.name.trim() && formData.id.trim()) {
      updateStudentAccount(originalId, {
        id: formData.id,
        name: formData.name,
        password: formData.password,
        wechatGroup: formData.wechatGroup
      })
      setAccounts(getStudentAccounts())
      setEditingId(null)
      setFormData({ id: '', name: '', password: '', wechatGroup: '' })
    }
  }

  const handleAdd = () => {
    if (formData.id.trim() && formData.name.trim()) {
      // 检查ID是否已存在
      if (accounts.some(a => a.id === formData.id)) {
        alert('该学生ID已存在！')
        return
      }
      addStudentAccount({
        id: formData.id,
        name: formData.name,
        password: formData.password,
        wechatGroup: formData.wechatGroup || wechatGroups[0]
      })
      setAccounts(getStudentAccounts())
      setFormData({ id: '', name: '', password: '', wechatGroup: '' })
      setShowAddForm(false)
    }
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除该学生账号吗？')) {
      deleteStudentAccount(id)
      setAccounts(getStudentAccounts())
    }
  }

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const copyStudentLink = (id) => {
    const link = `${window.location.origin}/student?id=${encodeURIComponent(id)}`
    navigator.clipboard.writeText(link)
    alert('学生登录链接已复制！')
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-white shadow-md flex items-center justify-between px-6 z-50">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <BackIcon />
          <span>返回</span>
        </button>
        <h1 className="text-xl font-semibold text-gray-700">学生账号管理</h1>
        <div className="w-20"></div>
      </header>

      <main className="flex-1 mt-[60px] p-6">
        <div className="max-w-5xl mx-auto">
          {/* 搜索和添加 */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索学生姓名或ID..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button 
              onClick={() => setShowAddForm(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              <PlusIcon />
              <span>添加学生</span>
            </button>
          </div>

          {/* 添加表单 */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-4 border-2 border-blue-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">添加新学生</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学生ID *</label>
                  <input 
                    type="text" 
                    value={formData.id} 
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    placeholder="如：12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    placeholder="如：李明"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                  <input 
                    type="text" 
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" 
                    placeholder="可选"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所属班级</label>
                  <select 
                    value={formData.wechatGroup} 
                    onChange={(e) => setFormData({ ...formData, wechatGroup: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {wechatGroups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => { setShowAddForm(false); setFormData({ id: '', name: '', password: '', wechatGroup: '' }) }} 
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleAdd} 
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          )}

          {/* 学生列表 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">学生ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">姓名</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">所属班级</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">登录链接</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    {editingId === account.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            value={formData.id} 
                            onChange={(e) => setFormData({ ...formData, id: e.target.value })} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={formData.wechatGroup} 
                            onChange={(e) => setFormData({ ...formData, wechatGroup: e.target.value })} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:界面-2 focus:ring-blue-400"
                          >
                            {wechatGroups.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => setEditingId(null)} 
                              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                            >
                              取消
                            </button>
                            <button 
                              onClick={() => handleSave(account.id)} 
                              className="px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
                            >
                              保存
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">{account.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{account.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{account.wechatGroup}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => copyStudentLink(account.id)} 
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-sm"
                          >
                            <LinkIcon />
                            <span>复制链接</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleEdit(account)} 
                              className="px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm"
                            >
                              编辑
                            </button>
                            <button 
                              onClick={() => handleDelete(account.id)} 
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAccounts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                没有找到匹配的学生账号
              </div>
            )}
          </div>

          {/* 统计信息 */}
          <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
            <span>共 {accounts.length} 名学生</span>
            <span>已筛选: {filteredAccounts.length} 名</span>
          </div>
        </div>
      </main>
    </div>
  )
}

// AI设置页面
function AISettingsPage({ onBack, config, onSave }) {
  const [localConfig, setLocalConfig] = useState(config)
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  const handleSave = () => {
    if (!localConfig.apiKey.trim()) {
      alert('请输入API Key')
      return
    }
    onSave({
      enabled: true,
      apiKey: localConfig.apiKey.trim()
    })
  }

  const handleTest = async () => {
    if (!localConfig.apiKey.trim()) {
      alert('请先输入API Key')
      return
    }
    
    setTesting(true)
    setTestResult(null)
    
    try {
      // 测试通义千问API
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localConfig.apiKey}`
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          input: {
            messages: [
              {
                role: 'user',
                content: '你好，请回复"测试成功"'
              }
            ]
          },
          parameters: {
            result_format: 'message',
            max_length: 50
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult({
          success: true,
          message: 'API Key有效，连接成功！',
          response: data.output.choices[0].message.content
        })
      } else {
        const error = await response.json()
        setTestResult({
          success: false,
          message: `API调用失败: ${error.message || response.statusText}`,
          response: null
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `网络错误: ${err.message}`,
        response: null
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-white shadow-md flex items-center justify-between px-6 z-50">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <BackIcon />
          <span>返回</span>
        </button>
        <h1 className="text-xl font-semibold text-gray-700">AI设置</h1>
        <div className="w-20"></div>
      </header>

      <main className="flex-1 mt-[60px] p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">通义千问配置</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={localConfig.apiKey}
                  onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="请输入通义千问API Key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  申请地址：https://help.aliyun.com/zh/dashscape/developer-reference/quick-start
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="px-6 py-2.5 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                >
                  {testing ? '测试中...' : '测试连接'}
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  保存配置
                </button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResult.success ? '✅' : '❌'} {testResult.message}
                  </p>
                  {testResult.response && (
                    <p className="text-sm text-gray-600 mt-2">
                      回复：{testResult.response}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">使用说明</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p>1. 点击上方链接申请通义千问API Key（新用户有免费额度）</p>
              <p>2. 将API Key粘贴到输入框中</p>
              <p>3. 点击"测试连接"验证API Key是否有效</p>
              <p>4. 点击"保存配置"完成设置</p>
              <p>5. 返回主页面，点击"AI一键反馈"即可自动分析学生视频</p>
              <p className="text-amber-600 font-medium mt-4">
                ⚠️ 注意：API Key保存在浏览器本地，不会上传到任何第三方服务器
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// 微信群管理页面
function WechatGroupForm({ onBack, initialData, onSave, onGenerateLinks }) {
  const [groups, setGroups] = useState(initialData || [
    { id: '1', name: '一年级英语打卡群A', members: 45, description: '一年级A班英语学习打卡专用群' },
    { id: '2', name: '一年级英语打卡群B', members: 42, description: '一年级B班英语学习打卡专用群' },
    { id: '3', name: '一年级英语打卡群C', members: 38, description: '一年级C班英语学习打卡专用群' }
  ])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', members: '', description: '' })
  const [showAddForm, setShowAddForm] = useState(false)

  const handleEdit = (group) => {
    setEditingId(group.id)
    setFormData({ name: group.name, members: group.members, description: group.description })
  }

  const handleSave = (id) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...formData, members: parseInt(formData.members) || 0 } : g))
    setEditingId(null)
    setFormData({ name: '', members: '', description: '' })
  }

  const handleAdd = () => {
    if (formData.name.trim()) {
      const newGroup = {
        id: Date.now().toString(),
        name: formData.name,
        members: parseInt(formData.members) || 0,
        description: formData.description
      }
      setGroups(prev => [...prev, newGroup])
      setFormData({ name: '', members: '', description: '' })
      setShowAddForm(false)
    }
  }

  const handleDelete = (id) => {
    setGroups(prev => prev.filter(g => g.id !== id))
  }

  const handleSaveAll = () => {
    onSave(groups)
    onGenerateLinks(groups)
  }

  const copyLink = (link) => {
    navigator.clipboard.writeText(link)
    alert('链接已复制到剪贴板！')
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-white shadow-md flex items-center justify-between px-6 z-50">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <BackIcon />
          <span>返回</span>
        </button>
        <h1 className="text-xl font-semibold text-gray-700">微信群管理</h1>
        <button onClick={handleSaveAll} className="px-6 py-2.5 rounded-lg font-medium text-white bg-green-500 hover:bg-green-600 transition-all">
          保存并生成链接
        </button>
      </header>

      <main className="flex-1 mt-[60px] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700">微信群列表</h2>
            <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              <PlusIcon />
              <span>添加群</span>
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-4 border-2 border-blue-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">添加新群</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">群名称</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="请输入群名称" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成员数</label>
                  <input type="number" value={formData.members} onChange={(e) => setFormData({ ...formData, members: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="请输入成员数" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">群描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-20" placeholder="请输入群描述" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setShowAddForm(false); setFormData({ name: '', members: '', description: '' }) }} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
                <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">添加</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl shadow-sm p-5">
                {editingId === group.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">群名称</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">成员数</label>
                        <input type="number" value={formData.members} onChange={(e) => setFormData({ ...formData, members: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">群描述</label>
                      <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-20" />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
                      <button onClick={() => handleSave(group.id)} className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">保存</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-800">{group.name}</h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{group.members} 人</span>
                      </div>
                      <p className="text-gray-600">{group.description}</p>
                      {group.studentLink && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">学生提交链接：</p>
                          <div className="flex items-center gap-2">
                            <input type="text" value={group.studentLink} readOnly className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm" />
                            <button onClick={() => copyLink(group.studentLink)} className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">复制</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => handleEdit(group)} className="px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm">编辑</button>
                      <button onClick={() => handleDelete(group.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><TrashIcon /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// 主反馈系统页面
function FeedbackSystem({ onLogout }) {
  const [students, setStudents] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [highlightedId, setHighlightedId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStudentId, setProcessingStudentId] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [currentPage, setCurrentPage] = useState('main')
  const [wechatGroups, setWechatGroups] = useState([])
  const [notification, setNotification] = useState(null)
  const [aiConfig, setAiConfig] = useState(() => {
    return JSON.parse(localStorage.getItem('aiConfig')) || {
      enabled: false,
      apiKey: ''
    }
  })
  const [showAISettings, setShowAISettings] = useState(false)
  const [error, setError] = useState('')

  // 加载学生视频数据
  const loadStudentVideos = useCallback(async () => {
    try {
      const response = await fetch('/api/videos')
      if (!response.ok) {
        throw new Error('获取视频列表失败')
      }
      const data = await response.json()
      
      // 将视频数据转换为学生列表格式
      const studentMap = new Map()
      data.videos.forEach(video => {
        if (!studentMap.has(video.student.id)) {
          studentMap.set(video.student.id, {
            id: video.student.id,
            name: video.student.name,
            date: new Date(video.upload_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
            status: video.status,
            wechatGroup: video.student.wechat_group,
            videos: [],
            feedback: video.feedback || '',
            videoId: video.id // 保存视频ID用于AI分析
          })
        }
        const student = studentMap.get(video.student.id)
        student.videos.push({
          duration: video.duration || '未知',
          issue: video.ai_analysis ? JSON.parse(video.ai_analysis).issues?.[0]?.issue || '待分析' : '待分析'
        })
      })
      
      setStudents(Array.from(studentMap.values()))
    } catch (err) {
      console.error('加载数据失败:', err)
      setError('加载数据失败，请刷新重试')
    }
  }, [])

  useEffect(() => {
    loadStudentVideos()
    // 每分钟刷新一次数据
    const interval = setInterval(loadStudentVideos, 60000)
    return () => clearInterval(interval)
  }, [loadStudentVideos])

  const leftScrollRef = useRef(null)
  const rightScrollRef = useRef(null)
  const studentRefs = useRef({})
  const feedbackRefs = useRef({})

  // 22:00 提醒功能
  useEffect(() => {
    const checkReminder = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      
      // 22:00 提醒
      if (hours === 22 && minutes === 0) {
        const pendingCount = students.filter(s => s.status === 'pending').length
        if (pendingCount > 0) {
          setNotification({
            title: '📹 每日视频收集提醒',
            content: `今日已收集 ${students.length} 位学生的视频，其中 ${pendingCount} 位待反馈。请及时完成反馈工作！`
          })
        }
      }
    }

    // 每分钟检查一次
    const interval = setInterval(checkReminder, 60000)
    checkReminder() // 立即检查一次

    return () => clearInterval(interval)
  }, [students])

  const syncScrollToStudent = useCallback((studentId) => {
    requestAnimationFrame(() => {
      const leftContainer = leftScrollRef.current
      const rightContainer = rightScrollRef.current
      const studentEl = studentRefs.current[studentId]
      const feedbackEl = feedbackRefs.current[studentId]

      if (!leftContainer || !rightContainer || !studentEl || !feedbackEl) return

      const studentHeader = studentEl.querySelector('.student-header') || studentEl
      const feedbackHeader = feedbackEl.querySelector('.feedback-header') || feedbackEl
      
      const studentRect = studentHeader.getBoundingClientRect()
      const feedbackRect = feedbackHeader.getBoundingClientRect()
      const leftContainerRect = leftContainer.getBoundingClientRect()
      const rightContainerRect = rightContainer.getBoundingClientRect()
      
      const studentRelativeTop = studentRect.top - leftContainerRect.top
      const feedbackRelativeTop = feedbackRect.top - rightContainerRect.top
      
      const targetTop = 10
      const leftScrollNeeded = studentRelativeTop - targetTop
      const rightScrollNeeded = feedbackRelativeTop - targetTop
      
      if (Math.abs(leftScrollNeeded) > 5) {
        leftContainer.scrollBy({ top: leftScrollNeeded, behavior: 'smooth' })
      }
      
      if (Math.abs(rightScrollNeeded) > 5) {
        rightContainer.scrollBy({ top: rightScrollNeeded, behavior: 'smooth' })
      }
    })
  }, [])

  const toggleExpand = useCallback((id) => {
    setExpandedId(prev => {
      const newId = prev === id ? null : id
      
      if (newId !== null) {
        setHighlightedId(id)
        requestAnimationFrame(() => {
          setTimeout(() => {
            syncScrollToStudent(id)
          }, 50)
        })
        setTimeout(() => setHighlightedId(null), 1000)
      } else {
        setHighlightedId(null)
      }
      
      return newId
    })
  }, [syncScrollToStudent])

  const handleAIFeedback = useCallback(async () => {
    if (!aiConfig.enabled || !aiConfig.apiKey) {
      setShowAISettings(true)
      setError('请先配置AI API Key')
      return
    }

    setIsProcessing(true)
    setError('')
    
    // 找出所有待处理的学生
    const pendingStudents = students.filter(s => s.status === 'pending' && s.videoId)
    
    if (pendingStudents.length === 0) {
      setIsProcessing(false)
      setError('没有待处理的学生视频')
      return
    }

    try {
      // 逐个分析
      for (const student of pendingStudents) {
        setProcessingStudentId(student.id)
        
        // 调用AI分析API
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: student.videoId,
            studentName: student.name,
            videos: student.videos,
            date: student.date
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'AI分析失败')
        }

        const data = await response.json()
        
        // 更新学生状态和反馈
        setStudents(prev => prev.map(s => {
          if (s.id === student.id) {
            return {
              ...s,
              status: 'completed',
              feedback: data.analysis.feedback,
              videos: s.videos.map((v, idx) => ({
                ...v,
                issue: data.analysis.issues[idx]?.issue || v.issue
              }))
            }
          }
          return s
        }))
      }
      
      setNotification({
        title: '✅ AI分析完成',
        content: `已为 ${pendingStudents.length} 位学生生成反馈`
      })
      
    } catch (err) {
      console.error('AI分析失败:', err)
      setError(`AI分析失败: ${err.message}`)
    } finally {
      setIsProcessing(false)
      setProcessingStudentId(null)
    }
  }, [aiConfig, students])

  const handleConfirmSend = useCallback(() => {
    setShowConfirmModal(true)
  }, [])

  const handleConfirmYes = useCallback(() => {
    setSendSuccess(true)
    setShowConfirmModal(false)
    setTimeout(() => {
      setSendSuccess(false)
      setStudents(prev => prev.map(s => ({ ...s, status: 'sent' })))
    }, 2000)
  }, [])

  const handleConfirmNo = useCallback(() => {
    setShowConfirmModal(false)
  }, [])

  const updateFeedback = useCallback((id, newFeedback) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, feedback: newFeedback } : s))
  }, [])

  // 处理视频上传
  const handleVideoUpload = useCallback(async (studentId, file) => {
    const MAX_FILE_SIZE = 100 * 1024 * 1024  // 100MB
    
    if (file.size > MAX_FILE_SIZE) {
      setError(`文件超过100MB限制`)
      return
    }

    // 更新学生状态为上传中
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, status: 'uploading', uploadProgress: 0 } : s
    ))

    try {
      // 步骤1：获取OSS上传签名
      const signResponse = await fetch(`/api/upload?studentId=${studentId}&fileName=${encodeURIComponent(file.name)}`)
      if (!signResponse.ok) {
        throw new Error('获取上传签名失败')
      }
      const signData = await signResponse.json()
      
      if (!signData.success) {
        throw new Error(signData.error || '获取上传签名失败')
      }

      // 步骤2：直接上传到OSS
      const xhr = new XMLHttpRequest()
      
      // 监听上传进度
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded * 100) / e.total)
          setStudents(prev => prev.map(s => 
            s.id === studentId ? { ...s, uploadProgress: progress } : s
          ))
        }
      }

      await new Promise((resolve, reject) => {
        xhr.open('PUT', signData.uploadUrl)
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve()
          } else {
            reject(new Error(`上传失败: HTTP ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('网络错误'))
        xhr.send(file)
      })

      // 步骤3：保存记录到数据库
      const saveResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          file_name: file.name,
          file_url: signData.fileUrl,
          object_key: signData.objectKey,
          file_size: file.size,
          duration: ''
        })
      })

      if (!saveResponse.ok) {
        throw new Error('保存记录失败')
      }

      const saveData = await saveResponse.json()

      // 更新学生状态和视频列表
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            status: 'pending',
            uploadProgress: 100,
            videos: [...s.videos, { 
              duration: '待分析', 
              issue: '待分析',
              fileName: file.name,
              videoId: saveData.video?.id
            }]
          }
        }
        return s
      }))

      setNotification({
        title: '✅ 上传成功',
        content: `${file.name} 上传成功，点击"AI一键反馈"进行分析`
      })

    } catch (err) {
      console.error('上传失败:', err)
      setError(`上传失败: ${err.message}`)
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, status: 'pending', uploadProgress: 0 } : s
      ))
    }
  }, [aiConfig])

  // 为单个学生进行AI分析
  const handleAIFeedbackForStudent = useCallback(async (studentId, videoId) => {
    if (!aiConfig.enabled || !aiConfig.apiKey) {
      return
    }

    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, status: 'processing' } : s
    ))

    try {
      const student = students.find(s => s.id === studentId)
      if (!student) return

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoId,
          studentName: student.name,
          videos: student.videos,
          date: student.date
        })
      })

      if (!response.ok) {
        throw new Error('AI分析失败')
      }

      const data = await response.json()
      
      // 更新学生状态和反馈
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            status: 'completed',
            feedback: data.analysis.feedback,
            videos: s.videos.map((v, idx) => ({
              ...v,
              issue: data.analysis.issues[idx]?.issue || v.issue
            }))
          }
        }
        return s
      }))

      setNotification({
        title: '✅ AI分析完成',
        content: `${student.name} 的视频分析完成`
      })
      
    } catch (err) {
      console.error('AI分析失败:', err)
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, status: 'pending' } : s
      ))
      setError(`AI分析失败: ${err.message}`)
    }
  }, [aiConfig, students])

  const handleWechatGroupSave = (groups) => {
    setWechatGroups(groups)
    setCurrentPage('main')
  }

  const generateLinks = (groups) => {
    const updatedGroups = groups.map(g => ({
      ...g,
      studentLink: `${window.location.origin}/upload?group=${encodeURIComponent(g.name)}&token=${btoa(g.name).slice(0, 8)}`
    }))
    setWechatGroups(updatedGroups)
    return updatedGroups
  }

  if (currentPage === 'wechat') {
    return (
      <WechatGroupForm 
        onBack={() => setCurrentPage('main')} 
        initialData={wechatGroups}
        onSave={handleWechatGroupSave}
        onGenerateLinks={generateLinks}
      />
    )
  }

  if (currentPage === 'aiSettings') {
    return (
      <AISettingsPage 
        onBack={() => setCurrentPage('main')}
        config={aiConfig}
        onSave={(newConfig) => {
          localStorage.setItem('aiConfig', JSON.stringify(newConfig))
          setAiConfig(newConfig)
          setShowAISettings(false)
        }}
      />
    )
  }

  if (currentPage === 'studentManage') {
    return (
      <StudentManagePage 
        onBack={() => setCurrentPage('main')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {notification && (
        <Notification 
          message={notification} 
          type="warning" 
          onClose={() => setNotification(null)} 
        />
      )}

      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 h-[60px] bg-white shadow-md flex items-center justify-between px-6 z-50">
        <button 
          onClick={handleAIFeedback} 
          disabled={isProcessing} 
          className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${isProcessing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 active:scale-95'}`}
        >
          {isProcessing ? `AI 分析中...${processingStudentId ? ` (${processingStudentId})` : ''}` : 'AI 一键反馈'}
        </button>
        
        <h1 className="text-xl font-semibold text-gray-700">学生视频反馈系统</h1>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentPage('aiSettings')} 
            className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            title="AI设置"
          >
            AI设置
          </button>
          <button onClick={() => setCurrentPage('studentManage')} className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            学生账号
          </button>
          <button onClick={() => setCurrentPage('wechat')} className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            微信群管理
          </button>
          <button onClick={handleConfirmSend} className="px-6 py-2.5 rounded-lg font-medium text-white bg-green-500 hover:bg-green-600 active:scale-95 transition-all">
            确认发送
          </button>
          <button onClick={onLogout} className="px-4 py-2 rounded-lg font-medium text-gray-500 hover:bg-gray-100 transition-colors">
            退出
          </button>
        </div>
      </header>

      <main className="flex-1 mt-[60px] p-6">
        <div className="flex gap-6 h-[calc(100vh-84px)]">
          <div className="w-2/5 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">学生视频列表</h2>
            <div ref={leftScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  ref={el => studentRefs.current[student.id] = el}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${highlightedId === student.id ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}
                >
                  <div className="student-header flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleExpand(student.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${student.status === 'pending' ? 'bg-yellow-400' : student.status === 'processing' ? 'bg-blue-400 animate-pulse' : student.status === 'uploading' ? 'bg-purple-400 animate-pulse' : student.status === 'sent' ? 'bg-gray-400' : 'bg-green-400'}`} />
                      <span className="font-medium text-gray-800">{student.name} - {student.date}</span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{student.videos.length} 个视频</span>
                      {student.status === 'uploading' && (
                        <span className="text-xs text-purple-600">上传中 {student.uploadProgress}%</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 上传按钮 */}
                      <label 
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PlusIcon />
                        <span>上传视频</span>
                        <input 
                          type="file" 
                          accept="video/*" 
                          className="hidden" 
                          onChange={(e) => {
                            e.stopPropagation()
                            const file = e.target.files[0]
                            if (file) {
                              handleVideoUpload(student.id, file)
                            }
                            e.target.value = ''
                          }}
                          disabled={student.status === 'uploading' || student.status === 'processing'}
                        />
                      </label>
                      <ChevronIcon expanded={expandedId === student.id} />
                    </div>
                  </div>
                  
                  {expandedId === student.id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <div className="space-y-3">
                        {student.videos.map((video, index) => (
                          <div key={index} className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-50 transition-colors group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                  <PlayIcon />
                                </div>
                                <span className="text-gray-700 font-medium">视频 {index + 1}</span>
                              </div>
                              <span className="text-sm text-gray-500 font-mono">{video.duration}</span>
                            </div>
                            {video.issue && (
                              <div className="px-3 pb-3 pt-0">
                                <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                  <InfoIcon />
                                  <p className="text-sm text-amber-800 leading-relaxed">{video.issue}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="w-3/5 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">反馈编辑区</h2>
            <div ref={rightScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  ref={el => feedbackRefs.current[student.id] = el}
                  className={`bg-white rounded-xl shadow-sm p-4 transition-all duration-300 ${highlightedId === student.id ? 'ring-2 ring-blue-400 shadow-lg scale-[1.01]' : ''}`}
                >
                  <div className="feedback-header flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-800">{student.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{student.wechatGroup}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${student.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : student.status === 'processing' ? 'bg-blue-100 text-blue-700' : student.status === 'sent' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                        {student.status === 'pending' ? '待处理' : student.status === 'processing' ? '处理中' : student.status === 'sent' ? '已发送' : '已完成'}
                      </span>
                    </div>
                  </div>
                  
                  {student.status === 'processing' ? (
                    <LoadingSpinner />
                  ) : (
                    <textarea
                      value={student.feedback}
                      onChange={(e) => updateFeedback(student.id, e.target.value)}
                      className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
                      placeholder="在此输入反馈内容..."
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">确认发送</h3>
            <p className="text-gray-600 mb-6">确定要将所有反馈内容发送至对应的微信群吗？</p>
            <div className="flex gap-4 justify-end">
              <button onClick={handleConfirmNo} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={handleConfirmYes} className="px-5 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600">确认发送</button>
            </div>
          </div>
        </div>
      )}

      {sendSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          发送成功！
        </div>
      )}
    </div>
  )
}

// 学生登录/入口页面
function StudentLoginPage({ onLogin }) {
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (studentName.trim() && studentId.trim()) {
      // 验证学生ID是否存在于账号系统中
      const accounts = getStudentAccounts()
      const account = accounts.find(a => a.id === studentId.trim())
      if (account) {
        // 验证姓名是否匹配
        if (account.name === studentName.trim()) {
          localStorage.setItem('studentLoggedIn', 'true')
          localStorage.setItem('studentId', studentId.trim())
          localStorage.setItem('studentName', studentName.trim())
          onLogin(studentId.trim(), studentName.trim())
        } else {
          setError('姓名与ID不匹配，请检查输入')
        }
      } else {
        setError('学生ID不存在，请检查输入')
      }
    } else {
      setError('请填写完整信息')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">学生入口</h1>
          <p className="text-gray-500 mt-2">英语学习视频反馈系统</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">学生姓名</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => { setStudentName(e.target.value); setError('') }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="请输入你的姓名"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">学生ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => { setStudentId(e.target.value); setError('') }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="请输入学生ID（如：A、B、C）"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            进入学习空间
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">请输入老师提供的学生ID</p>
        </div>
      </div>
    </div>
  )
}

// 学生个人详情页面
function StudentDetailPage({ studentId, studentName, onLogout }) {
  const [activeTab, setActiveTab] = useState('videos')
  const [studentData, setStudentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 加载学生数据
  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/videos?studentId=${studentId}`)
        if (!response.ok) {
          throw new Error('获取学生数据失败')
        }
        const data = await response.json()
        
        if (data.videos && data.videos.length > 0) {
          // 转换数据格式
          const videos = data.videos.map(v => ({
            duration: v.duration || '未知',
            issue: v.ai_analysis ? JSON.parse(v.ai_analysis).issues?.[0]?.issue || '待分析' : '待分析'
          }))
          
          setStudentData({
            id: studentId,
            name: studentName,
            date: new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
            status: data.videos[0].status,
            videos: videos,
            feedback: data.videos[0].feedback || ''
          })
        } else {
          setStudentData({
            id: studentId,
            name: studentName,
            date: new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
            status: 'pending',
            videos: [],
            feedback: ''
          })
        }
      } catch (err) {
        console.error('加载学生数据失败:', err)
        setError('加载数据失败，请刷新重试')
      } finally {
        setLoading(false)
      }
    }
    
    loadStudentData()
  }, [studentId, studentName])
  const [uploadHistory, setUploadHistory] = useState(() => {
    const saved = localStorage.getItem(`uploadHistory_${studentId}`)
    return saved ? JSON.parse(saved) : []
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded-lg mr-2">刷新重试</button>
          <button onClick={onLogout} className="px-4 py-2 bg-gray-500 text-white rounded-lg">返回登录</button>
        </div>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">未找到学生信息</p>
          <button onClick={onLogout} className="px-4 py-2 bg-blue-500 text-white rounded-lg">返回登录</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* 顶部导航 */}
      <header className="bg-white shadow-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-green-600">{studentName.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{studentName}</h1>
              <p className="text-sm text-gray-500">{studentData.wechatGroup}</p>
            </div>
          </div>
          <button onClick={onLogout} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            退出登录
          </button>
        </div>
      </header>

      {/* 主要内容区 */}
      <main className="max-w-4xl mx-auto p-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800">{studentData.videos.length}</p>
            <p className="text-sm text-gray-500">今日视频</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckIcon />
            </div>
            <p className="text-2xl font-bold text-gray-800">{uploadHistory.length}</p>
            <p className="text-sm text-gray-500">累计上传</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {studentData.status === 'completed' ? '已反馈' : studentData.status === 'sent' ? '已发送' : '待反馈'}
            </p>
            <p className="text-sm text-gray-500">反馈状态</p>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'videos' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              我的视频
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'feedback' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              老师反馈
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'history' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              上传记录
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'videos' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">今日提交的视频</h3>
                {studentData.videos.map((video, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <PlayIcon />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">视频 {index + 1}</p>
                          <p className="text-sm text-gray-500">时长: {video.duration}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {studentData.date}
                      </span>
                    </div>
                    {video.issue && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <InfoIcon />
                        <p className="text-sm text-amber-800 leading-relaxed">{video.issue}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'feedback' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">老师的反馈</h3>
                <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <span className="font-medium text-green-800">老师评语</span>
                  </div>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {studentData.feedback}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <ClockIcon />
                  <span>反馈时间: {studentData.date}</span>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">上传历史记录</h3>
                {uploadHistory.length > 0 ? (
                  <div className="space-y-3">
                    {uploadHistory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckIcon />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.date}</p>
                          </div>
                        </div>
                        <span className="text-sm text-green-600 font-medium">上传成功</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>暂无上传记录</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">继续学习</h3>
          <p className="text-white/80 mb-4">上传新的学习视频，获取老师的专业反馈</p>
          <a
            href={`/upload?group=${encodeURIComponent(studentData.wechatGroup)}&token=${studentId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            <UploadIcon />
            上传新视频
          </a>
        </div>
      </main>
    </div>
  )
}

// 主应用组件
function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname
    if (path === '/upload') return 'studentUpload'
    if (path === '/student') return 'studentLogin'
    return 'teacherLogin'
  })
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(() => {
    return localStorage.getItem('teacherLoggedIn') === 'true'
  })
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(() => {
    return localStorage.getItem('studentLoggedIn') === 'true'
  })
  const [studentInfo, setStudentInfo] = useState(() => {
    return {
      id: localStorage.getItem('studentId') || '',
      name: localStorage.getItem('studentName') || ''
    }
  })

  // 解析 URL 参数
  const urlParams = new URLSearchParams(window.location.search)
  const studentGroup = urlParams.get('group') || '默认班级'
  const studentToken = urlParams.get('token') || ''

  const handleTeacherLogin = () => {
    setIsTeacherLoggedIn(true)
    setCurrentPage('feedback')
  }

  const handleTeacherLogout = () => {
    localStorage.removeItem('teacherLoggedIn')
    setIsTeacherLoggedIn(false)
    setCurrentPage('teacherLogin')
  }

  const handleStudentLogin = (id, name) => {
    setIsStudentLoggedIn(true)
    setStudentInfo({ id, name })
    setCurrentPage('studentDetail')
  }

  const handleStudentLogout = () => {
    localStorage.removeItem('studentLoggedIn')
    localStorage.removeItem('studentId')
    localStorage.removeItem('studentName')
    setIsStudentLoggedIn(false)
    setStudentInfo({ id: '', name: '' })
    setCurrentPage('studentLogin')
  }

  // 根据当前页面状态渲染对应组件
  if (currentPage === 'studentUpload' || window.location.pathname === '/upload') {
    return (
      <StudentUploadPage 
        studentId={studentToken}
        studentName={studentGroup}
        onBack={() => window.close()}
      />
    )
  }

  if (currentPage === 'studentLogin' || window.location.pathname === '/student') {
    if (isStudentLoggedIn) {
      return (
        <StudentDetailPage 
          studentId={studentInfo.id}
          studentName={studentInfo.name}
          onLogout={handleStudentLogout}
        />
      )
    }
    return <StudentLoginPage onLogin={handleStudentLogin} />
  }

  if (currentPage === 'studentDetail' && isStudentLoggedIn) {
    return (
      <StudentDetailPage 
        studentId={studentInfo.id}
        studentName={studentInfo.name}
        onLogout={handleStudentLogout}
      />
    )
  }

  if (!isTeacherLoggedIn) {
    return <TeacherLoginPage onLogin={handleTeacherLogin} />
  }

  return <FeedbackSystem onLogout={handleTeacherLogout} />
}

export default App
