import { NextRequest, NextResponse } from 'next/server';

function getKnownCompaniesFallback(query: string) {
  const knownCompanies = [
    {
      id: 'verizon-1',
      name: 'Verizon Communications Inc.',
      website: 'verizon.com',
      industry: 'Telecommunications',
      employees: 130000,
      revenue: '$130B+',
      location: 'New York, NY',
      description: 'Leading telecommunications company providing wireless and wireline services'
    },
    {
      id: 'verizon-2', 
      name: 'Verizon Wireless',
      website: 'verizon.com',
      industry: 'Telecommunications',
      employees: 130000,
      revenue: '$130B+',
      location: 'New York, NY',
      description: 'Wireless telecommunications division of Verizon Communications'
    },
    {
      id: 'microsoft-1',
      name: 'Microsoft Corporation',
      website: 'microsoft.com',
      industry: 'Technology',
      employees: 220000,
      revenue: '$200B+',
      location: 'Redmond, WA',
      description: 'Leading technology company specializing in software, cloud services, and hardware'
    },
    {
      id: 'apple-1',
      name: 'Apple Inc.',
      website: 'apple.com',
      industry: 'Technology',
      employees: 160000,
      revenue: '$400B+',
      location: 'Cupertino, CA',
      description: 'Technology company known for iPhone, Mac, iPad, and other consumer electronics'
    },
    {
      id: 'amazon-1',
      name: 'Amazon.com Inc.',
      website: 'amazon.com',
      industry: 'E-commerce & Cloud Computing',
      employees: 1500000,
      revenue: '$500B+',
      location: 'Seattle, WA',
      description: 'Global e-commerce and cloud computing giant'
    },
    {
      id: 'walmart-1',
      name: 'Walmart Inc.',
      website: 'walmart.com',
      industry: 'Retail',
      employees: 2300000,
      revenue: '$600B+',
      location: 'Bentonville, AR',
      description: 'World\'s largest retailer with stores and e-commerce operations'
    }
  ];

  const queryLower = query.toLowerCase();
  return knownCompanies.filter(company => 
    company.name.toLowerCase().includes(queryLower) ||
    company.website.toLowerCase().includes(queryLower) ||
    company.industry.toLowerCase().includes(queryLower)
  );
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Query must be at least 2 characters long' 
      }, { status: 400 });
    }

    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Apollo API key not configured' 
      }, { status: 500 });
    }

    console.log(`🔍 Searching for companies matching: "${query}"`);

    // Search Apollo's organization database
    const searchResponse = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        q: query,
        page: 1,
        per_page: 10,
        organization_locations: ['United States'],
        person_locations: ['United States']
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`Apollo organization search failed: ${searchResponse.status} - ${errorText}`);
      return NextResponse.json({ 
        error: 'Failed to search organizations' 
      }, { status: 500 });
    }

    const searchData = await searchResponse.json();
    const organizations = searchData.organizations || [];

    console.log(`Found ${organizations.length} organizations matching "${query}"`);

    // Format the results for display
    let companies = organizations.map((org: any) => ({
      id: org.id,
      name: org.name,
      website: org.website_url || org.primary_domain,
      industry: org.industry || 'Unknown',
      employees: org.estimated_num_employees || 0,
      revenue: org.organization_revenue_printed || 'Unknown',
      location: org.organization_city && org.organization_state 
        ? `${org.organization_city}, ${org.organization_state}`
        : org.organization_city || 'Unknown',
      description: org.short_description || org.description || 'No description available'
    }));

    // If Apollo search doesn't return good results, add known companies as fallbacks
    if (companies.length === 0 || !companies.some(c => c.name.toLowerCase().includes(query.toLowerCase()))) {
      const knownCompanies = getKnownCompaniesFallback(query);
      companies = [...knownCompanies, ...companies].slice(0, 10); // Limit to 10 results
    }

    return NextResponse.json({
      query,
      total_found: organizations.length,
      companies
    });

  } catch (error: any) {
    console.error('Company search error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
