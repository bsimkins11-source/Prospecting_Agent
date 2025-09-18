const https = require('https');

async function debugProductionAPI() {
  console.log('🔍 Debugging Production API Data Extraction...\n');
  
  try {
    const response = await fetch('https://prospecting-agent.vercel.app/api/prospect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company: 'Southwest Airlines'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Full API Response:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\n📊 Company Data Analysis:');
      console.log(`Name: ${data.company?.name}`);
      console.log(`Industry: ${data.company?.industry}`);
      console.log(`Revenue: ${data.company?.estimated_annual_revenue}`);
      console.log(`Employees: ${data.company?.organization_headcount}`);
      console.log(`Website: ${data.company?.website_url}`);
      console.log(`City: ${data.company?.organization_city}`);
      console.log(`State: ${data.company?.organization_state}`);
      console.log(`Country: ${data.company?.organization_country}`);
      
      // Check if we have any data quality info
      if (data.data_quality) {
        console.log('\n🔍 Data Quality Info:');
        console.log(JSON.stringify(data.data_quality, null, 2));
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

debugProductionAPI().catch(console.error);
