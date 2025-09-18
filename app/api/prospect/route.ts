import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json();
    const apiKey = process.env.APOLLO_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });
    }

    console.log(`🔍 SIMPLE: Getting data for ${company}`);

    // STEP 1: Get company information from Apollo
    const domain = company.toLowerCase().replace(/[^a-z0-9.-]/g, '').replace(/^www\./, '');
    const searchDomain = domain.includes('.') ? domain : `${domain}.com`;
    
    console.log(`🔍 SIMPLE: Searching domain: ${searchDomain}`);

    // Try organization enrichment first
    const orgResponse = await fetch(`https://api.apollo.io/api/v1/organizations/enrich?domain=${searchDomain}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'accept': 'application/json'
      }
    });

    let companyData = null;
    if (orgResponse.ok) {
      const orgData = await orgResponse.json();
      console.log(`🔍 SIMPLE: Apollo enrichment result:`, orgData.organization?.name, orgData.organization?.industry);
      
      if (orgData.organization) {
        companyData = {
          name: orgData.organization.name,
          industry: orgData.organization.industry,
          website: orgData.organization.website_url || orgData.organization.primary_domain,
          revenue: orgData.organization.annual_revenue_printed || `$${Math.floor(orgData.organization.annual_revenue / 1000000000)}B`,
          employees: orgData.organization.estimated_num_employees,
          location: orgData.organization.city && orgData.organization.state 
            ? `${orgData.organization.city}, ${orgData.organization.state}`
            : orgData.organization.country
        };
      }
    }

    // If enrichment failed, try search
    if (!companyData) {
      console.log(`🔍 SIMPLE: Enrichment failed, trying search...`);
      const searchResponse = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'accept': 'application/json'
        },
        body: JSON.stringify({
          q: company,
          page: 1,
          per_page: 1
        })
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.accounts && searchData.accounts.length > 0) {
          const org = searchData.accounts[0];
          companyData = {
            name: org.name,
            industry: org.industry,
            website: org.website_url || org.primary_domain,
            revenue: org.annual_revenue_printed || `$${Math.floor(org.annual_revenue / 1000000000)}B`,
            employees: org.estimated_num_employees,
            location: org.city && org.state ? `${org.city}, ${org.state}` : org.country
          };
        }
      }
    }

    if (!companyData) {
      return NextResponse.json({ error: `No company data found for ${company}` }, { status: 404 });
    }

    console.log(`✅ SIMPLE: Company data:`, companyData);

    // STEP 2: Get employee information by department
    const departments = ['Marketing', 'Sales', 'Engineering', 'Operations'];
    const accountMap = {};

    for (const dept of departments) {
      console.log(`🔍 SIMPLE: Getting ${dept} employees...`);
      
      const peopleResponse = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'accept': 'application/json'
        },
        body: JSON.stringify({
          q_organization_domains_list: [searchDomain],
          person_titles: getDepartmentTitles(dept),
          person_seniorities: ['manager', 'director', 'vp', 'cxo'],
          contact_email_status: ['verified'],
          page: 1,
          per_page: 10
        })
      });

      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json();
        accountMap[dept] = (peopleData.people || []).map(person => ({
          name: person.name,
          title: person.title,
          seniority: person.seniority,
          email: person.email,
          linkedin_url: person.linkedin_url,
          company: person.organization?.name
        }));
        console.log(`✅ SIMPLE: Found ${accountMap[dept].length} ${dept} employees`);
      } else {
        accountMap[dept] = [];
        console.log(`❌ SIMPLE: No ${dept} employees found`);
      }
    }

    // STEP 3: Return everything
    const result = {
      company: companyData,
      accountMap: accountMap,
      generated_at: new Date().toISOString()
    };

    console.log(`✅ SIMPLE: Success! Returning data for ${companyData.name}`);
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('❌ SIMPLE: Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getDepartmentTitles(dept: string) {
  const titles = {
    'Marketing': ['Marketing Manager', 'Marketing Director', 'CMO', 'Brand Manager'],
    'Sales': ['Sales Manager', 'Sales Director', 'VP Sales', 'Account Manager'],
    'Engineering': ['Engineering Manager', 'CTO', 'VP Engineering', 'Software Engineer'],
    'Operations': ['Operations Manager', 'COO', 'VP Operations', 'Operations Director']
  };
  return titles[dept] || ['Manager'];
}
