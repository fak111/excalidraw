import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL;
const MODEL_NAME = process.env.MODEL_NAME;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('DeepSeek API Error:', errorMessage);
    throw new Error('AI service temporarily unavailable');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: 'Prompt is too short (minimum 3 characters)' },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: 'Prompt is too long (maximum 1000 characters)' },
        { status: 400 }
      );
    }

    const messages: Message[] = [
      {
        role: 'system' as const,
        content: `You are an expert at creating Mermaid diagrams. Convert user descriptions into valid Mermaid diagram code.

Rules:
1. Only return the Mermaid code, no explanations or markdown formatting
2. Use appropriate Mermaid diagram types (flowchart, sequence, class, etc.)
3. Keep node IDs simple and without special characters
4. Ensure the diagram is syntactically correct
5. For flowcharts, use TD (top-down) direction by default
6. Make the diagram clear and well-structured

Examples:
- For processes: use flowchart TD
- For user interactions: use sequence diagram
- For system architecture: use flowchart or C4 diagram
- For data models: use class diagram or ER diagram`
      },
      {
        role: 'user' as const,
        content: `Create a Mermaid diagram for: ${prompt}`
      }
    ];

    const generatedResponse = await callDeepSeekAPI(messages, 1500);

    // 简单的 rate limiting 模拟
    const rateLimit = 100;
    const rateLimitRemaining = 95;

    const response = NextResponse.json({
      generatedResponse: generatedResponse.trim()
    });

    response.headers.set('X-Ratelimit-Limit', rateLimit.toString());
    response.headers.set('X-Ratelimit-Remaining', rateLimitRemaining.toString());
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    console.error('Text-to-diagram error:', errorMessage);
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