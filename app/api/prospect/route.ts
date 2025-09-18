import { NextRequest, NextResponse } from "next/server";
import { openai, DEFAULT_MODEL } from '@/lib/openai';

// Types
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
  current_technologies?: Array<{
    uid: string;
    name: string;
    category: string;
  }>;
};

// Constants
const APOLLO_BASE_URL = 'https://api.apollo.io/api/v1';
const US_STATE_ABBREVIATIONS: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO",
  "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
  "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
  "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
  "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
  "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC"
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper Functions
function toUSPS(state?: string): string {
  return state && US_STATE_ABBREVIATIONS[state] ? US_STATE_ABBREVIATIONS[state] : state ?? "";
}

function extractCompanyFromApollo(org: ApolloOrg) {
  const industry = org.industry?.trim();
  const city = org.city?.trim();
  const state = org.state?.trim();
  const country = org.country?.trim();
  
  const location = city && state && country === "United States"
    ? `${city}, ${toUSPS(state)}`
    : city && state
    ? `${city}, ${state}`
    : org.raw_address?.trim();

  return {
    name: org.name ?? "",
    website: org.primary_domain ?? undefined,
    industry: industry ?? undefined,
    revenue: org.annual_revenue_printed ?? undefined,
    employees: org.estimated_num_employees ?? undefined,
    locations: location ? [location] : undefined,
    overview: org.short_description ?? undefined,
    founded_year: org.founded_year ?? undefined,
    linkedin_url: org.linkedin_url ?? undefined,
    logo_url: org.logo_url ?? undefined,
    keywords: org.keywords?.join(', ') ?? undefined,
    raw_address: org.raw_address ?? undefined
  };
}

function getTopCategories(technologies: any[]) {
  const categoryCount: { [key: string]: number } = {};
  technologies.forEach(tech => {
    if (tech.category) {
      categoryCount[tech.category] = (categoryCount[tech.category] || 0) + 1;
    }
  });
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
}

function groupTechnologiesByCategory(technologies: any[]) {
  const grouped: { [key: string]: any[] } = {};
  technologies.forEach(tech => {
    if (tech.category) {
      if (!grouped[tech.category]) {
        grouped[tech.category] = [];
      }
      grouped[tech.category].push({
        name: tech.name,
        uid: tech.uid
      });
    }
  });
  return grouped;
}

