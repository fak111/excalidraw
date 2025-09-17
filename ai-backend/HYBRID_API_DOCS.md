# 🚀 线框图转代码 - 混合方案 API 文档

## 📋 方案概述

本API实现了一个智能的**混合方案**，结合两个强大的AI模型：
- **InternLM (intern-s1)**: 专门用于图像内容提取和理解
- **DeepSeek (deepseek-chat)**: 专门用于高质量代码生成

## 🔄 数据流向

```
用户输入 → API路由 → 智能分支判断
    ↓
有图片? 
├─ 是 → InternLM提取图像内容 → DeepSeek生成代码 → 返回HTML
└─ 否 → 直接使用DeepSeek生成代码 → 返回HTML
```

## 🛠 API端点

### POST `/v1/ai/diagram-to-code-intern/generate`

#### 请求格式
```json
{
  "texts": "可选的文本描述",
  "image": "data:image/png;base64,iVBORw0KGgoAAAA...",  // 可选的Base64图片
  "theme": "light|dark"  // 可选的主题设置
}
```

#### 响应格式
```json
{
  "html": "<!DOCTYPE html><html>...</html>",
  "processedWith": "InternLM + DeepSeek" | "DeepSeek only"
}
```

## ⚙️ 环境配置

### `.env.local` 配置
```bash
# InternLM Configuration (用于图像内容提取)
INTERN_API_KEY=sk-xx
INTERN_BASE_URL=https://chat.intern-ai.org.cn/api/v1
INTERN_MODEL_NAME=intern-s1

# DeepSeek Configuration (用于代码生成)
DEEPSEEK_API_KEY=sk-xx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL_NAME=deepseek-chat
```

## 🎯 处理逻辑

### 场景1: 有图片输入
1. **InternLM 图像分析**: 使用专业的UI/UX分析提示，提取图像中的：
   - 整体布局结构
   - UI组件元素
   - 文本内容
   - 样式特征
   - 交互元素

2. **DeepSeek 代码生成**: 基于图像分析结果，生成：
   - 现代化HTML/CSS代码
   - 响应式设计
   - 语义化HTML结构
   - 内联CSS样式

### 场景2: 无图片输入
- **直接DeepSeek**: 使用文本描述直接生成代码

### 场景3: 无输入
- 返回400错误，要求提供图片或文本描述

## 🔧 技术特性

### 智能清理机制
- 自动移除AI输出中的Markdown格式
- 确保HTML文档结构完整性
- 添加必要的DOCTYPE和meta标签

### 错误处理
- **429错误**: API调用频率限制
- **401错误**: API密钥验证失败
- **网络错误**: 超时和连接失败处理
- **内容错误**: 空响应和格式错误处理

### 调试日志
- 详细的请求处理日志
- 两阶段处理状态追踪
- 错误详情记录

## 🚀 使用示例

### 使用图片生成代码
```javascript
const response = await fetch('/v1/ai/diagram-to-code-intern/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image: 'data:image/png;base64,iVBORw0KGgoAAAA...',
    texts: '登录页面，包含用户名密码输入框',
    theme: 'light'
  })
});

const result = await response.json();
console.log(result.html); // 生成的HTML代码
console.log(result.processedWith); // "InternLM + DeepSeek"
```

### 仅使用文本生成代码
```javascript
const response = await fetch('/v1/ai/diagram-to-code-intern/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    texts: '创建一个现代化的导航栏，包含Logo和菜单项',
    theme: 'dark'
  })
});

const result = await response.json();
console.log(result.processedWith); // "DeepSeek only"
```

## ✅ 优化亮点

1. **专业化分工**: 每个AI模型专注于自己的强项
2. **智能路由**: 根据输入自动选择最佳处理路径
3. **环境配置规范**: 所有配置统一管理在`.env.local`
4. **完整错误处理**: 涵盖各种异常情况
5. **代码质量**: TypeScript类型安全，ESLint规范检查
6. **调试友好**: 详细的日志输出便于问题排查

## 🔗 相关文件
- `/src/app/v1/ai/diagram-to-code-intern/generate/route.ts` - 主要API实现
- `/.env.local` - 环境配置
- `/package.json` - 项目依赖

---
**版本**: v2.0 - 混合方案优化版
**更新时间**: 2024-09-14
