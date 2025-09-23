const https = require('https');

async function testSouthwestCompanyData() {
  const apiKey = process.env.APOLLO_API_KEY;
  
  console.log('🔍 Testing Southwest Airlines company data...\n');
  
  // Test 1: Organization enrichment by domain
  console.log('1. Testing organization enrichment by domain (southwest.com)...');
  try {
    const orgResponse = await fetch(`https://api.apollo.io/api/v1/organizations/enrich?domain=southwest.com`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'accept': 'application/json'
      }
    });
    
    if (orgResponse.ok) {
      const orgData = await orgResponse.json();
      console.log('✅ Organization enrichment result:');
      console.log(JSON.stringify(orgData, null, 2));
      
      if (orgData && orgData.name) {
        console.log('\n📊 Extracted company data:');
        console.log(`Name: ${orgData.name}`);
        console.log(`Website: ${orgData.website_url || orgData.primary_domain}`);
        console.log(`Industry: ${orgData.industry}`);
        console.log(`Revenue: ${orgData.annual_revenue}`);
        console.log(`Employees: ${orgData.employee_count}`);
        console.log(`Location: ${orgData.city}, ${orgData.state}, ${orgData.country}`);
      } else {
        console.log('❌ No organization data found');
      }
    } else {
      const errorText = await orgResponse.text();
      console.log(`❌ Apollo enrichment error: ${orgResponse.status} ${orgResponse.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: Organization search as fallback
  console.log('2. Testing organization search as fallback...');
  try {
    const searchResponse = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'accept': 'application/json'
      },
      body: JSON.stringify({
        q: 'Southwest Airlines',
        page: 1,
        per_page: 5
      })
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ Organization search result:');
      console.log(`Found ${searchData.accounts?.length || 0} accounts`);
      
      if (searchData.accounts && searchData.accounts.length > 0) {
        console.log('\n📊 First few results:');
        searchData.accounts.slice(0, 3).forEach((acc, i) => {
          console.log(`${i + 1}. ${acc.name} (${acc.primary_domain})`);
          console.log(`   Industry: ${acc.industry}`);
          console.log(`   Revenue: ${acc.annual_revenue}`);
          console.log(`   Employees: ${acc.employee_count}`);
        });
      }
    } else {
      const errorText = await searchResponse.text();
      console.log(`❌ Apollo search error: ${searchResponse.status} ${searchResponse.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 3: Test the actual API endpoint
  console.log('3. Testing our API endpoint...');
  try {
    const apiResponse = await fetch('https://prospecting-agent.vercel.app/api/prospect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company: 'Southwest Airlines'
      })
    });
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API response received');
      console.log(`Company: ${apiData.company?.name}`);
      console.log(`Industry: ${apiData.company?.industry}`);
      console.log(`Revenue: ${apiData.company?.estimated_annual_revenue}`);
      console.log(`Employees: ${apiData.company?.organization_headcount}`);
      console.log(`Website: ${apiData.company?.website_url}`);
    } else {
      const errorText = await apiResponse.text();
      console.log(`❌ API error: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testSouthwestCompanyData().catch(console.error);
