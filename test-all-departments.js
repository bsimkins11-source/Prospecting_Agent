const https = require('https');

async function testAllDepartments() {
  const apiKey = process.env.APOLLO_API_KEY || 'JsEq3P_FBt32hPfxP7jpdA';
  
  const departments = [
    'Marketing',
    'Media', 
    'Customer Data Strategy',
    'Analytics & Insights',
    'Marketing Technology',
    'Digital Transformation',
    'Marketing Operations'
  ];
  
  const departmentTitles = {
    'Marketing': ['Marketing Manager', 'Brand Manager', 'Growth Marketing Manager', 'Campaign Manager', 'Content Marketing Manager'],
    'Media': ['Media Manager', 'Paid Media Manager', 'Programmatic Manager', 'Digital Media Manager', 'Media Planning Manager'],
    'Customer Data Strategy': ['Data Manager', 'CRM Manager', 'CDP Manager', 'Customer Data Manager', 'Data Strategy Manager'],
    'Analytics & Insights': ['Analytics Manager', 'Business Intelligence Manager', 'Data Analyst Manager', 'Insights Manager', 'Reporting Manager'],
    'Marketing Technology': ['Marketing Technology Manager', 'MarTech Manager', 'Marketing Automation Manager', 'Marketing Systems Manager', 'Marketing Operations Manager'],
    'Digital Transformation': ['Digital Transformation Manager', 'Innovation Manager', 'Digital Manager', 'Transformation Manager', 'Digital Strategy Manager'],
    'Marketing Operations': ['Marketing Operations Manager', 'Campaign Operations Manager', 'Marketing Process Manager', 'Marketing Workflow Manager', 'Marketing Systems Manager']
  };
  
  for (const dept of departments) {
    console.log(`\n🔍 Testing ${dept} department...`);
    
    const searchPayload = {
      q_organization_domains: "verizon.com",
      person_titles: departmentTitles[dept],
      page: 1,
      per_page: 5,
      reveal_personal_emails: true,
      person_locations: ["United States"],
      organization_locations: ["United States"]
    };
    
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
      console.log(`✅ Found ${result.people.length} people for ${dept}:`);
      result.people.forEach((person, index) => {
        console.log(`  ${index + 1}. ${person.first_name} ${person.last_name} - ${person.title}`);
      });
    } else {
      console.log(`❌ No people found for ${dept}`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

testAllDepartments().catch(console.error);
