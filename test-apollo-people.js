const https = require('https');

async function testApolloPeopleSearch() {
  const apiKey = process.env.APOLLO_API_KEY;
  
  const searchPayload = {
    q: "Verizon Communications Marketing Manager",
    page: 1,
    per_page: 25,
    reveal_personal_emails: true,
    reveal_phone_numbers: false,
    person_titles: ["Marketing Manager", "Brand Manager", "Growth Marketing Manager"],
    person_locations: ["United States"],
    organization_locations: ["United States"]
  };
  
  console.log('🔍 Testing Apollo People Search API directly...');
  console.log('📋 Search Payload:', JSON.stringify(searchPayload, null, 2));
  
  const data = JSON.stringify(searchPayload);
  
  const options = {
    hostname: 'api.apollo.io',
    port: 443,
    path: '/api/v1/people/search',
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
    console.log(`📡 Response Headers:`, res.headers);
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(responseData);
        console.log('\n📊 Apollo API Response:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.people && result.people.length > 0) {
          console.log(`\n👥 Found ${result.people.length} people:`);
          result.people.forEach((person, index) => {
            console.log(`${index + 1}. ${person.first_name} ${person.last_name} - ${person.title}`);
            console.log(`   Company: ${person.organization?.name || 'Unknown'}`);
            console.log(`   Email: ${person.email || 'None'}`);
            console.log(`   LinkedIn: ${person.linkedin_url || 'None'}`);
            console.log('');
          });
        } else {
          console.log('\n❌ No people found in response');
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

testApolloPeopleSearch().catch(console.error);
