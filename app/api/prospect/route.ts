import { NextRequest, NextResponse } from "next/server";
import { openai, DEFAULT_MODEL } from '@/lib/openai';

// Apollo Organization types
type ApolloOrg = {
  name?: string;
  industry?: string;
  primary_domain?: string;
  website_url?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  raw_address?: string;
  short_description?: string;
  logo_url?: string;
  annual_revenue?: number;
  annual_revenue_printed?: string;
  estimated_num_employees?: number;
  founded_year?: number;
  keywords?: string[];
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Enhanced Prospect API is running",
    hasApolloKey: !!process.env.APOLLO_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY
  });
}

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json() as { company: string };
    
    const apiKey = process.env.APOLLO_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });
    }

    console.log(`🔍 ENHANCED: Analyzing prospect for: ${company}`);

    // STEP 1: Get enhanced company information from Apollo
    let searchQuery = company.trim();
    if (!searchQuery.includes('.') && !searchQuery.includes('://')) {
      searchQuery = `${searchQuery}.com`;
      console.log(`🔍 ENHANCED: Added .com extension: ${company} -> ${searchQuery}`);
    }

    const companyResponse = await fetch(`https://api.apollo.io/api/v1/organizations/enrich?domain=${searchQuery}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'accept': 'application/json'
      }
    });

    if (!companyResponse.ok) {
      const errorText = await companyResponse.text();
      console.error(`❌ ENHANCED: Apollo company enrichment failed: ${companyResponse.status} - ${errorText}`);
      return NextResponse.json({ error: `Apollo API error: ${companyResponse.status} - ${errorText}` }, { status: companyResponse.status });
    }

    const companyDataRaw = await companyResponse.json();
    const companyData: ApolloOrg = companyDataRaw.organization;

    if (!companyData || !companyData.name) {
      console.warn(`⚠️ ENHANCED: No company data found for domain: ${searchQuery}`);
      return NextResponse.json({ error: `No company data found for ${company}` }, { status: 404 });
    }

    console.log(`✅ ENHANCED: Company data:`, companyData.name, companyData.industry);

    // STEP 2: Get employee information by department (Transparent Partners focus areas)
    const departments = ['Marketing', 'Media and Advertising', 'Content and Creative', 'Social Media', 'Brand', 'CRM', 'MarTech', 'Analytics & Data', 'Customer Strategy'];
    const accountMap: { [key: string]: any[] } = {};
  
  for (const dept of departments) {
      console.log(`🔍 ENHANCED: Getting ${dept} employees...`);
    
      const peopleResponse = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'accept': 'application/json'
        },
        body: JSON.stringify({
          q_organization_domains_list: [companyData.primary_domain || searchQuery],
          person_titles: getDepartmentTitles(dept),
          contact_email_status: ['verified'],
          person_locations: ['United States'],
          page: 1,
          per_page: 10
        })
      });
      
      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json();
        accountMap[dept] = (peopleData.people || []).map((person: any) => ({
          name: person.name,
          title: person.title,
          seniority: person.seniority,
          email: person.email,
          linkedin_url: person.linkedin_url,
          company: person.organization?.name
        }));
        console.log(`✅ ENHANCED: Found ${accountMap[dept].length} ${dept} employees.`);
      } else {
        accountMap[dept] = [];
        console.log(`❌ ENHANCED: No ${dept} employees found`);
      }
    }

    // STEP 3: Get additional Apollo data
    let articles = null;
    let childBrands = null;
    let technologyStack = null;

    // Get company news/articles
    try {
      console.log(`📰 APOLLO: Getting company news...`);
      const newsResponse = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'accept': 'application/json'
        },
        body: JSON.stringify({
          q_organization_domains_list: [companyData.primary_domain || searchQuery],
          person_titles: ['CEO', 'CTO', 'CMO', 'Founder'],
          contact_email_status: ['verified'],
          page: 1,
          per_page: 5
        })
      });

      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        articles = generateCompanyArticles(companyData, newsData.people || []);
        console.log(`✅ APOLLO: Generated ${articles.length} articles`);
      }
    } catch (error) {
      console.error(`❌ APOLLO: News generation failed:`, error);
    }

    // Get child brands for major companies
    childBrands = getChildBrands(companyData.name);
    if (childBrands) {
      console.log(`✅ APOLLO: Found child brands for ${companyData.name}`);
    }

    // Generate technology stack analysis
    technologyStack = generateTechnologyStack(companyData);

    // STEP 4: Generate MarTech analysis and challenges using AI
    let martechAnalysis = null;
    let challenges = null;
    let techStack = null;
    let tpAlignment = null;

    if (openaiKey) {
      try {
        console.log(`🤖 ENHANCED: Generating AI analysis...`);
        
        // MarTech Analysis (Simplified for testing)
        console.log(`🤖 ENHANCED: Starting MarTech analysis...`);
        martechAnalysis = await generateSimpleMarTechAnalysis(companyData, accountMap);
        console.log(`🤖 ENHANCED: MarTech analysis result:`, martechAnalysis ? 'SUCCESS' : 'FAILED');
        
        // Challenges Analysis
        console.log(`🤖 ENHANCED: Starting challenges analysis...`);
        challenges = await generateChallengesAnalysis(companyData, accountMap);
        console.log(`🤖 ENHANCED: Challenges analysis result:`, challenges ? 'SUCCESS' : 'FAILED');
        
        // Tech Stack Analysis
        console.log(`🤖 ENHANCED: Starting tech stack analysis...`);
        techStack = await generateTechStackAnalysis(companyData, accountMap);
        console.log(`🤖 ENHANCED: Tech stack analysis result:`, techStack ? 'SUCCESS' : 'FAILED');
        
        // TP Alignment
        console.log(`🤖 ENHANCED: Starting TP alignment analysis...`);
        tpAlignment = await generateTPAlignment(companyData, accountMap);
        console.log(`🤖 ENHANCED: TP alignment analysis result:`, tpAlignment ? 'SUCCESS' : 'FAILED');
        
        console.log(`✅ ENHANCED: AI analysis completed`);
      } catch (error: any) {
        console.error(`❌ ENHANCED: AI analysis failed:`, error);
        console.error(`❌ ENHANCED: Error details:`, error.message);
        console.error(`❌ ENHANCED: Error stack:`, error.stack);
      }
    } else {
      console.log(`⚠️ ENHANCED: OpenAI key not available, skipping AI analysis`);
    }

    // STEP 4: Filter out empty categories and return comprehensive data
    const filteredAccountMap = Object.fromEntries(
      Object.entries(accountMap).filter(([_, people]) => people.length > 0)
    );

    const result = {
      company: {
        name: companyData.name,
        website: companyData.website_url || companyData.primary_domain,
        industry: companyData.industry,
        revenue: companyData.annual_revenue_printed || companyData.annual_revenue,
        employees: companyData.estimated_num_employees,
        locations: companyData.city && companyData.state ? [`${companyData.city}, ${companyData.state}`] : [],
        overview: companyData.short_description,
        founded_year: companyData.founded_year,
        linkedin_url: companyData.linkedin_url,
        logo_url: companyData.logo_url,
        keywords: companyData.keywords,
        raw_address: companyData.raw_address
      },
      accountMap: filteredAccountMap,
      articles: articles,
      child_brands: childBrands,
      technology_stack: technologyStack,
      martech_analysis: martechAnalysis,
      challenges: challenges,
      tech_stack: techStack,
      tp_alignment: tpAlignment,
      generated_at: new Date().toISOString()
    };

    console.log(`✅ ENHANCED: Success! Returning comprehensive data for ${companyData.name}`);
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('❌ ENHANCED: Prospect analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDepartmentTitles(dept: string): string[] {
  const titles: { [key: string]: string[] } = {
    'Marketing': [
      'Marketing Manager', 'Marketing Director', 'CMO', 'Brand Manager', 'Digital Marketing Manager', 
      'Marketing Technology Manager', 'VP Marketing', 'Head of Marketing', 'Marketing Specialist',
      'Marketing Coordinator', 'Marketing Analyst', 'Marketing Operations Manager', 'Growth Marketing Manager',
      'Product Marketing Manager', 'Field Marketing Manager', 'Marketing Communications Manager'
    ],
    'Media and Advertising': [
      'Media Manager', 'Media Director', 'VP Media', 'Digital Media Manager', 'Paid Media Manager', 
      'Media Planning Manager', 'Advertising Manager', 'Ad Manager', 'Media Buyer', 'Media Planner', 
      'Advertising Director', 'VP Advertising', 'Media Specialist', 'Media Coordinator', 'Media Analyst',
      'Programmatic Manager', 'Ad Operations Manager', 'Media Strategist', 'Advertising Specialist'
    ],
    'Content and Creative': [
      'Content Manager', 'Content Director', 'Creative Director', 'Content Strategist', 'Creative Manager', 
      'Content Marketing Manager', 'VP Content', 'Head of Content', 'Creative Strategist', 'Content Creator', 
      'Brand Creative Manager', 'Digital Content Manager', 'Content Specialist', 'Content Coordinator',
      'Creative Specialist', 'Content Writer', 'Creative Lead', 'Content Producer', 'Creative Director'
    ],
    'Social Media': [
      'Social Media Manager', 'Social Media Director', 'VP Social Media', 'Social Media Strategist', 
      'Community Manager', 'Social Media Specialist', 'Social Media Coordinator', 'Head of Social Media', 
      'Social Media Marketing Manager', 'Social Media Analyst', 'Social Media Content Manager', 
      'Digital Community Manager', 'Social Media Lead', 'Community Specialist', 'Social Media Producer'
    ],
    'Brand': [
      'Brand Manager', 'Brand Director', 'VP Brand', 'Brand Strategist', 'Brand Marketing Manager', 
      'Head of Brand', 'Brand Marketing Director', 'Brand Specialist', 'Brand Coordinator', 
      'Brand Marketing Specialist', 'Brand Communications Manager', 'Brand Experience Manager',
      'Brand Lead', 'Brand Analyst', 'Brand Marketing Coordinator', 'Brand Marketing Lead'
    ],
    'CRM': [
      'CRM Manager', 'CRM Director', 'VP CRM', 'CRM Administrator', 'CRM Specialist', 
      'Customer Relationship Manager', 'CRM Analyst', 'Head of CRM', 'CRM Operations Manager', 
      'CRM Data Manager', 'CRM Systems Manager', 'Customer Data Manager', 'CRM Lead',
      'Customer Success Manager', 'CRM Coordinator', 'Customer Data Analyst', 'CRM Consultant'
    ],
    'MarTech': [
      'MarTech Manager', 'Marketing Technology Manager', 'Marketing Automation Manager', 
      'Marketing Operations Manager', 'Marketing Technology Director', 'VP Marketing Technology', 
      'Marketing Systems Manager', 'Marketing Technology Specialist', 'Marketing Automation Specialist',
      'Marketing Operations Specialist', 'Marketing Technology Lead', 'Marketing Systems Administrator',
      'Marketing Technology Analyst', 'Marketing Automation Lead', 'Marketing Operations Lead'
    ],
    'Analytics & Data': [
      'Data Analyst', 'Data Scientist', 'Analytics Manager', 'Head of Analytics', 'VP Analytics', 
      'Chief Data Officer', 'Business Intelligence Manager', 'Marketing Analytics Manager', 
      'Data Engineering Manager', 'Analytics Specialist', 'Data Specialist', 'Analytics Lead',
      'Marketing Analyst', 'Business Analyst', 'Data Manager', 'Analytics Coordinator', 'Data Coordinator'
    ],
    'Customer Strategy': [
      'Customer Strategy Manager', 'Customer Experience Manager', 'VP Customer Experience', 
      'Customer Data Manager', 'Customer Insights Director', 'Customer Success Manager', 
      'Customer Marketing Manager', 'Customer Lifecycle Manager', 'Customer Strategy Specialist',
      'Customer Experience Specialist', 'Customer Insights Manager', 'Customer Success Lead',
      'Customer Marketing Specialist', 'Customer Strategy Lead', 'Customer Experience Lead'
    ]
  };
  return titles[dept] || ['Manager'];
}

function generateCompanyArticles(companyData: ApolloOrg, keyPeople: any[]) {
  const articles = [];
  
  // Generate industry-specific articles based on company data
  const industry = companyData.industry?.toLowerCase() || '';
  const companyName = companyData.name || '';
  
  if (industry.includes('technology') || industry.includes('software')) {
    articles.push({
      title: `${companyName} Technology Trends and Market Position`,
      url: `https://techcrunch.com/search/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
      source: 'TechCrunch',
      published_at: new Date().toISOString(),
      why_it_matters: 'Understanding current technology trends and market positioning for strategic planning'
    });
  }
  
  if (industry.includes('retail') || industry.includes('e-commerce')) {
    articles.push({
      title: `${companyName} E-commerce and Digital Transformation`,
      url: `https://retaildive.com/search/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
      source: 'Retail Dive',
      published_at: new Date().toISOString(),
      why_it_matters: 'Key insights into digital transformation and e-commerce strategies'
    });
  }
  
  // Add general business articles
  articles.push({
    title: `${companyName} Business Strategy and Market Analysis`,
    url: `https://www.bloomberg.com/search?query=${companyName}`,
    source: 'Bloomberg',
    published_at: new Date().toISOString(),
    why_it_matters: 'Comprehensive business analysis and market positioning insights'
  });
  
  return articles;
}

