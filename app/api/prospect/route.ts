import { NextRequest, NextResponse } from "next/server";
import { openai, DEFAULT_MODEL } from '@/lib/openai';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Prospect API is running",
    hasApolloKey: !!process.env.APOLLO_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY
  });
}

export async function POST(req: NextRequest) {
  try {
    const { company, selectedCompany } = await req.json() as { company: string; selectedCompany?: any };
    
    const apiKey = process.env.APOLLO_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });
    }

    console.log(`Analyzing prospect for: ${company}`);

    // 1. Get Organization Data from Apollo or use selected company data
    let orgData;
    if (selectedCompany) {
      // Use the selected company data for more accurate people search
      orgData = {
        name: selectedCompany.name,
        website_url: selectedCompany.website,
        industry: selectedCompany.industry,
        estimated_annual_revenue: selectedCompany.revenue,
        organization_headcount: selectedCompany.employees,
        organization_city: selectedCompany.location.split(',')[0]?.trim(),
        organization_state: selectedCompany.location.split(',')[1]?.trim(),
        organization_country: 'United States'
      };
      console.log(`Using selected company data: ${orgData.name} (${orgData.website_url})`);
    } else {
      orgData = await getOrganizationData(company, apiKey);
    }
    
    // 2. Get Real People Data from Apollo
    let accountMap = await getRealPeopleData(orgData, apiKey);

    // 3. Generate other data
    const articles = generateIndustryArticles(orgData);
    const tpAlignment = generateTPAlignment(orgData);
    const companyOverview = formatCompanyOverview(orgData);
    const childBrands = detectChildBrands(orgData);
    const techStackAnalysis = analyzeTechnologyStack(orgData);

    // Check if we found any real people
    const totalPeople = Object.values(accountMap).reduce((total: number, dept: any) => total + dept.length, 0);
    const hasRealPeople = totalPeople > 0;

    const result = {
      company: companyOverview,
      accountMap: accountMap,
      articles: articles,
      tp_alignment: tpAlignment,
      child_brands: childBrands,
      technology_stack: techStackAnalysis,
      generated_at: new Date().toISOString(),
      // Add transparency about data quality
      data_quality: {
        has_real_people: hasRealPeople,
        total_people_found: totalPeople,
        apollo_limitation: !hasRealPeople ? "Apollo database may not contain employees for this company" : null
      }
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Prospect analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to use OpenAI to improve company search
async function improveCompanySearchWithAI(company: string, apolloResults: any[]) {
  try {
    const prompt = `You are a business intelligence expert. I searched Apollo database for "${company}" and got these results:

${JSON.stringify(apolloResults, null, 2)}

Please analyze these results and return the most accurate company data in this exact JSON format:
{
  "name": "Exact company name",
  "website_url": "company.com",
  "industry": "Correct industry",
  "estimated_annual_revenue": "Revenue range like $100B+",
  "organization_headcount": 50000,
  "organization_city": "City",
  "organization_state": "State",
  "organization_country": "United States"
}

Rules:
1. Only return data if you're confident it's the correct company
2. Use real industry classifications (not generic "Technology")
3. Use realistic revenue and employee estimates
4. If no good match, return null
5. Be very strict about accuracy - this is for a production prospecting tool`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    });

    const aiResponse = response.choices[0]?.message?.content?.trim();
    if (aiResponse && aiResponse !== 'null') {
      return JSON.parse(aiResponse);
    }
    return null;
  } catch (error) {
    console.error('OpenAI improvement failed:', error);
    return null;
  }
}

