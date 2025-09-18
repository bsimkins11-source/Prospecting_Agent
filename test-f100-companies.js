const https = require('https');

// 25 Fortune 100 companies for testing
const companies = [
  'Walmart', 'Amazon', 'Apple', 'CVS Health', 'UnitedHealth Group',
  'Berkshire Hathaway', 'McKesson', 'AmerisourceBergen', 'Alphabet', 'Ford Motor',
  'General Motors', 'Costco', 'Cigna', 'AT&T', 'Microsoft',
  'Cardinal Health', 'Chevron', 'Home Depot', 'Walgreens Boots Alliance', 'JPMorgan Chase',
  'Verizon', 'Kroger', 'General Electric', 'Fannie Mae', 'Comcast'
];

async function testCompany(company) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ company });
    
    const options = {
      hostname: 'prospecting-agent.vercel.app',
      port: 443,
      path: '/api/prospect',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({
            company,
            success: true,
            data: result
          });
        } catch (error) {
          resolve({
            company,
            success: false,
            error: error.message
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

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing 25 Fortune 100 Companies...\n');
  
  const results = [];
  let successCount = 0;
  let accurateDataCount = 0;
  let genericDataCount = 0;
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(`Testing ${i + 1}/25: ${company}...`);
    
    const result = await testCompany(company);
    results.push(result);
    
    if (result.success) {
      successCount++;
      
      // Check if it's using accurate data or generic fallback
      const companyData = result.data.company;
      const isGeneric = companyData.industry === 'Technology' && 
                       companyData.revenue === '$1B-$10B' && 
                       companyData.employees < 10000;
      
      if (isGeneric) {
        genericDataCount++;
        console.log(`  ❌ Generic data: ${companyData.industry}, ${companyData.employees} employees`);
      } else {
        accurateDataCount++;
        console.log(`  ✅ Accurate data: ${companyData.industry}, ${companyData.employees} employees`);
      }
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log(`Total Companies: ${companies.length}`);
  console.log(`Successful Requests: ${successCount}`);
  console.log(`Accurate Data: ${accurateDataCount}`);
  console.log(`Generic Data: ${genericDataCount}`);
  console.log(`Failed Requests: ${companies.length - successCount}`);
  console.log(`Accuracy Rate: ${((accurateDataCount / successCount) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.forEach((result, index) => {
    if (result.success) {
      const companyData = result.data.company;
      const isGeneric = companyData.industry === 'Technology' && 
                       companyData.revenue === '$1B-$10B' && 
                       companyData.employees < 10000;
      const status = isGeneric ? '❌ Generic' : '✅ Accurate';
      console.log(`${index + 1}. ${result.company}: ${status} - ${companyData.industry}, ${companyData.employees} employees`);
    } else {
      console.log(`${index + 1}. ${result.company}: ❌ Failed - ${result.error}`);
    }
  });
  
  // Save detailed results to file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `f100-test-results-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalCompanies: companies.length,
      successfulRequests: successCount,
      accurateData: accurateDataCount,
      genericData: genericDataCount,
      failedRequests: companies.length - successCount,
      accuracyRate: ((accurateDataCount / successCount) * 100).toFixed(1) + '%'
    },
    results: results
  }, null, 2));
  
  console.log(`\n💾 Detailed results saved to: ${filename}`);
}

runTests().catch(console.error);
