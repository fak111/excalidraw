import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL;
const MODEL_NAME = process.env.DEEPSEEK_MODEL_NAME;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RateLimitError {
  status: number;
  message: string;
}

async function callDeepSeekAPI(messages: Message[], maxTokens: number = 1000) {
  try {
    const response = await axios.post(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      model: MODEL_NAME,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.choices[0].message.content;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      const rateLimitError: RateLimitError = { 
        status: 429, 
        message: 'Too many requests today, please try again tomorrow!' 
      };
      throw rateLimitError;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('DeepSeek API Error:', errorMessage);
    throw new Error('AI service temporarily unavailable');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { texts, image, theme } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const messages: Message[] = [
      {
        role: 'system' as const,
        content: `You are an expert web developer. Convert UI mockups and diagrams into clean, modern HTML/CSS code.

Rules:
1. Generate complete, self-contained HTML with inline CSS
2. Use modern CSS features (flexbox, grid, etc.)
3. Make the design responsive
4. Use semantic HTML elements
5. Apply appropriate styling based on the theme (${theme || 'light'})
6. If there are text elements provided, incorporate them into the design
7. Make the code production-ready and well-structured
8. Return only the HTML code without any explanations or markdown

Text elements from the diagram: ${texts || 'None provided'}`
      },
      {
        role: 'user' as const,
        content: `Convert this UI mockup/diagram into HTML/CSS code. The image shows a user interface design that needs to be implemented as web code. Generate clean, modern, and responsive code.`
      }
    ];

    const generatedCode = await callDeepSeekAPI(messages, 2000);

    const response = NextResponse.json({
      html: generatedCode.trim()
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error: unknown) {
    console.error('Diagram-to-code error:', error);
    
    // 如果是 429 错误 (rate limit)
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

    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
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