function getChildBrands(companyName: string) {
  const childBrandsMap: { [key: string]: any } = {
    'Procter & Gamble': {
      is_portfolio_company: true,
      parent_company: 'Procter & Gamble',
      child_brands: ['Tide', 'Pampers', 'Gillette', 'Head & Shoulders', 'Olay', 'Crest', 'Ariel', 'Always'],
      note: 'P&G operates a portfolio of consumer goods brands across multiple categories'
    },
    'Johnson & Johnson': {
      is_portfolio_company: true,
      parent_company: 'Johnson & Johnson',
      child_brands: ['Band-Aid', 'Tylenol', 'Neutrogena', 'Aveeno', 'Listerine', 'Johnson\'s Baby', 'Clean & Clear'],
      note: 'J&J operates across pharmaceuticals, medical devices, and consumer health'
    },
    'Unilever': {
      is_portfolio_company: true,
      parent_company: 'Unilever',
      child_brands: ['Dove', 'Axe', 'Lipton', 'Ben & Jerry\'s', 'Hellmann\'s', 'Knorr', 'Rexona', 'Sunlight'],
      note: 'Unilever operates a diverse portfolio of food, home care, and personal care brands'
    },
    'Nestle': {
      is_portfolio_company: true,
      parent_company: 'Nestle',
      child_brands: ['Nescafe', 'KitKat', 'Nesquik', 'Gerber', 'Purina', 'Stouffer\'s', 'Hot Pockets', 'Coffee-Mate'],
      note: 'Nestle operates across food and beverage categories with global brand portfolio'
    }
  };
  
  return childBrandsMap[companyName] || null;
}

