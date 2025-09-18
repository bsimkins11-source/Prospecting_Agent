const https = require('https');

async function testSimpleOpenAI() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ 
      company: 'microsoft.com',
      test_ai: true 
    });
    
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
  console.log('🤖 Testing Simple OpenAI Integration...');
  console.log('=' .repeat(50));
  
  const result = await testSimpleOpenAI();
  
  if (result.success) {
    console.log('✅ API Response Success');
    console.log('AI Modules Status:');
    console.log(`   MarTech Analysis: ${result.data.martech_analysis ? 'WORKING' : 'NULL'}`);
    console.log(`   Challenges: ${result.data.challenges ? 'WORKING' : 'NULL'}`);
    console.log(`   Tech Stack: ${result.data.tech_stack ? 'WORKING' : 'NULL'}`);
    console.log(`   TP Alignment: ${result.data.tp_alignment ? 'WORKING' : 'NULL'}`);
    
    if (result.data.martech_analysis) {
      console.log('\n📊 MarTech Analysis Sample:');
      console.log(JSON.stringify(result.data.martech_analysis, null, 2).substring(0, 500) + '...');
    }
    
  } else {
    console.log('❌ API Error:', result.error || result.statusCode);
    if (result.rawData) {
      console.log('Raw response:', result.rawData.substring(0, 500));
    }
  }
}

runTest().catch(console.error);
