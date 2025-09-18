const https = require('https');

// Test companies that should have specific, accurate data
const testCompanies = [
  'southwest.com',
  'verizon.com', 
  'microsoft.com',
  'apple.com',
  'amazon.com',
  'google.com',
  'mcdonalds.com',
  'walmart.com',
  'coca-cola.com',
  'pepsi.com'
];

async function testCompany(company) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ company });
    
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
            company,
            success: res.statusCode === 200,
            statusCode: res.statusCode,
            data: result
          });
        } catch (error) {
          resolve({
            company,
            success: false,
            statusCode: res.statusCode,
            error: 'Failed to parse JSON',
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        company,
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

async function runQA() {
  console.log('🧪 QA Testing Production App - Simplified 3-Step Process');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const company of testCompanies) {
    console.log(`\n🔍 Testing: ${company}`);
    const result = await testCompany(company);
    results.push(result);
    
    if (result.success) {
      const companyData = result.data.company;
      const totalPeople = Object.values(result.data.accountMap || {}).flat().length;
      
      console.log(`✅ SUCCESS`);
      console.log(`   Company: ${companyData?.name || 'N/A'}`);
      console.log(`   Industry: ${companyData?.industry || 'N/A'}`);
      console.log(`   Website: ${companyData?.website || 'N/A'}`);
      console.log(`   Employees: ${companyData?.employees || 'N/A'}`);
      console.log(`   Revenue: ${companyData?.revenue || 'N/A'}`);
      console.log(`   Total People Found: ${totalPeople}`);
      
      // Check for generic data (red flags)
      const isGeneric = companyData?.industry === 'Technology' && 
                       companyData?.revenue === '$1B-$10B' && 
                       companyData?.employees === 1429;
      
      if (isGeneric) {
        console.log(`❌ GENERIC DATA DETECTED - Still using fallback!`);
      } else {
        console.log(`✅ REAL DATA - Apollo enrichment working!`);
      }
      
      // Show department breakdown
      Object.entries(result.data.accountMap || {}).forEach(([dept, people]) => {
        console.log(`   ${dept}: ${people.length} people`);
      });
      
    } else {
      console.log(`❌ FAILED: ${result.error || result.statusCode}`);
      if (result.rawData) {
        console.log(`   Raw response: ${result.rawData.substring(0, 200)}...`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 QA SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const withGenericData = successful.filter(r => {
    const companyData = r.data?.company;
    return companyData?.industry === 'Technology' && 
           companyData?.revenue === '$1B-$10B' && 
           companyData?.employees === 1429;
  });
  
  console.log(`✅ Successful requests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed requests: ${failed.length}/${results.length}`);
  console.log(`⚠️  Generic data detected: ${withGenericData.length}/${successful.length}`);
  
  if (withGenericData.length > 0) {
    console.log('\n❌ COMPANIES WITH GENERIC DATA:');
    withGenericData.forEach(r => {
      console.log(`   - ${r.company}`);
    });
  }
  
  if (successful.length > 0) {
    console.log('\n✅ COMPANIES WITH REAL DATA:');
    successful.filter(r => {
      const companyData = r.data?.company;
      return !(companyData?.industry === 'Technology' && 
               companyData?.revenue === '$1B-$10B' && 
               companyData?.employees === 1429);
    }).forEach(r => {
      console.log(`   - ${r.company}: ${r.data?.company?.industry || 'N/A'}`);
    });
  }
  
  const avgPeople = successful.length > 0 ? 
    Math.round(successful.reduce((sum, r) => sum + Object.values(r.data?.accountMap || {}).flat().length, 0) / successful.length) : 0;
  
  console.log(`\n📈 Average people found per company: ${avgPeople}`);
  
  if (withGenericData.length === 0 && successful.length > 0) {
    console.log('\n🎉 SUCCESS! Apollo enrichment is working correctly!');
  } else if (withGenericData.length > 0) {
    console.log('\n⚠️  ISSUE: Still getting generic data - Apollo enrichment may not be working');
  }
}

runQA().catch(console.error);
