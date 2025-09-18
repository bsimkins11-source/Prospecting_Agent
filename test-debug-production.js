const https = require('https');

async function testDebugProduction() {
  console.log('🔍 Testing Production API with Enhanced Debugging...\n');
  
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
      console.log('✅ Production API Response:');
      console.log('Company data:', JSON.stringify(data.company, null, 2));
      
      // Check if we're getting generic data
      if (data.company?.industry === 'Technology' && 
          data.company?.revenue === '$1B-$10B' && 
          data.company?.employees < 10000) {
        console.log('\n❌ GENERIC FALLBACK DATA DETECTED!');
        console.log('This suggests the enhanced debugging is not being used in production.');
        console.log('Possible causes:');
        console.log('1. Deployment didn\'t complete properly');
        console.log('2. There\'s a different code path being used');
        console.log('3. There\'s a fallback mechanism we haven\'t identified');
        console.log('4. The Apollo enrichment is failing and falling back to old code');
      } else if (data.company?.industry === 'airlines/aviation') {
        console.log('\n✅ REAL APOLLO DATA - SUCCESS!');
        console.log('The enhanced debugging is working correctly.');
      } else {
        console.log('\n⚠️  UNKNOWN DATA SOURCE');
        console.log('Industry:', data.company?.industry);
        console.log('Revenue:', data.company?.revenue);
        console.log('Employees:', data.company?.employees);
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testDebugProduction().catch(console.error);
