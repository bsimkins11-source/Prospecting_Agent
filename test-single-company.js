const https = require('https');

async function testSingleCompany() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ company: 'tesla.com' });
    
    const options = {
      hostname: 'prospecting-agent.vercel.app',
      port: 443,
      path: '/api/prospect',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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

    req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('🔍 Testing single company with enhanced fields...');
  
  const result = await testSingleCompany();
  
  if (result.success) {
    console.log('✅ SUCCESS');
    console.log('Company data:');
    console.log(JSON.stringify(result.data.company, null, 2));
    
    // Check for new fields
    const company = result.data.company;
    console.log('\n🔍 Field Analysis:');
    console.log(`   • founded_year: ${company.founded_year || 'MISSING'}`);
    console.log(`   • linkedin_url: ${company.linkedin_url || 'MISSING'}`);
    console.log(`   • logo_url: ${company.logo_url || 'MISSING'}`);
    console.log(`   • keywords: ${company.keywords ? 'PRESENT' : 'MISSING'}`);
    console.log(`   • raw_address: ${company.raw_address || 'MISSING'}`);
    console.log(`   • locations: ${company.locations ? JSON.stringify(company.locations) : 'MISSING'}`);
    console.log(`   • overview: ${company.overview ? 'PRESENT (' + company.overview.length + ' chars)' : 'MISSING'}`);
    
  } else {
    console.log('❌ FAILED:', result.error || result.statusCode);
    if (result.rawData) {
      console.log('Raw response:', result.rawData);
    }
  }
}

runTest().catch(console.error);
