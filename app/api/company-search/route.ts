import { NextRequest, NextResponse } from 'next/server';

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
