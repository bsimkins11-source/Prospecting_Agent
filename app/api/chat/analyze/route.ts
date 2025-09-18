import { NextRequest, NextResponse } from "next/server";
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { companyData, martechStack, technologyCategories, newsArticles } = await req.json();

    // Generate initial analysis
    const analysisPrompt = `Analyze the following company data and provide a comprehensive overview:

COMPANY: ${companyData.name}
INDUSTRY: ${companyData.industry}
EMPLOYEES: ${companyData.employees}
REVENUE: ${companyData.revenue}
FOUNDED: ${companyData.founded_year}

TECH STACK ANALYSIS:
- Total Technologies: ${martechStack?.total_technologies || 0}
- MarTech Technologies: ${martechStack?.martech_technologies?.length || 0}
- Top Categories: ${martechStack?.top_categories?.map((cat: any) => `${cat.category} (${cat.count})`).join(', ') || 'None'}

MARTECH STACK:
${martechStack?.martech_technologies?.map((tech: any) => `- ${tech.name} (${tech.category})`).join('\n') || 'No MarTech technologies found'}

TECHNOLOGY CATEGORIES:
${Object.entries(technologyCategories || {}).map(([category, technologies]: [string, any]) => 
  `${category}: ${technologies.length} technologies`
).join('\n')}

RECENT NEWS ARTICLES:
${newsArticles?.map((article: any, index: number) => 
  `${index + 1}. ${article.title} (${article.source}) - ${article.published_at}`
).join('\n') || 'No recent articles found'}

Please provide:
1. A comprehensive tech stack analysis highlighting key technologies and potential gaps
2. MarTech assessment and recommendations
3. Technology category insights
4. Recent news analysis and trends
5. How Transparent Partners can help this company based on the data

Format your response as a professional analysis report.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    const analysis = response.choices[0].message.content || "Analysis could not be generated.";

    return NextResponse.json({ analysis });

  } catch (error: any) {
    console.error('Chat analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}