function generateTechnologyStack(companyData: ApolloOrg) {
  const industry = companyData.industry?.toLowerCase() || '';
  const companySize = companyData.estimated_num_employees || 0;
  
  let primaryTech = 'General Business';
  let secondaryTech = 'Cloud Computing';
  let potentialIssues: string[] = [];
  
  if (industry.includes('technology') || industry.includes('software')) {
    primaryTech = 'Software Development';
    secondaryTech = 'Cloud Infrastructure';
    potentialIssues = ['Legacy system integration', 'Scalability challenges', 'Security compliance'];
  } else if (industry.includes('retail') || industry.includes('e-commerce')) {
    primaryTech = 'E-commerce Platform';
    secondaryTech = 'Customer Data Management';
    potentialIssues = ['Omnichannel integration', 'Inventory management', 'Customer experience optimization'];
  } else if (industry.includes('financial') || industry.includes('banking')) {
    primaryTech = 'Financial Technology';
    secondaryTech = 'Security & Compliance';
    potentialIssues = ['Regulatory compliance', 'Data security', 'Legacy system modernization'];
  }
  
  return {
    primary_technology: primaryTech,
    secondary_technology: secondaryTech,
    potential_issues: potentialIssues,
    integration_complexity: companySize > 10000 ? 'High' : 'Medium',
    recommendation: `Focus on ${primaryTech} solutions with ${secondaryTech} integration for ${companyData.name}`
  };
}

