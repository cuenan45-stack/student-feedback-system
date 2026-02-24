// Railway 部署的服务器入口
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// API 路由
import videosRouter from './api-routes/videos.js'
import uploadRouter from './api-routes/upload.js'
import analyzeRouter from './api-routes/analyze.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())

// API 路由
app.use('/api/videos', videosRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/analyze', analyzeRouter)

// 静态文件服务（前端构建后的文件）
app.use(express.static(path.join(__dirname, 'dist')))

// 所有其他路由返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`)
})
