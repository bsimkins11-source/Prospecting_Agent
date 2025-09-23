const https = require('https');

async function testApolloOrgVariations() {
  const apiKey = process.env.APOLLO_API_KEY;
  
  const searchVariations = [
    {
      name: "Basic search",
      payload: { q: "verizon" }
    },
    {
      name: "With locations",
      payload: { 
        q: "verizon",
        organization_locations: ['United States'],
        person_locations: ['United States']
      }
    },
    {
      name: "With page limit",
      payload: { 
        q: "verizon",
        page: 1,
        per_page: 25,
        organization_locations: ['United States']
      }
    },
    {
      name: "Exact name search",
      payload: { 
        q: "Verizon Communications",
        organization_locations: ['United States']
      }
    },
    {
      name: "Domain search",
      payload: { 
        q: "verizon.com",
        organization_locations: ['United States']
      }
    }
  ];
  
  for (const variation of searchVariations) {
    console.log(`\n🔍 Testing: ${variation.name}`);
    console.log('📋 Search Payload:', JSON.stringify(variation.payload, null, 2));
    
    const data = JSON.stringify(variation.payload);
    
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
    
    if (result.organizations && result.organizations.length > 0) {
      console.log(`✅ Found ${result.organizations.length} organizations:`);
      result.organizations.slice(0, 3).forEach((org, index) => {
        console.log(`  ${index + 1}. ${org.name} (${org.website_url || org.primary_domain})`);
      });
      
      // Check if any contain "verizon"
      const verizonOrgs = result.organizations.filter(org => 
        org.name.toLowerCase().includes('verizon')
      );
      if (verizonOrgs.length > 0) {
        console.log(`🎯 Found ${verizonOrgs.length} Verizon organizations!`);
      }
    } else {
      console.log(`❌ No organizations found`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testApolloOrgVariations().catch(console.error);