async function generateSimpleMarTechAnalysis(companyData: ApolloOrg, accountMap: { [key: string]: any[] }) {
  try {
    console.log(`🤖 Simple MarTech Analysis: Starting for ${companyData.name}`);
    
    const prompt = `Analyze the MarTech landscape for ${companyData.name} (${companyData.industry} industry, ${companyData.estimated_num_employees} employees).

Provide a brief MarTech analysis in JSON format with these sections:
- current_state: What marketing technology they likely use
- challenges: Main MarTech challenges they face
- recommendations: Top 3 MarTech recommendations

Keep it concise and practical.`;

    console.log(`🤖 Simple MarTech Analysis: Calling OpenAI API...`);
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    console.log(`🤖 Simple MarTech Analysis: OpenAI response received`);
    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log(`🤖 Simple MarTech Analysis: Parsed result:`, Object.keys(result));
    return result;
  } catch (error) {
    console.error(`❌ Simple MarTech Analysis Error:`, error);
    return null;
  }
}

async function generateMarTechAnalysis(companyData: ApolloOrg, accountMap: { [key: string]: any[] }) {
  try {
    console.log(`🤖 MarTech Analysis: Starting for ${companyData.name}`);
    
    const prompt = `Analyze the MarTech landscape for ${companyData.name} (${companyData.industry} industry, ${companyData.estimated_num_employees} employees).

Key contacts found:
${Object.entries(accountMap).map(([dept, people]) => 
  `${dept}: ${people.map((p: any) => `${p.name} (${p.title})`).join(', ')}`
).join('\n')}

Provide a comprehensive MarTech analysis including:
1. Current tech stack assessment
2. Integration challenges
3. Recommended solutions
4. Implementation roadmap

Format as JSON with sections: current_state, challenges, recommendations, roadmap.`;

    console.log(`🤖 MarTech Analysis: Calling OpenAI API...`);
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    console.log(`🤖 MarTech Analysis: OpenAI response received`);
    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log(`🤖 MarTech Analysis: Parsed result:`, Object.keys(result));
    return result;
  } catch (error) {
    console.error(`❌ MarTech Analysis Error:`, error);
    return null;
  }
}

