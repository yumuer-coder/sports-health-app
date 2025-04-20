import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, message: '请输入问题内容' },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_MODEL_API_KEY;
    const apiUrl = process.env.AI_MODEL_API_URL;

    if (!apiKey || !apiUrl) {
      throw new Error('未配置AI模型API key或URL');
    }

    // 初始化OpenAI客户端
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: apiUrl,
    });

    // AI提示词
    const prompt = `
    用户问题: ${message}
    
    请以健身教练和营养师的身份回答上述问题。你需要提供专业、实用且易于理解的建议，涉及健身计划、饮食营养、健康生活方式等方面。
    回答应该简洁明了，直接解决用户的问题，避免过长的解释。如果用户的问题不清楚或与健身健康无关，请礼貌地引导他们提问健身健康相关的内容。
    `;

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const completion = await openai.chat.completions.create({
          model: 'qwen-plus',
          messages: [
            { role: 'system', content: '你是一位健身教练和营养师，专注于提供专业、实用且易于理解的建议，涵盖健身计划、饮食营养、健康生活方式等方面。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          stream: true,
        });

        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    // 返回流式输出
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('调用AI模型错误:', error);
    return NextResponse.json(
      { success: false, message: '无法获取回答，请稍后再试' },
      { status: 500 }
    );
  }
} 