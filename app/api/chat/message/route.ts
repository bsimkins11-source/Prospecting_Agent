import { NextRequest, NextResponse } from "next/server";
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    console.log('🤖 Chat message: Starting message processing...');
    const { message, companyData, martechStack, technologyCategories, newsArticles, conversationHistory } = await req.json();
    
    console.log('🤖 Chat message: Received message:', message);

    // Build context from the data
    const context = `
COMPANY CONTEXT:
- Name: ${companyData.name}
- Industry: ${companyData.industry}
- Employees: ${companyData.employees}
- Revenue: ${companyData.revenue}
- Founded: ${companyData.founded_year}

MARTECH STACK:
${martechStack?.martech_technologies?.map((tech: any) => `- ${tech.name} (${tech.category})`).join('\n') || 'No MarTech technologies'}

TECHNOLOGY CATEGORIES:
${Object.entries(technologyCategories || {}).map(([category, technologies]: [string, any]) => 
  `${category}: ${technologies.length} technologies`
).join('\n')}

RECENT NEWS:
${newsArticles?.map((article: any) => `- ${article.title} (${article.source})`).join('\n') || 'No recent news'}

TRANSPARENT PARTNERS EXPERTISE:
- Marketing Strategy & Operations
- MarTech Implementation & Optimization
- Data Analytics & Customer Insights
- Digital Transformation
- Technology Stack Assessment
- Customer Experience Optimization
`;

    // Build conversation history
    const historyMessages = conversationHistory.map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const systemPrompt = `You are an AI assistant helping analyze company data and provide insights on how Transparent Partners can help. 

You have access to:
- Company information and tech stack data
- MarTech stack analysis
- Technology categories
- Recent news articles

Your role is to:
1. Answer questions about the company's technology and business
2. Analyze trends and patterns in the data
3. Provide specific recommendations for how Transparent Partners can help
4. Be conversational and helpful
5. Focus on practical, actionable insights

Always be specific about how Transparent Partners' expertise can address the company's needs.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: `Context: ${context}\n\nUser question: ${message}` }
    ];

    console.log('🤖 Chat message: Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('🤖 Chat message: OpenAI response received');
    const chatResponse = response.choices[0].message.content || "I couldn't generate a response. Please try again.";
    console.log('🤖 Chat message: Response length:', chatResponse.length);

    return NextResponse.json({ response: chatResponse });

  } catch (error: any) {
    console.error('Chat message error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
