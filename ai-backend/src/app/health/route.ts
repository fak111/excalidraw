import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Excalidraw AI Backend (Next.js)',
    model: process.env.MODEL_NAME || 'deepseek-chat',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /v1/ai/text-to-diagram/generate',
      'POST /v1/ai/diagram-to-code/generate',
      'GET /health'
    ]
  });
}