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
      content: `你是一个专业的图片内容提取工具。你的任务是客观地提取和描述图片中的所有可见内容，为后续的问答提供准确的信息基础。

提取原则：
1. 客观描述：不进行分析或解释，只描述看到的内容
2. 全面覆盖：包含所有文字、图像、布局、颜色等可视元素
3. 准确摘录：确保所有文本内容的准确性
4. 结构清晰：按逻辑顺序组织描述内容
5. 细节完整：不遗漏任何可能对问答有帮助的细节

请用中文提取图片内容，专注于事实描述而非分析评价。`
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: '请提取这张图片中的所有内容，包括文字、布局、视觉元素等，为后续问答提供准确的信息基础。'
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
 * 调用 DeepSeek API 生成文本回答
 * @param contentDescription 图像内容描述或用户问题
 * @param userPrompt 用户的具体问题
 * @param theme 主题（可选）
 * @returns 生成的文本回答
 */
async function generateTextAnswerWithDeepSeek(contentDescription: string, userPrompt?: string, theme?: string): Promise<string> {
  console.log('=== 使用 DeepSeek 生成文本回答 ===');
  
  const messages: BaseMessage[] = [
    {
      role: 'system',
      content: `你是一个专业的AI助手，专门根据图片内容回答用户的问题。你会收到图片内容的详细描述，然后需要基于这些信息准确回答用户的具体问题。

回答原则：
1. 基于事实：严格根据提供的图片内容描述进行回答
2. 针对问题：直接回答用户的具体问题，避免冗余信息
3. 简洁明了：语言简洁，逻辑清晰，重点突出
4. 准确可靠：确保回答的准确性，不添加图片中不存在的信息
5. 自然表达：使用自然流畅的中文表达
6. 实用价值：提供对用户有实际帮助的信息

注意：你的任务是回答问题，不是描述图片。请根据用户的问题给出最合适的回答。`
    },
    {
      role: 'user',
      content: userPrompt ? 
        `图片内容：${contentDescription}

请回答：${userPrompt}` : 
        `图片内容：${contentDescription}

请基于图片内容提供相关见解或总结。`
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
      throw new Error('DeepSeek 返回空内容');
    }

    console.log('DeepSeek 文本生成成功，长度:', content.length);
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

    console.error('DeepSeek 文本生成失败:', error);
    throw new Error('DeepSeek 文本生成失败');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== AI文本问答: InternLM + DeepSeek 请求处理 ===');
    const { texts, image, theme, prompt } = await request.json();

    console.log('请求数据:', {
      hasTexts: !!texts,
      textsLength: typeof texts === 'string' ? texts.length : 0,
      hasImage: !!image,
      imagePrefix: image?.substring(0, 30) + '...' || '无图片',
      hasPrompt: !!prompt,
      promptLength: typeof prompt === 'string' ? prompt.length : 0,
      theme: theme || '未指定主题'
    });

    let contentDescription: string;
    let userPrompt: string | undefined;
    
    if (image) {
      // 有图片：使用 InternLM 提取图像内容
      console.log('检测到图片，使用 InternLM 提取内容...');
      contentDescription = await extractImageContentWithIntern(image);
      
      // 如果有额外文本信息，追加到描述中
      if (texts) {
        contentDescription += `\n\n额外文本信息：${texts}`;
      }
      
      // 用户的具体问题
      userPrompt = prompt;
    } else if (prompt) {
      // 无图片但有prompt：直接使用prompt作为问题
      console.log('无图片，直接处理用户问题...');
      contentDescription = texts || '无特定上下文';
      userPrompt = prompt;
    } else if (texts) {
      // 无图片无prompt但有文本：分析文本内容
      console.log('无图片和问题，分析文本内容...');
      contentDescription = texts;
      userPrompt = undefined;
    } else {
      // 既无图片也无文本也无问题
      return NextResponse.json(
        { error: '请提供图片、文本描述或问题用于AI回答' },
        { status: 400 }
      );
    }

    console.log('内容描述长度:', contentDescription.length);
    console.log('用户问题:', userPrompt || '无具体问题');
    
    // 使用 DeepSeek 生成文本回答
    console.log('使用 DeepSeek 生成文本回答...');
    const generatedText = await generateTextAnswerWithDeepSeek(contentDescription, userPrompt, theme);
    
    console.log('最终文本长度:', generatedText.length);
    console.log('文本预览:', generatedText.substring(0, 200) + '...');

    const response = NextResponse.json({
      text: generatedText,
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

    const errorMessage = error instanceof Error ? error.message : '文本生成失败';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
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
