const https = require('https');

async function testApolloDirect() {
  const apiKey = process.env.APOLLO_API_KEY;
  
  console.log('🔍 Testing Apollo API Directly with Enhanced Logic...\n');
  
  try {
    // Test 1: Organization enrichment
    console.log('1. Testing organization enrichment...');
    const enrichResponse = await fetch('https://api.apollo.io/api/v1/organizations/enrich?domain=southwest.com', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'accept': 'application/json'
      }
    });
    
    if (enrichResponse.ok) {
      const enrichData = await enrichResponse.json();
      console.log('✅ Enrichment successful');
      console.log('Organization name:', enrichData.organization?.name);
      console.log('Industry:', enrichData.organization?.industry);
      console.log('City:', enrichData.organization?.city);
      console.log('State:', enrichData.organization?.state);
      console.log('Revenue:', enrichData.organization?.annual_revenue);
      console.log('Employees:', enrichData.organization?.estimated_num_employees);
    } else {
      console.log('❌ Enrichment failed:', enrichResponse.status, enrichResponse.statusText);
    }
    
    console.log('\n2. Testing organization search...');
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
        per_page: 1
      })
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ Search successful');
      console.log('Found accounts:', searchData.accounts?.length || 0);
      if (searchData.accounts && searchData.accounts.length > 0) {
        const org = searchData.accounts[0];
        console.log('First result:');
        console.log('  Name:', org.name);
        console.log('  Industry:', org.industry);
        console.log('  City:', org.city);
        console.log('  State:', org.state);
        console.log('  Revenue:', org.annual_revenue);
        console.log('  Employees:', org.estimated_num_employees);
      }
    } else {
      console.log('❌ Search failed:', searchResponse.status, searchResponse.statusText);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testApolloDirect().catch(console.error);
