const https = require('https');

async function testVerizonSpecificSearch() {
  const apiKey = process.env.APOLLO_API_KEY;
  
  // Try different search approaches for Verizon
  const searchApproaches = [
    {
      name: "Organization Domain Search",
      payload: {
        q_organization_domains: "verizon.com",
        person_titles: ["Marketing Manager", "Brand Manager", "Growth Marketing Manager"],
        page: 1,
        per_page: 25,
        reveal_personal_emails: true,
        person_locations: ["United States"],
        organization_locations: ["United States"]
      }
    },
    {
      name: "Organization Name Search", 
      payload: {
        q_organization_names: "Verizon Communications",
        person_titles: ["Marketing Manager", "Brand Manager", "Growth Marketing Manager"],
        page: 1,
        per_page: 25,
        reveal_personal_emails: true,
        person_locations: ["United States"],
        organization_locations: ["United States"]
      }
    },
    {
      name: "Combined Search",
      payload: {
        q: "Verizon Communications",
        q_organization_domains: "verizon.com",
        person_titles: ["Marketing Manager", "Brand Manager", "Growth Marketing Manager"],
        page: 1,
        per_page: 25,
        reveal_personal_emails: true,
        person_locations: ["United States"],
        organization_locations: ["United States"]
      }
    }
  ];
  
  for (const approach of searchApproaches) {
    console.log(`\n🔍 Testing: ${approach.name}`);
    console.log('📋 Search Payload:', JSON.stringify(approach.payload, null, 2));
    
    const data = JSON.stringify(approach.payload);
    
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

    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
    
    if (result.people && result.people.length > 0) {
      console.log(`✅ Found ${result.people.length} people:`);
      
      // Check how many are actually from Verizon
      const verizonPeople = result.people.filter(person => {
        const orgName = person.organization?.name?.toLowerCase() || '';
        const orgDomain = person.organization?.primary_domain?.toLowerCase() || '';
        return orgName.includes('verizon') || orgDomain.includes('verizon');
      });
      
      console.log(`📊 Verizon-specific people: ${verizonPeople.length}/${result.people.length}`);
      
      if (verizonPeople.length > 0) {
        console.log('👥 Verizon employees found:');
        verizonPeople.forEach((person, index) => {
          console.log(`${index + 1}. ${person.first_name} ${person.last_name} - ${person.title}`);
          console.log(`   Company: ${person.organization?.name || 'Unknown'}`);
          console.log(`   Domain: ${person.organization?.primary_domain || 'Unknown'}`);
          console.log(`   Email: ${person.email || 'None'}`);
          console.log(`   LinkedIn: ${person.linkedin_url || 'None'}`);
          console.log('');
        });
      } else {
        console.log('❌ No Verizon employees found in this search');
        console.log('Sample companies found:');
        result.people.slice(0, 5).forEach((person, index) => {
          console.log(`${index + 1}. ${person.organization?.name || 'Unknown'}`);
        });
      }
    } else {
      console.log('❌ No people found in this search');
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testVerizonSpecificSearch().catch(console.error);