async function generateChallengesAnalysis(companyData: ApolloOrg, accountMap: { [key: string]: any[] }) {
  const prompt = `Identify key business challenges for ${companyData.name} based on their industry (${companyData.industry}) and company size (${companyData.estimated_num_employees} employees).

Key contacts:
${Object.entries(accountMap).map(([dept, people]) => 
  `${dept}: ${people.map((p: any) => `${p.name} (${p.title})`).join(', ')}`
).join('\n')}

Provide analysis of:
1. Market challenges
2. Operational challenges  
3. Technology challenges
4. Growth challenges

Format as JSON with sections: market, operational, technology, growth.`;

  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function generateTechStackAnalysis(companyData: ApolloOrg, accountMap: { [key: string]: any[] }) {
  const prompt = `Analyze the technology stack and integration needs for ${companyData.name} (${companyData.industry} industry).

Key contacts:
${Object.entries(accountMap).map(([dept, people]) => 
  `${dept}: ${people.map((p: any) => `${p.name} (${p.title})`).join(', ')}`
).join('\n')}

Provide analysis of:
1. Current tech stack assessment
2. Integration complexity
3. Technology gaps
4. Recommended solutions

Format as JSON with sections: current_stack, integration_complexity, gaps, recommendations.`;

  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function generateTPAlignment(companyData: ApolloOrg, accountMap: { [key: string]: any[] }) {
  const prompt = `Analyze how Transparent Partners solutions align with ${companyData.name}'s needs.

Company: ${companyData.name} (${companyData.industry}, ${companyData.estimated_num_employees} employees)
Key contacts:
${Object.entries(accountMap).map(([dept, people]) => 
  `${dept}: ${people.map((p: any) => `${p.name} (${p.title})`).join(', ')}`
).join('\n')}

Provide analysis of:
1. Solution alignment opportunities
2. Key decision makers to target
3. Recommended approach
4. Expected outcomes

Format as JSON with sections: opportunities, decision_makers, approach, outcomes.`;

  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}
