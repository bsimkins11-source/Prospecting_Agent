const https = require('https');

async function testProductionDebug() {
  console.log('🔍 Debugging Production API Response...\n');
  
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
      console.log('✅ Full Production API Response:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\n📊 Company Data Analysis:');
      console.log(`Name: ${data.company?.name}`);
      console.log(`Industry: ${data.company?.industry}`);
      console.log(`Revenue: ${data.company?.revenue}`);
      console.log(`Employees: ${data.company?.employees}`);
      console.log(`Website: ${data.company?.website}`);
      console.log(`Locations: ${JSON.stringify(data.company?.locations)}`);
      
      // Check if this looks like fallback data
      if (data.company?.industry === 'Technology' && 
          data.company?.revenue === '$1B-$10B' && 
          data.company?.employees < 5000) {
        console.log('\n❌ GENERIC FALLBACK DATA DETECTED!');
        console.log('This suggests Apollo enrichment is failing and falling back to generic data.');
      } else if (data.company?.industry === 'airlines/aviation') {
        console.log('\n✅ REAL APOLLO DATA - SUCCESS!');
      } else {
        console.log('\n⚠️  UNKNOWN DATA SOURCE');
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testProductionDebug().catch(console.error);
