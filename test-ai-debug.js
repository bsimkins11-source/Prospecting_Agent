// Test AI Analysis Debug
const fetch = require('node-fetch');

async function testAIAnalysis() {
  console.log('🔍 Testing AI Analysis Debug...');
  
  try {
    const response = await fetch('https://prospecting-agent.vercel.app/api/prospect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ company: 'microsoft.com' })
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('🏢 Company:', data.company?.name);
    console.log('🤖 AI Modules Status:');
    console.log('  - MarTech Analysis:', data.martech_analysis ? 'SUCCESS' : 'NULL');
    console.log('  - Challenges:', data.challenges ? 'SUCCESS' : 'NULL');
    console.log('  - Tech Stack:', data.tech_stack ? 'SUCCESS' : 'NULL');
    console.log('  - TP Alignment:', data.tp_alignment ? 'SUCCESS' : 'NULL');
    
    // Check if there are any error logs in the response
    if (data.error) {
      console.log('❌ Error:', data.error);
    }
    
    // Check account map for people data
    console.log('👥 Account Map Categories:', Object.keys(data.accountMap || {}));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAIAnalysis();
