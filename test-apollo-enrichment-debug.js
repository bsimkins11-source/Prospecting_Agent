const https = require('https');

async function testApolloEnrichmentDebug() {
  const apiKey = process.env.APOLLO_API_KEY;
  
  console.log('🔍 Debugging Apollo Enrichment Response Structure...\n');
  
  try {
    const response = await fetch(`https://api.apollo.io/api/v1/organizations/enrich?domain=southwest.com`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Apollo Enrichment Response Structure:');
      console.log('Root keys:', Object.keys(data));
      
      if (data.organization) {
        console.log('\n📊 Organization object keys:', Object.keys(data.organization));
        console.log('\n🎯 Key fields:');
        console.log(`  name: "${data.organization.name}"`);
        console.log(`  industry: "${data.organization.industry}"`);
        console.log(`  city: "${data.organization.city}"`);
        console.log(`  state: "${data.organization.state}"`);
        console.log(`  country: "${data.organization.country}"`);
        console.log(`  primary_domain: "${data.organization.primary_domain}"`);
        console.log(`  website_url: "${data.organization.website_url}"`);
        console.log(`  annual_revenue: ${data.organization.annual_revenue}`);
        console.log(`  estimated_num_employees: ${data.organization.estimated_num_employees}`);
      } else {
        console.log('❌ No organization object found in response');
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Apollo API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testApolloEnrichmentDebug().catch(console.error);