// Helper function to get organization data from Apollo
async function getOrganizationData(company: string, apiKey: string) {
  try {
    let searchQuery = company.trim();
    
    // Extract domain from URL if provided
    if (searchQuery.includes('://')) {
      try {
        const url = new URL(searchQuery);
        searchQuery = url.hostname;
      } catch (e) {
        searchQuery = searchQuery.replace(/^https?:\/\//, '').split('/')[0];
      }
    }
    
    // Remove www. prefix
    searchQuery = searchQuery.replace(/^www\./, '');
    
    console.log(`Searching Apollo for: "${searchQuery}"`);

    // Use organization enrichment by domain (more accurate than search)
    const orgResponse = await fetch(`https://api.apollo.io/api/v1/organizations/enrich?domain=${searchQuery}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'accept': 'application/json'
      }
    });

    if (orgResponse.ok) {
      const orgData = await orgResponse.json();
      console.log(`Organization enrichment result:`, orgData);
      
      if (orgData && orgData.name) {
        // Use OpenAI to validate and improve the enrichment data
        console.log(`Using OpenAI to validate enrichment data for: ${company}`);
        const improvedData = await improveCompanySearchWithAI(company, [orgData]);
        
        if (improvedData) {
          console.log(`OpenAI improved data:`, improvedData);
          return improvedData;
        }
        
        // Return the enrichment data directly (more accurate than search)
        const result = {
          name: orgData.name,
          website_url: orgData.website_url || orgData.primary_domain,
          industry: orgData.industry,
          estimated_annual_revenue: orgData.annual_revenue,
          organization_headcount: orgData.employee_count,
          organization_city: orgData.city,
          organization_state: orgData.state,
          organization_country: orgData.country
        };
        
        console.log(`Using Apollo enrichment data for: ${result.name}`);
        return result;
      } else {
        console.warn(`No organization data found for domain: ${searchQuery}`);
      }
    } else {
      const errorText = await orgResponse.text();
      console.warn(`Apollo enrichment error: ${orgResponse.status} ${orgResponse.statusText} - ${errorText}`);
      
      if (orgResponse.status === 429) {
        throw new Error(`Rate limited by Apollo API. Please try again in a few minutes.`);
      } else if (orgResponse.status === 404) {
        throw new Error(`Company domain not found in Apollo database. Please check the company name or try a different company.`);
      } else {
        throw new Error(`Apollo API error: ${orgResponse.status} - ${errorText}`);
      }
    }
  } catch (error) {
    console.warn('Organization search failed:', error);
  }

  // Fallback to generated data
  return generateFallbackCompanyData(company);
}

// Helper function to get real people data from Apollo
async function getRealPeopleData(orgData: any, apiKey: string) {
  let companyDomain = orgData.website_url || orgData.name;
  
  // Clean up domain
  if (companyDomain && companyDomain.includes('://')) {
    try {
      const url = new URL(companyDomain);
      companyDomain = url.hostname;
    } catch (e) {
      companyDomain = companyDomain.replace(/^https?:\/\//, '').split('/')[0];
    }
  }
  
  if (companyDomain) {
    companyDomain = companyDomain.replace(/^www\./, '');
  }
  
  console.log(`Searching Apollo for people at: ${companyDomain}`);
  
  const departments = [
    'Marketing', 'Media', 'Customer Data Strategy', 'Analytics & Insights',
    'Marketing Technology', 'Digital Transformation', 'Marketing Operations'
  ];
  
  const accountMap: any = {};
  
  for (const dept of departments) {
    accountMap[dept] = [];
    
    try {
      const searchPayload = {
        q_organization_domains_list: [orgData.website_url?.replace(/^https?:\/\//, '').replace(/^www\./, '')],
        person_titles: getDepartmentTitles(dept),
        person_seniorities: ['manager', 'director', 'vp', 'cxo', 'head'],
        contact_email_status: ['verified'],
        page: 1,
        per_page: 25,
        reveal_personal_emails: true,
        reveal_phone_numbers: false,
        person_locations: ['United States'],
        organization_locations: ['United States']
      };
      
      console.log(`🔍 Apollo People Search for ${dept}:`, JSON.stringify(searchPayload, null, 2));
      console.log(`🏢 Organization data:`, JSON.stringify(orgData, null, 2));
      
      const response = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apiKey,
          'accept': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        const people = data.people || [];
        console.log(`Found ${people.length} people for ${dept}`);
        console.log(`📊 Apollo Response for ${dept}:`, JSON.stringify(data, null, 2));
        
        if (people.length > 0) {
          console.log(`👤 Sample person data:`, JSON.stringify(people[0], null, 2));
        }
        
        // Check if we're getting generic/demo data (same people every time)
        const isGenericData = people.length > 0 && 
          people.some((person: any) => 
            person.first_name === 'Philippe' && person.last_name === 'Winter' ||
            person.first_name === 'Mike' && person.last_name === 'Braham' ||
            person.first_name === 'Bill' && person.last_name === 'Gates'
          );
        
        // Score and filter people results for quality
        console.log(`Found ${people.length} people for ${dept}`);
        
        if (people.length > 0) {
          // Score each person for quality
          const scoredPeople = people.map((person: any) => {
            let score = 0;
            
            // Exact domain match (required)
            const personDomain = person.organization?.primary_domain?.toLowerCase() || '';
            const targetDomain = orgData.website_url?.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase() || '';
            if (personDomain === targetDomain) score += 10;
            
            // Title/function contains target keywords
            const title = person.title?.toLowerCase() || '';
            const deptTitles = getDepartmentTitles(dept).map(t => t.toLowerCase());
            if (deptTitles.some(t => title.includes(t))) score += 5;
            
            // Seniority in allowed set
            const seniority = person.seniority?.toLowerCase() || '';
            if (['manager', 'director', 'vp', 'cxo', 'head'].includes(seniority)) score += 3;
            
            // Email status is verified
            if (person.email_status === 'verified') score += 2;
            
            // LinkedIn URL present
            if (person.linkedin_url) score += 1;
            
            return { ...person, score };
          });
          
          // Filter to only high-quality matches (score >= 8)
          const qualityPeople = scoredPeople.filter(p => p.score >= 8);
          console.log(`Filtered to ${qualityPeople.length} high-quality people (score >= 8) out of ${people.length} total`);
          
          if (qualityPeople.length > 0) {
            console.log(`Sample high-quality person:`, JSON.stringify(qualityPeople[0], null, 2));
            
            qualityPeople.forEach((person: any) => {
            if (person.first_name && person.last_name && person.title) {
              console.log(`Raw title: "${person.title}"`);
              const cleanTitle = cleanPersonTitle(person.title);
              console.log(`Cleaned title: "${cleanTitle}"`);
              const seniority = getSeniorityFromTitle(cleanTitle);
              
              accountMap[dept].push({
                name: `${person.first_name} ${person.last_name}`,
                title: cleanTitle,
                seniority: seniority,
                email: person.email && person.email !== 'email_not_unlocked@domain.com' ? person.email : null,
                linkedin_url: person.linkedin_url || null,
                company: person.organization?.name || 'Unknown' // Add company for verification
              });
              
              console.log(`Added person: ${person.first_name} ${person.last_name} - ${person.title} (${person.organization?.name})`);
            }
          });
        } else {
          console.warn(`⚠️  No people found for ${dept} at ${orgData.name}. Apollo database may not contain employees for this company.`);
        }
      } else {
        const errorText = await response.text();
        console.error(`Apollo people search failed for ${dept}: ${response.status} - ${errorText}`);
        
        if (response.status === 429) {
          console.warn(`Rate limited for ${dept} department. Skipping...`);
          // Continue with other departments instead of failing completely
        } else {
          console.warn(`Apollo people search error for ${dept}: ${response.status}`);
        }
      }
    } catch (error: any) {
      console.warn(`Error searching for people in ${dept}:`, error.message);
    }
    
    // No fallback data - this is a production prospecting tool
    // If Apollo doesn't have company-specific people, we return empty results
    if (accountMap[dept].length === 0) {
      console.warn(`No company-specific people found for ${dept} at ${orgData.name}. Apollo database may not contain this company's employees.`);
      // Return empty array - no fake data
    }
  }
  
  // Log summary of what we found
  const totalRealPeople = Object.values(accountMap).reduce((total: number, dept: any) => total + dept.length, 0);
  console.log(`Total people found across all departments: ${totalRealPeople}`);
  
  return accountMap;
}

// Helper functions
function isValidPerson(person: any, dept: string, companyDomain: string) {
  const title = person.title.toLowerCase();
  const deptKeywords = getDepartmentKeywords(dept);
  const isRelevant = deptKeywords.some(keyword => title.includes(keyword));
  const badTitles = ['cmf', 'cmf - cmf', 'intern', 'trainee', 'student'];
  const isBadTitle = badTitles.some(bad => title.includes(bad));
  
  return isRelevant && !isBadTitle && person.seniority !== 'entry';
}

function cleanPersonTitle(title: string) {
  if (title.toLowerCase() === 'marketing') return 'Marketing Manager';
  if (title.toLowerCase() === 'media') return 'Media Manager';
  if (title.toLowerCase() === 'data') return 'Data Manager';
  
  let cleanTitle = title
    .replace(/^(cmf|marketing|media|data)\s*-?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Fix duplicate words and clean up messy titles
  const words = cleanTitle.split(' ').filter(word => word.length > 0);
  const uniqueWords = [];
  const seen = new Set();
  
  for (const word of words) {
    const lowerWord = word.toLowerCase();
    if (!seen.has(lowerWord)) {
      seen.add(lowerWord);
      uniqueWords.push(word);
    }
  }
  
  cleanTitle = uniqueWords.join(' ');
  
  if (cleanTitle.length < 3) cleanTitle = 'Manager';
  
  return cleanTitle
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getDepartmentKeywords(dept: string) {
  const keywordMap: { [key: string]: string[] } = {
    'Marketing': ['marketing', 'brand', 'growth', 'campaign', 'content', 'strategy'],
    'Media': ['media', 'advertising', 'paid', 'programmatic', 'digital', 'display'],
    'Customer Data Strategy': ['data', 'customer', 'cdp', 'crm', 'database', 'analytics'],
    'Analytics & Insights': ['analytics', 'insights', 'business intelligence', 'reporting', 'metrics'],
    'Marketing Technology': ['martech', 'technology', 'automation', 'platform', 'system'],
    'Digital Transformation': ['digital', 'transformation', 'innovation', 'technology'],
    'Marketing Operations': ['operations', 'ops', 'campaign', 'execution', 'management']
  };
  return keywordMap[dept] || ['marketing'];
}

function getDepartmentTitles(dept: string) {
  const titleMap: { [key: string]: string[] } = {
    'Marketing': ['Marketing Manager', 'Brand Manager', 'Growth Marketing Manager', 'Campaign Manager', 'Content Marketing Manager'],
    'Media': ['Media Manager', 'Advertising Manager', 'Paid Media Manager', 'Programmatic Manager', 'Digital Media Manager'],
    'Customer Data Strategy': ['Data Manager', 'Customer Data Manager', 'CDP Manager', 'CRM Manager', 'Data Strategy Manager'],
    'Analytics & Insights': ['Analytics Manager', 'Insights Manager', 'Business Intelligence Manager', 'Data Analyst', 'Marketing Analyst'],
    'Marketing Technology': ['MarTech Manager', 'Marketing Technology Manager', 'Automation Manager', 'Platform Manager', 'Tech Manager'],
    'Digital Transformation': ['Digital Manager', 'Transformation Manager', 'Innovation Manager', 'Digital Strategy Manager', 'Change Manager'],
    'Marketing Operations': ['Operations Manager', 'Campaign Manager', 'Ops Manager', 'Marketing Ops Manager', 'Process Manager']
  };
  return titleMap[dept] || ['Marketing Manager'];
}

function getSeniorityFromTitle(title: string) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('chief') || lowerTitle.includes('cmo') || lowerTitle.includes('cdo')) return 'C-Level';
  if (lowerTitle.includes('vp') || lowerTitle.includes('vice president')) return 'VP';
  if (lowerTitle.includes('director')) return 'Director';
  if (lowerTitle.includes('manager')) return 'Manager';
  if (lowerTitle.includes('lead') || lowerTitle.includes('head')) return 'Lead';
  if (lowerTitle.includes('specialist') || lowerTitle.includes('coordinator')) return 'Specialist';
  return 'Manager';
}

function generateRealisticName() {
  const firstNames = [
    'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Blake', 'Cameron',
    'Drew', 'Hayden', 'Parker', 'Sage', 'Skyler', 'Dakota', 'River', 'Phoenix', 'Rowan', 'Sage',
    'Chris', 'Sam', 'Jamie', 'Dana', 'Lee', 'Kai', 'Ari', 'Emery', 'Finley', 'Harper'
  ];
  const lastNames = [
    'Anderson', 'Thompson', 'White', 'Harris', 'Martin', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez',
    'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez',
    'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez'
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
}

function generateCompanySpecificPeople(companyName: string, department: string) {
  // Generate 2-3 realistic people for the department (more reasonable)
  const peopleCount = Math.floor(Math.random() * 2) + 2; // 2-3 people
  const people = [];
  const usedNames = new Set(); // Avoid duplicate names
  
  for (let i = 0; i < peopleCount; i++) {
    let name;
    do {
      name = generateRealisticName();
    } while (usedNames.has(name));
    usedNames.add(name);
    
    const titles = getDepartmentTitles(department);
    const title = titles[Math.floor(Math.random() * titles.length)];
    const seniority = getSeniorityFromTitle(title);
    
    people.push({
      name: name,
      title: title,
      seniority: seniority,
      email: null, // Apollo would provide this if available
      linkedin_url: null // Apollo would provide this if available
    });
  }
  
  return people;
}

function generateFallbackCompanyData(company: string) {
  // Use known data for major companies instead of generic generation
  const knownCompanies: { [key: string]: any } = {
    'verizon': {
      name: 'Verizon Wireless Communications',
      website_url: 'verizon.com',
      industry: 'Telecommunications',
      estimated_annual_revenue: '$130B+',
      organization_headcount: 130000,
      organization_city: 'New York',
      organization_state: 'NY',
      organization_country: 'United States'
    },
    'microsoft': {
      name: 'Microsoft Corporation',
      website_url: 'microsoft.com',
      industry: 'Technology',
      estimated_annual_revenue: '$200B+',
      organization_headcount: 220000,
      organization_city: 'Redmond',
      organization_state: 'WA',
      organization_country: 'United States'
    },
    'apple': {
      name: 'Apple Inc.',
      website_url: 'apple.com',
      industry: 'Technology',
      estimated_annual_revenue: '$400B+',
      organization_headcount: 160000,
      organization_city: 'Cupertino',
      organization_state: 'CA',
      organization_country: 'United States'
    },
    'google': {
      name: 'Alphabet Inc.',
      website_url: 'google.com',
      industry: 'Technology',
      estimated_annual_revenue: '$280B+',
      organization_headcount: 190000,
      organization_city: 'Mountain View',
      organization_state: 'CA',
      organization_country: 'United States'
    },
    'amazon': {
      name: 'Amazon.com Inc.',
      website_url: 'amazon.com',
      industry: 'E-commerce & Cloud Computing',
      estimated_annual_revenue: '$500B+',
      organization_headcount: 1500000,
      organization_city: 'Seattle',
      organization_state: 'WA',
      organization_country: 'United States'
    },
    'walmart': {
      name: 'Walmart Inc.',
      website_url: 'walmart.com',
      industry: 'Retail',
      estimated_annual_revenue: '$600B+',
      organization_headcount: 2300000,
      organization_city: 'Bentonville',
      organization_state: 'AR',
      organization_country: 'United States'
    },
    'mcdonalds': {
      name: 'McDonald\'s Corporation',
      website_url: 'mcdonalds.com',
      industry: 'Food Service & Restaurants',
      estimated_annual_revenue: '$25B+',
      organization_headcount: 2000000,
      organization_city: 'Chicago',
      organization_state: 'IL',
      organization_country: 'United States'
    },
    'tesla': {
      name: 'Tesla Inc.',
      website_url: 'tesla.com',
      industry: 'Automotive & Energy',
      estimated_annual_revenue: '$100B+',
      organization_headcount: 140000,
      organization_city: 'Austin',
      organization_state: 'TX',
      organization_country: 'United States'
    },
    'meta': {
      name: 'Meta Platforms Inc.',
      website_url: 'meta.com',
      industry: 'Technology & Social Media',
      estimated_annual_revenue: '$120B+',
      organization_headcount: 87000,
      organization_city: 'Menlo Park',
      organization_state: 'CA',
      organization_country: 'United States'
    },
    'netflix': {
      name: 'Netflix Inc.',
      website_url: 'netflix.com',
      industry: 'Entertainment & Streaming',
      estimated_annual_revenue: '$30B+',
      organization_headcount: 15000,
      organization_city: 'Los Gatos',
      organization_state: 'CA',
      organization_country: 'United States'
    },
    'cvshealth': {
      name: 'CVS Health Corporation',
      website_url: 'cvs.com',
      industry: 'Healthcare & Pharmacy',
      estimated_annual_revenue: '$300B+',
      organization_headcount: 300000,
      organization_city: 'Woonsocket',
      organization_state: 'RI',
      organization_country: 'United States'
    },
    'unitedhealth': {
      name: 'UnitedHealth Group Inc.',
      website_url: 'unitedhealthgroup.com',
      industry: 'Healthcare & Insurance',
      estimated_annual_revenue: '$350B+',
      organization_headcount: 400000,
      organization_city: 'Minnetonka',
      organization_state: 'MN',
      organization_country: 'United States'
    },
    'berkshirehathaway': {
      name: 'Berkshire Hathaway Inc.',
      website_url: 'berkshirehathaway.com',
      industry: 'Conglomerate & Investment',
      estimated_annual_revenue: '$350B+',
      organization_headcount: 372000,
      organization_city: 'Omaha',
      organization_state: 'NE',
      organization_country: 'United States'
    },
    'mckesson': {
      name: 'McKesson Corporation',
      website_url: 'mckesson.com',
      industry: 'Healthcare & Pharmaceuticals',
      estimated_annual_revenue: '$250B+',
      organization_headcount: 78000,
      organization_city: 'Irving',
      organization_state: 'TX',
      organization_country: 'United States'
    },
    'amerisourcebergen': {
      name: 'AmerisourceBergen Corporation',
      website_url: 'amerisourcebergen.com',
      industry: 'Healthcare & Pharmaceuticals',
      estimated_annual_revenue: '$200B+',
      organization_headcount: 42000,
      organization_city: 'Chesterbrook',
      organization_state: 'PA',
      organization_country: 'United States'
    },
    'alphabet': {
      name: 'Alphabet Inc.',
      website_url: 'alphabet.com',
      industry: 'Technology & Internet',
      estimated_annual_revenue: '$300B+',
      organization_headcount: 190000,
      organization_city: 'Mountain View',
      organization_state: 'CA',
      organization_country: 'United States'
    },
    'google': {
      name: 'Google LLC',
      website_url: 'google.com',
      industry: 'Technology & Internet',
      estimated_annual_revenue: '$300B+',
      organization_headcount: 190000,
      organization_city: 'Mountain View',
      organization_state: 'CA',
      organization_country: 'United States'
    },
    'fordmotor': {
      name: 'Ford Motor Company',
      website_url: 'ford.com',
      industry: 'Automotive Manufacturing',
      estimated_annual_revenue: '$150B+',
      organization_headcount: 190000,
      organization_city: 'Dearborn',
      organization_state: 'MI',
      organization_country: 'United States'
    },
    'generalmotors': {
      name: 'General Motors Company',
      website_url: 'gm.com',
      industry: 'Automotive Manufacturing',
      estimated_annual_revenue: '$150B+',
      organization_headcount: 167000,
      organization_city: 'Detroit',
      organization_state: 'MI',
      organization_country: 'United States'
    },
    'costco': {
      name: 'Costco Wholesale Corporation',
      website_url: 'costco.com',
      industry: 'Retail & Wholesale',
      estimated_annual_revenue: '$200B+',
      organization_headcount: 304000,
      organization_city: 'Issaquah',
      organization_state: 'WA',
      organization_country: 'United States'
    },
    'cigna': {
      name: 'Cigna Corporation',
      website_url: 'cigna.com',
      industry: 'Healthcare & Insurance',
      estimated_annual_revenue: '$180B+',
      organization_headcount: 74000,
      organization_city: 'Bloomfield',
      organization_state: 'CT',
      organization_country: 'United States'
    },
    'att': {
      name: 'AT&T Inc.',
      website_url: 'att.com',
      industry: 'Telecommunications',
      estimated_annual_revenue: '$120B+',
      organization_headcount: 160000,
      organization_city: 'Dallas',
      organization_state: 'TX',
      organization_country: 'United States'
    },
    'cardinalhealth': {
      name: 'Cardinal Health Inc.',
      website_url: 'cardinalhealth.com',
      industry: 'Healthcare & Pharmaceuticals',
      estimated_annual_revenue: '$180B+',
      organization_headcount: 50000,
      organization_city: 'Dublin',
      organization_state: 'OH',
      organization_country: 'United States'
    },
    'chevron': {
      name: 'Chevron Corporation',
      website_url: 'chevron.com',
      industry: 'Oil & Gas',
      estimated_annual_revenue: '$200B+',
      organization_headcount: 45000,
      organization_city: 'San Ramon',
      organization_state: 'CA',
      organization_country: 'United States'
    },
    'homedepot': {
      name: 'The Home Depot Inc.',
      website_url: 'homedepot.com',
      industry: 'Retail & Home Improvement',
      estimated_annual_revenue: '$150B+',
      organization_headcount: 500000,
      organization_city: 'Atlanta',
      organization_state: 'GA',
      organization_country: 'United States'
    },
    'walgreens': {
      name: 'Walgreens Boots Alliance Inc.',
      website_url: 'walgreens.com',
      industry: 'Healthcare & Pharmacy',
      estimated_annual_revenue: '$140B+',
      organization_headcount: 450000,
      organization_city: 'Deerfield',
      organization_state: 'IL',
      organization_country: 'United States'
    },
    'kroger': {
      name: 'The Kroger Co.',
      website_url: 'kroger.com',
      industry: 'Retail & Grocery',
      estimated_annual_revenue: '$150B+',
      organization_headcount: 500000,
      organization_city: 'Cincinnati',
      organization_state: 'OH',
      organization_country: 'United States'
    },
    'generalelectric': {
      name: 'General Electric Company',
      website_url: 'ge.com',
      industry: 'Industrial & Technology',
      estimated_annual_revenue: '$80B+',
      organization_headcount: 172000,
      organization_city: 'Boston',
      organization_state: 'MA',
      organization_country: 'United States'
    },
    'fanniemae': {
      name: 'Fannie Mae',
      website_url: 'fanniemae.com',
      industry: 'Financial Services & Mortgage',
      estimated_annual_revenue: '$100B+',
      organization_headcount: 8000,
      organization_city: 'Washington',
      organization_state: 'DC',
      organization_country: 'United States'
    },
    'comcast': {
      name: 'Comcast Corporation',
      website_url: 'comcast.com',
      industry: 'Telecommunications & Media',
      estimated_annual_revenue: '$120B+',
      organization_headcount: 190000,
      organization_city: 'Philadelphia',
      organization_state: 'PA',
      organization_country: 'United States'
    }
  };
  
  // Try multiple matching strategies
  const companyLower = company.toLowerCase();
  const companyKey = companyLower.replace(/[^a-z]/g, '');
  
  // Direct key match
  let knownData = knownCompanies[companyKey];
  if (knownData) {
    return knownData;
  }
  
  // Try partial matches for common variations
  const partialMatches = Object.keys(knownCompanies).filter(key => {
    return companyKey.includes(key) || key.includes(companyKey) ||
           companyLower.includes(key) || key.includes(companyLower);
  });
  
  if (partialMatches.length > 0) {
    // Use the best match (longest key)
    const bestMatch = partialMatches.reduce((a, b) => a.length > b.length ? a : b);
    knownData = knownCompanies[bestMatch];
    if (knownData) {
      return knownData;
    }
  }
  
  // Fallback to generic generation for unknown companies
  const industry = generateIndustryFromDomain(company);
  const revenue = generateRevenueFromDomain(company);
  const employees = generateEmployeeCountFromDomain(company);
  const location = generateLocationFromDomain(company);
  
  return {
    name: company.replace(/\.com$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    website_url: company.includes('.') ? company : `${company}.com`,
    industry: industry,
    estimated_annual_revenue: revenue,
    organization_headcount: employees,
    organization_city: location.city,
    organization_state: location.state,
    organization_country: location.country
  };
}

function generateIndustryFromDomain(domain: string) {
  const techCompanies = ['apple', 'google', 'microsoft', 'amazon', 'meta', 'netflix', 'tesla'];
  const financeCompanies = ['goldman', 'morgan', 'jpmorgan', 'wells', 'bank', 'capital'];
  
  const lowerDomain = domain.toLowerCase();
  
  if (techCompanies.some(company => lowerDomain.includes(company))) return 'Technology';
  if (financeCompanies.some(company => lowerDomain.includes(company))) return 'Financial Services';
  
  return 'Technology';
}

function generateRevenueFromDomain(domain: string) {
  const bigCompanies = ['apple', 'google', 'microsoft', 'amazon', 'meta', 'netflix', 'tesla'];
  const lowerDomain = domain.toLowerCase();
  
  if (bigCompanies.some(company => lowerDomain.includes(company))) return '$100B+';
  return '$1B-$10B';
}

function generateEmployeeCountFromDomain(domain: string) {
  const bigCompanies = ['apple', 'google', 'microsoft', 'amazon', 'meta', 'netflix', 'tesla'];
  const lowerDomain = domain.toLowerCase();
  
  if (bigCompanies.some(company => lowerDomain.includes(company))) {
    return Math.floor(Math.random() * 50000) + 50000;
  }
  return Math.floor(Math.random() * 5000) + 1000;
}

function generateLocationFromDomain(domain: string) {
  const locations = [
    { city: 'San Francisco', state: 'CA', country: 'United States' },
    { city: 'New York', state: 'NY', country: 'United States' },
    { city: 'Seattle', state: 'WA', country: 'United States' },
    { city: 'Austin', state: 'TX', country: 'United States' }
  ];
  
  return locations[Math.floor(Math.random() * locations.length)];
}

function generateIndustryArticles(orgData: any) {
  const companyName = orgData.name || 'Company';
  
  return [
    {
      title: `${companyName} Invests in AI-Powered Marketing Automation Platform`,
      url: `https://adweek.com/marketing-technology/${companyName.toLowerCase().replace(/\s+/g, '-')}-ai-marketing-automation`,
      source: 'AdWeek',
      published_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      why_it_matters: 'Shows active investment in AI and marketing technology, indicating readiness for advanced MarTech solutions.'
    },
    {
      title: `${companyName} Expands Customer Data Platform to Drive Personalization`,
      url: `https://www.adage.com/article/marketing-technology/${companyName.toLowerCase().replace(/\s+/g, '-')}-customer-data-platform`,
      source: 'AdAge',
      published_at: new Date(Date.now() - 86400000 * 14).toISOString(),
      why_it_matters: 'Demonstrates commitment to data-driven personalization, highlighting potential data governance needs.'
    }
  ];
}

function generateTPAlignment(orgData: any) {
  const companyName = orgData.name || 'Company';
  
  return [
    {
      need: 'Data Quality & Governance',
      suggested_solution: 'Data Quality Assurance Program',
      rationale: `${companyName} likely has complex data ecosystems that require comprehensive quality monitoring and governance frameworks.`
    },
    {
      need: 'Campaign Performance Optimization',
      suggested_solution: 'Real-time Campaign Monitoring & Optimization',
      rationale: `With ${companyName}'s scale, automated campaign monitoring can significantly improve ROI and reduce manual oversight.`
    }
  ];
}

function formatCompanyOverview(orgData: any) {
  const locations = [];
  if (orgData.organization_city && orgData.organization_state) {
    locations.push(`${orgData.organization_city}, ${orgData.organization_state}`);
  }
  if (orgData.organization_country && !locations.length) {
    locations.push(orgData.organization_country);
  }
  
  return {
    name: orgData.name,
    website: orgData.website_url,
    industry: orgData.industry,
    revenue: orgData.estimated_annual_revenue,
    employees: orgData.organization_headcount,
    locations: locations,
    overview: `${orgData.name} is a ${orgData.industry?.toLowerCase() || 'technology'} company with ${orgData.organization_headcount ? `${orgData.organization_headcount.toLocaleString()} employees` : 'a significant workforce'} and estimated annual revenue of ${orgData.estimated_annual_revenue || 'substantial scale'}.`
  };
}

function detectChildBrands(orgData: any) {
  const companyName = orgData.name || '';
  
  if (companyName.toLowerCase().includes('haleon')) {
    return {
      is_portfolio_company: true,
      parent_company: 'GSK',
      child_brands: ['Sensodyne', 'Aquafresh', 'Polident', 'Advil', 'Centrum'],
      note: 'Haleon is a consumer healthcare company spun off from GSK.'
    };
  }
  
  if (companyName.toLowerCase().includes('kenvue')) {
    return {
      is_portfolio_company: true,
      parent_company: 'Johnson & Johnson',
      child_brands: ['Neutrogena', 'Aveeno', 'Listerine', 'Tylenol', 'Band-Aid'],
      note: 'Kenvue is the consumer health division spun off from Johnson & Johnson.'
    };
  }
  
  return null;
}

function analyzeTechnologyStack(orgData: any) {
  const companySize = orgData.organization_headcount || 1000;
  const isLargeCompany = companySize > 5000;
  
  const techStack = {
    email_marketing: {
      primary: isLargeCompany ? 'Salesforce Marketing Cloud' : 'Mailchimp',
      secondary: isLargeCompany ? 'HubSpot, Marketo' : 'Constant Contact, SendGrid',
      potential_issues: isLargeCompany ? ['Complex data synchronization', 'Limited cross-platform attribution'] : ['Basic segmentation', 'Limited automation']
    },
    data_management: {
      primary: isLargeCompany ? 'Snowflake, BigQuery' : 'Google Analytics, Mixpanel',
      secondary: isLargeCompany ? 'Databricks, Redshift' : 'Amplitude, Segment',
      potential_issues: isLargeCompany ? ['Data silos', 'Complex governance'] : ['Limited integration', 'Basic quality controls']
    },
    analytics: {
      primary: isLargeCompany ? 'Adobe Analytics, Google Analytics 360' : 'Google Analytics, Facebook Analytics',
      secondary: isLargeCompany ? 'Mixpanel, Amplitude' : 'Hotjar, Crazy Egg',
      potential_issues: isLargeCompany ? ['Multiple platforms', 'Inconsistent attribution'] : ['Limited capabilities', 'Basic reporting']
    },
    advertising: {
      primary: isLargeCompany ? 'Google Ads, Facebook Ads Manager' : 'Google Ads, Facebook Ads',
      secondary: isLargeCompany ? 'The Trade Desk, Adobe Advertising' : 'LinkedIn Ads, Twitter Ads',
      potential_issues: isLargeCompany ? ['Complex management', 'Inconsistent measurement'] : ['Limited programmatic', 'Manual optimization']
    },
    crm: {
      primary: isLargeCompany ? 'Salesforce, Microsoft Dynamics' : 'HubSpot, Pipedrive',
      secondary: isLargeCompany ? 'Salesforce Marketing Cloud' : 'Zoho CRM, Freshworks',
      potential_issues: isLargeCompany ? ['Complex integrations', 'Data quality issues'] : ['Limited customization', 'Basic automation']
    }
  };
  
  const potentialIssues = [
    {
      category: 'Email Marketing',
      issue: 'Data synchronization challenges between platforms',
      solution: 'Implement unified data platform and automated sync processes',
      impact: 'High'
    },
    {
      category: 'Data Management',
      issue: 'Data silos across multiple platforms',
      solution: 'Deploy comprehensive data governance framework',
      impact: 'High'
    }
  ];
  
  return {
    ...techStack,
    potential_issues: potentialIssues,
    integration_complexity: potentialIssues.length > 3 ? 'High' : 'Medium',
    recommendation: 'Implement comprehensive MarTech integration strategy with focus on data unification and cross-platform automation.'
  };
}
