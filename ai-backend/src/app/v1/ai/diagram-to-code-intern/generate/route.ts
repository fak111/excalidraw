import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// InternLM Configuration (用于图像内容提取)
const INTERN_API_KEY = process.env.INTERN_API_KEY;
const INTERN_BASE_URL = process.env.INTERN_BASE_URL;
const INTERN_MODEL = process.env.INTERN_MODEL_NAME;

// DeepSeek Configuration (用于代码生成)
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL_NAME;

// 通用消息接口
interface BaseMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// InternLM 多模态消息接口
interface InternMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

interface RateLimitError {
  status: number;
  message: string;
}

/**
 * 调用 InternLM API 提取图像内容
 * @param image Base64图像数据
 * @returns 提取的内容描述
 */
async function extractImageContentWithIntern(image: string): Promise<string> {
  console.log('=== 使用 Intern-s1 提取图像内容 ===');

  const messages: InternMessage[] = [
    {
      role: 'system',
      content: `你是一个专业的UI/UX设计分析师。你的任务是仔细分析图像中的用户界面设计，并提供详细的描述。

请按以下结构分析并描述图像内容：
1. 整体布局：描述页面的整体结构和布局方式
2. 组件元素：列出所有可见的UI组件（按邒、输入框、文本、图片等）
3. 文本内容：所有文本内容的准确摘录
4. 样式特征：颜色、字体、间距、大小等视觉特征
5. 交互元素：可点击、可输入等交互功能

请用中文回复，并尽可能详细和准确。`
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: '请分析这张UI设计图/线框图，提供详细的内容描述。'
        },
        {
          type: 'image_url',
          image_url: {
            url: image
          }
        }
      ]
    }
  ];

  try {
    const response = await axios.post(`${INTERN_BASE_URL}/chat/completions`, {
      model: INTERN_MODEL,
      messages: messages,
      max_tokens: 32000,
      temperature: 0.3, // 低温度保证描述准确
    }, {
      headers: {
        'Authorization': `Bearer ${INTERN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    });

    const message = response.data.choices[0].message;
    const content = message.reasoning_content || message.content;

    if (!content || content.trim() === '') {
      throw new Error('InternLM 返回空内容');
    }

    console.log('图像内容提取成功，长度:', content.length);
    console.log('intern-s1提取的内容:', content)
    return content;

  } catch (error: unknown) {
    console.error('InternLM 图像内容提取失败:', error);
    throw new Error('InternLM 图像内容提取失败');
  }
}

/**
 * 调用 DeepSeek API 生成代码
 * @param contentDescription 图像内容描述
 * @param texts 额外的文本信息
 * @param theme 主题
 * @returns 生成的HTML代码
 */
async function generateCodeWithDeepSeek(contentDescription: string, texts?: string, theme?: string): Promise<string> {
  console.log('=== 使用 DeepSeek 生成代码 ===');

  const messages: BaseMessage[] = [
    {
      role: 'system',
      content: `你是一个专业的前端开发工程师。根据UI设计描述，生成现代化、响应式的HTML/CSS代码。

代码要求：
1. 生成完整、自包含的HTML文档（内联CSS）
2. 使用现代CSS特性（Flexbox、Grid、CSS变量等）
3. 实现响应式设计，兼容移动端
4. 使用语义化HTML5元素
5. 根据主题应用适当的样式: ${theme || 'light'}
6. 如有文本元素，准确融入设计: ${texts || '无额外文本'}
7. 代码结构清晰，符合生产标准
8. 直接返回HTML代码，不要任何解释或Markdown格式

请严格按照设计描述实现像素级的还原。`
    },
    {
      role: 'user',
      content: `请根据以下设计描述生成现代化的HTML/CSS代码：

${contentDescription}

请确保代码的响应式设计、美观的视觉效果和良好的用户体验。`
    }
  ];

  try {
    const response = await axios.post(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      model: DEEPSEEK_MODEL,
      messages: messages,
      max_tokens: 8000,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    const message = response.data.choices[0].message;
    const content = message.content;

    if (!content || content.trim() === '') {
      throw new Error('DeepSeek 返回空代码');
    }

    console.log('DeepSeek 代码生成成功，长度:', content.length);
    return content;

  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        const rateLimitError: RateLimitError = {
          status: 429,
          message: 'DeepSeek API 调用频率超限，请稍后再试！'
        };
        throw rateLimitError;
      }
    }

    console.error('DeepSeek 代码生成失败:', error);
    throw new Error('DeepSeek 代码生成失败');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== 混合方案: InternLM + DeepSeek 请求处理 ===');
    const { texts, image, theme } = await request.json();

    console.log('请求数据:', {
      hasTexts: !!texts,
      textsLength: typeof texts === 'string' ? texts.length : 0,
      hasImage: !!image,
      imagePrefix: image?.substring(0, 30) + '...' || '无图片',
      theme: theme || '未指定主题'
    });

    let contentDescription: string;

    if (image) {
      // 有图片：使用 Intern-s1 提取图像内容
      console.log('检测到图片，使用 Intern-s1 提取内容...');
      contentDescription = await extractImageContentWithIntern(image);

      // 如果有额外文本，追加到描述中
      if (texts) {
        contentDescription += `\n\n额外文本信息：${texts}`;
      }
    } else if (texts) {
      // 无图片但有文本：使用文本作为描述
      console.log('无图片，使用文本描述...');
      contentDescription = `根据以下文本描述创建 UI 界面：${texts}`;
    } else {
      // 既无图片也无文本
      return NextResponse.json(
        { error: '请提供图片或文本描述用于代码生成' },
        { status: 400 }
      );
    }

    console.log('内容描述长度:', contentDescription.length);

    // 使用 DeepSeek 生成代码
    console.log('使用 DeepSeek 生成代码...');
    const generatedCode = await generateCodeWithDeepSeek(contentDescription, texts, theme);

    // 清理生成的代码
    const cleanedCode = cleanAndValidateHTML(generatedCode);

    console.log('最终代码长度:', cleanedCode.length);
    console.log('代码预览:', cleanedCode.substring(0, 200) + '...');

    const response = NextResponse.json({
      html: cleanedCode,
      processedWith: image ? 'InternLM + DeepSeek' : 'DeepSeek only'
    });

    // 设置 CORS 头
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error: unknown) {
    console.error('=== 混合方案处理错误 ===', error);

    // 处理速率限制错误
    if (typeof error === 'object' && error !== null && 'status' in error && (error as RateLimitError).status === 429) {
      const rateLimitError = error as RateLimitError;
      return NextResponse.json(
        {
          statusCode: 429,
          message: rateLimitError.message
        },
        { status: 429 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : '代码生成失败';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * 清理和验证HTML代码
 * @param code 原始代码
 * @returns 清理后的代码
 */
function cleanAndValidateHTML(code: string): string {
  let cleanedCode = code.trim();

  // 移除 Markdown 代码块标记
  if (cleanedCode.startsWith('```html')) {
    cleanedCode = cleanedCode.replace(/^```html\n?/, '');
  }
  if (cleanedCode.startsWith('```')) {
    cleanedCode = cleanedCode.replace(/^```\n?/, '');
  }
  if (cleanedCode.endsWith('```')) {
    cleanedCode = cleanedCode.replace(/\n?```$/, '');
  }

  // 确保代码以完整的HTML文档结构开始
  if (!cleanedCode.toLowerCase().includes('<!doctype') && !cleanedCode.toLowerCase().includes('<html')) {
    cleanedCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated UI</title>
</head>
<body>
${cleanedCode}
</body>
</html>`;
  }

  return cleanedCode;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
