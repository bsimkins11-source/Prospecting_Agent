const https = require('https');

async function testApolloEnrichmentFields(domain) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.apollo.io',
      port: 443,
      path: `/api/v1/organizations/enrich?domain=${domain}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.APOLLO_API_KEY,
        'accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            statusCode: res.statusCode,
            data: result
          });
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to parse JSON',
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.end();
  });
}

async function analyzeApolloFields() {
  console.log('🔍 APOLLO ENRICHMENT FIELDS ANALYSIS');
  console.log('=' .repeat(60));
  
  const testDomains = ['southwest.com', 'microsoft.com', 'tesla.com'];
  
  for (const domain of testDomains) {
    console.log(`\n🏢 Testing: ${domain}`);
    
    const result = await testApolloEnrichmentFields(domain);
    
    if (result.success && result.data.organization) {
      const org = result.data.organization;
      
      console.log('✅ Available Apollo fields:');
      console.log(`   📊 Basic Info:`);
      console.log(`      • name: ${org.name || 'N/A'}`);
      console.log(`      • primary_domain: ${org.primary_domain || 'N/A'}`);
      console.log(`      • website_url: ${org.website_url || 'N/A'}`);
      console.log(`      • industry: ${org.industry || 'N/A'}`);
      
      console.log(`   💰 Financial:`);
      console.log(`      • annual_revenue: ${org.annual_revenue || 'N/A'}`);
      console.log(`      • annual_revenue_printed: ${org.annual_revenue_printed || 'N/A'}`);
      console.log(`      • estimated_num_employees: ${org.estimated_num_employees || 'N/A'}`);
      
      console.log(`   🌍 Location:`);
      console.log(`      • city: ${org.city || 'N/A'}`);
      console.log(`      • state: ${org.state || 'N/A'}`);
      console.log(`      • country: ${org.country || 'N/A'}`);
      console.log(`      • raw_address: ${org.raw_address || 'N/A'}`);
      
      console.log(`   📝 Description:`);
      console.log(`      • short_description: ${org.short_description || 'N/A'}`);
      console.log(`      • long_description: ${org.long_description || 'N/A'}`);
      
      console.log(`   🔗 Links:`);
      console.log(`      • linkedin_url: ${org.linkedin_url || 'N/A'}`);
      console.log(`      • logo_url: ${org.logo_url || 'N/A'}`);
      
      console.log(`   📈 Additional:`);
      console.log(`      • founded_year: ${org.founded_year || 'N/A'}`);
      console.log(`      • keywords: ${org.keywords || 'N/A'}`);
      console.log(`      • technologies: ${org.technologies || 'N/A'}`);
      
    } else {
      console.log(`❌ Failed: ${result.error || result.statusCode}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

analyzeApolloFields().catch(console.error);
