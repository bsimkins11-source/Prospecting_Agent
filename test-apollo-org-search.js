const https = require('https');

async function testApolloOrgSearch() {
  const apiKey = process.env.APOLLO_API_KEY || 'JsEq3P_FBt32hPfxP7jpdA';
  
  const searchPayload = {
    q: "verizon communications",
    page: 1,
    per_page: 10,
    organization_locations: ['United States'],
    person_locations: ['United States']
  };
  
  console.log('🔍 Testing Apollo Organization Search...');
  console.log('📋 Search Payload:', JSON.stringify(searchPayload, null, 2));
  
  const data = JSON.stringify(searchPayload);
  
  const options = {
    hostname: 'api.apollo.io',
    port: 443,
    path: '/api/v1/mixed_companies/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';
    
    console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(responseData);
        console.log('\n📊 Apollo API Response:');
        console.log(`Found ${result.organizations?.length || 0} organizations`);
        
        if (result.organizations && result.organizations.length > 0) {
          console.log('\n🏢 Organizations found:');
          result.organizations.forEach((org, index) => {
            console.log(`${index + 1}. ${org.name}`);
            console.log(`   Website: ${org.website_url || org.primary_domain}`);
            console.log(`   Industry: ${org.industry || 'Unknown'}`);
            console.log(`   Employees: ${org.estimated_num_employees || 0}`);
            console.log('');
          });
        } else {
          console.log('❌ No organizations found');
          console.log('Full response:', JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.log('Raw response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.write(data);
  req.end();
}

testApolloOrgSearch().catch(console.error);
