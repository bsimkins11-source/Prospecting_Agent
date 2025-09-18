import { NextRequest, NextResponse } from "next/server";
import { openai } from '@/lib/openai';

export async function GET() {
  try {
    console.log('🤖 Testing OpenAI connection...');
    console.log('🤖 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('🤖 OpenAI API Key length:', process.env.OPENAI_API_KEY?.length || 0);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say 'OpenAI is working' and nothing else." }],
      temperature: 0.3,
      max_tokens: 50
    });

    const result = response.choices[0].message.content;
    console.log('🤖 OpenAI response:', result);

    return NextResponse.json({ 
      success: true, 
      message: result,
      hasApiKey: !!process.env.OPENAI_API_KEY
    });

  } catch (error: any) {
    console.error('❌ OpenAI test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      hasApiKey: !!process.env.OPENAI_API_KEY
    }, { status: 500 });
  }
}