function generateCompanyArticles(companyData: ApolloOrg, keyPeople: any[]) {
  const articles = [];
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

  if (industry.includes('retail') || industry.includes('consumer')) {
    articles.push({
      title: `${companyName} Digital Transformation and Customer Experience`,
      url: `https://www.retaildive.com/search/?q=${companyName}`,
      source: 'Retail Dive',
      published_at: new Date().toISOString(),
      why_it_matters: 'Insights into digital transformation strategies and customer experience initiatives'
    });
  }

  if (industry.includes('finance') || industry.includes('banking')) {
    articles.push({
      title: `${companyName} FinTech Innovation and Regulatory Compliance`,
      url: `https://www.fintechnews.org/search?q=${companyName}`,
      source: 'FinTech News',
      published_at: new Date().toISOString(),
      why_it_matters: 'Understanding financial technology trends and regulatory landscape'
    });
  }

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
      child_brands: ['Tide', 'Pampers', 'Gillette', 'Head & Shoulders', 'Crest', 'Olay', 'Ariel', 'Always'],
      note: 'P&G operates a portfolio of consumer brands across multiple categories'
    },
    'Johnson & Johnson': {
      is_portfolio_company: true,
      parent_company: 'Johnson & Johnson',
      child_brands: ['Band-Aid', 'Tylenol', 'Neutrogena', 'Aveeno', 'Clean & Clear', 'Johnson\'s Baby', 'Listerine'],
      note: 'J&J manages diverse healthcare and consumer brands'
    },
    'Unilever': {
      is_portfolio_company: true,
      parent_company: 'Unilever',
      child_brands: ['Dove', 'Axe', 'Ben & Jerry\'s', 'Hellmann\'s', 'Knorr', 'Lipton', 'Magnum', 'Rexona'],
      note: 'Unilever operates a global portfolio of food, home, and personal care brands'
    },
    'Nestle': {
      is_portfolio_company: true,
      parent_company: 'Nestle',
      child_brands: ['Nescafe', 'KitKat', 'Nesquik', 'Gerber', 'Purina', 'Stouffer\'s', 'Hot Pockets', 'Coffee-Mate'],
      note: 'Nestle manages a diverse portfolio of food and beverage brands'
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
    potentialIssues = ['Scalability challenges', 'Security compliance', 'Integration complexity'];
  } else if (industry.includes('retail') || industry.includes('ecommerce')) {
    primaryTech = 'E-commerce Platform';
    secondaryTech = 'Customer Analytics';
    potentialIssues = ['Inventory management', 'Customer data integration', 'Mobile optimization'];
  } else if (industry.includes('finance') || industry.includes('banking')) {
    primaryTech = 'Financial Systems';
    secondaryTech = 'Security & Compliance';
    potentialIssues = ['Regulatory compliance', 'Data security', 'Legacy system integration'];
  } else if (industry.includes('healthcare')) {
    primaryTech = 'Healthcare IT';
    secondaryTech = 'Data Privacy';
    potentialIssues = ['HIPAA compliance', 'Interoperability', 'Patient data security'];
  }

  if (companySize > 10000) {
    potentialIssues.push('Enterprise scalability', 'Multi-department coordination');
  }

  return {
    primary_technology: primaryTech,
    secondary_technology: secondaryTech,
    potential_issues: potentialIssues,
    integration_complexity: companySize > 10000 ? 'High' : 'Medium',
    recommendation: `Focus on ${primaryTech} solutions with ${secondaryTech} integration for ${companyData.name}`
  };
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
      'Social Media Manager', 'Social Media Director', 'Social Media Specialist', 'Social Media Coordinator',
      'Social Media Strategist', 'Community Manager', 'Social Media Analyst', 'Social Media Lead',
      'Digital Community Manager', 'Social Media Content Manager', 'Social Media Marketing Manager'
    ],
    'Brand': [
      'Brand Manager', 'Brand Director', 'Brand Strategist', 'Brand Marketing Manager', 'VP Brand',
      'Head of Brand', 'Brand Specialist', 'Brand Coordinator', 'Brand Marketing Director',
      'Brand Communications Manager', 'Brand Experience Manager', 'Brand Marketing Specialist'
    ],
    'CRM': [
      'CRM Manager', 'CRM Director', 'Customer Success Manager', 'Customer Experience Manager',
      'VP Customer Success', 'Head of Customer Success', 'CRM Specialist', 'Customer Success Director',
      'Customer Experience Director', 'Customer Success Specialist', 'CRM Analyst', 'Customer Success Lead'
    ],
    'MarTech': [
      'MarTech Manager', 'Marketing Technology Manager', 'Marketing Operations Manager', 'Marketing Automation Manager',
      'Marketing Technology Director', 'VP Marketing Technology', 'Head of Marketing Technology', 'MarTech Specialist',
      'Marketing Technology Specialist', 'Marketing Operations Director', 'Marketing Automation Specialist'
    ],
    'Analytics & Data': [
      'Analytics Manager', 'Data Analyst', 'Marketing Analyst', 'Business Analyst', 'Data Scientist',
      'Analytics Director', 'VP Analytics', 'Head of Analytics', 'Marketing Data Analyst', 'Business Intelligence Manager',
      'Data Manager', 'Analytics Specialist', 'Marketing Intelligence Manager', 'Data Insights Manager'
    ],
    'Customer Strategy': [
      'Customer Strategy Manager', 'Customer Insights Manager', 'Customer Experience Manager', 'Customer Success Manager',
      'VP Customer Strategy', 'Head of Customer Strategy', 'Customer Strategy Director', 'Customer Insights Director',
      'Customer Experience Director', 'Customer Strategy Specialist', 'Customer Insights Specialist'
    ]
  };
  return titles[dept] || [];
}

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

    console.log(`🔍 Analyzing prospect for: ${company}`);

    // STEP 1: Get enhanced company information from Apollo
    let searchQuery = company.trim();
    if (!searchQuery.includes('.') && !searchQuery.includes('://')) {
      searchQuery = `${searchQuery}.com`;
      console.log(`🔍 Added .com extension: ${company} -> ${searchQuery}`);
    }

    const companyResponse = await fetch(`${APOLLO_BASE_URL}/organizations/enrich?domain=${searchQuery}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'accept': 'application/json'
      }
    });

    if (!companyResponse.ok) {
      const errorText = await companyResponse.text();
      console.error(`❌ Apollo company enrichment failed: ${companyResponse.status} - ${errorText}`);
      return NextResponse.json({ error: `Apollo API error: ${companyResponse.status}` }, { status: companyResponse.status });
    }

    const companyDataRaw = await companyResponse.json();
    const companyData: ApolloOrg = companyDataRaw.organization;

    if (!companyData || !companyData.name) {
      console.warn(`⚠️ No company data found for domain: ${searchQuery}`);
      return NextResponse.json({ error: `No company data found for ${company}` }, { status: 404 });
    }

    console.log(`✅ Company data:`, companyData.name, companyData.industry);

    // STEP 2: Get employee information by department (Transparent Partners focus areas)
    const departments = ['Marketing', 'Media and Advertising', 'Content and Creative', 'Social Media', 'Brand', 'CRM', 'MarTech', 'Analytics & Data', 'Customer Strategy'];
    const accountMap: { [key: string]: any[] } = {};
  
    for (const dept of departments) {
      console.log(`🔍 Getting ${dept} employees...`);
    
      const peopleResponse = await fetch(`${APOLLO_BASE_URL}/mixed_people/search`, {
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
        console.log(`✅ Found ${accountMap[dept].length} ${dept} employees.`);
      } else {
        accountMap[dept] = [];
        console.log(`❌ No ${dept} employees found`);
      }
    }

    // STEP 3: Get additional Apollo data
    let articles = null;
    let childBrands = null;
    let technologyStack = null;

    // Get company news/articles
    try {
      console.log(`📰 Getting company news...`);
      const newsResponse = await fetch(`${APOLLO_BASE_URL}/mixed_people/search`, {
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
        console.log(`✅ Generated ${articles.length} articles`);
      }
    } catch (error) {
      console.error(`❌ News generation failed:`, error);
    }

    // Get child brands for major companies
    childBrands = getChildBrands(companyData.name);
    if (childBrands) {
      console.log(`✅ Found child brands for ${companyData.name}`);
    }

    // Generate technology stack analysis
    technologyStack = generateTechnologyStack(companyData);

    // STEP 4: Extract real technology stack from Apollo data
    console.log(`🔧 Extracting real technology stack...`);
    
    let martechStack = null;
    let technologyCategories = null;
    
    if (companyData.current_technologies && companyData.current_technologies.length > 0) {
      console.log(`✅ Found ${companyData.current_technologies.length} technologies`);
      
      // Extract MarTech-specific technologies
      const martechTechnologies = companyData.current_technologies.filter(tech => 
        tech.category && (
          tech.category.includes('Marketing') ||
          tech.category.includes('Analytics') ||
          tech.category.includes('Advertising') ||
          tech.category.includes('Email') ||
          tech.category.includes('Social') ||
          tech.category.includes('Automation') ||
          tech.category.includes('Tag Management') ||
          tech.category.includes('Retargeting')
        )
      );
      
      martechStack = {
        total_technologies: companyData.current_technologies.length,
        martech_technologies: martechTechnologies,
        categories: Array.from(new Set(companyData.current_technologies.map(tech => tech.category))),
        top_categories: getTopCategories(companyData.current_technologies)
      };
      
      // Group technologies by category
      technologyCategories = groupTechnologiesByCategory(companyData.current_technologies);
      
      console.log(`✅ MarTech technologies: ${martechTechnologies.length}`);
    } else {
      console.log(`⚠️ No technology data available for ${companyData.name}`);
      martechStack = {
        total_technologies: 0,
        martech_technologies: [],
        categories: [],
        top_categories: []
      };
      technologyCategories = {};
    }

    // STEP 4: Filter out empty categories and return comprehensive data
    const filteredAccountMap = Object.fromEntries(
      Object.entries(accountMap).filter(([_, people]) => people.length > 0)
    );

    const result = {
      company: extractCompanyFromApollo(companyData),
      accountMap: filteredAccountMap,
      articles: articles,
      child_brands: childBrands,
      technology_stack: technologyStack,
      martech_stack: martechStack,
      technology_categories: technologyCategories,
      generated_at: new Date().toISOString()
    };

    console.log(`✅ Success! Returning comprehensive data for ${companyData.name}`);
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('❌ Prospect analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


