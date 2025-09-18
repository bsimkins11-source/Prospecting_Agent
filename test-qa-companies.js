const https = require('https');

async function testQACompanies() {
  const companies = [
    'Southwest Airlines',
    'Microsoft', 
    'Apple',
    'Amazon',
    'Google'
  ];
  
  console.log('🔍 QA Testing Company Data Accuracy...\n');
  
  for (const company of companies) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${company}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const response = await fetch('https://prospecting-agent.vercel.app/api/prospect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company: company
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Company: ${data.company?.name || 'N/A'}`);
        console.log(`   Industry: ${data.company?.industry || 'N/A'}`);
        console.log(`   Revenue: ${data.company?.estimated_annual_revenue || 'N/A'}`);
        console.log(`   Employees: ${data.company?.organization_headcount || 'N/A'}`);
        console.log(`   Website: ${data.company?.website_url || 'N/A'}`);
        console.log(`   Location: ${data.company?.organization_city || 'N/A'}, ${data.company?.organization_state || 'N/A'}`);
        
        // Check if we're getting generic data
        if (data.company?.industry === 'Technology' && 
            data.company?.estimated_annual_revenue === '$1B-$10B' && 
            data.company?.organization_headcount === 1429) {
          console.log('❌ GENERIC DATA DETECTED - This is fallback data!');
        } else if (data.company?.industry && data.company?.industry !== 'Technology') {
          console.log('✅ Real company data - looks accurate!');
        } else {
          console.log('⚠️  Partial data - may need investigation');
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testQACompanies().catch(console.error);
