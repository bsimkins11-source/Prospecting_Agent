const https = require('https');

async function testApolloFixed() {
  const apiKey = process.env.APOLLO_API_KEY || 'JsEq3P_FBt32hPfxP7jpdA';
  
  const searchPayload = {
    q_organization_domains: "verizon.com",
    person_titles: ["Marketing Manager", "Brand Manager", "Growth Marketing Manager", "Campaign Manager", "Content Marketing Manager"],
    page: 1,
    per_page: 25,
    reveal_personal_emails: true,
    reveal_phone_numbers: false,
    person_locations: ['United States'],
    organization_locations: ['United States']
  };
  
  console.log('🔍 Testing Apollo People Search (fixed parameters)...');
  console.log('📋 Search Payload:', JSON.stringify(searchPayload, null, 2));
  
  const data = JSON.stringify(searchPayload);
  
  const options = {
    hostname: 'api.apollo.io',
    port: 443,
    path: '/api/v1/mixed_people/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': apiKey,
      'accept': 'application/json',
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
        console.log(`Found ${result.people?.length || 0} people`);
        
        if (result.people && result.people.length > 0) {
          console.log('\n👥 People found:');
          result.people.slice(0, 5).forEach((person, index) => {
            console.log(`${index + 1}. ${person.first_name} ${person.last_name} - ${person.title}`);
            console.log(`   Company: ${person.organization?.name || 'Unknown'}`);
            console.log(`   Domain: ${person.organization?.primary_domain || 'Unknown'}`);
            console.log(`   LinkedIn: ${person.linkedin_url || 'None'}`);
            console.log('');
          });
        } else {
          console.log('❌ No people found');
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

testApolloFixed().catch(console.error);
