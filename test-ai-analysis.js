const https = require('https');

async function testAIAnalysis() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ company: 'microsoft.com' });
    
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
  console.log('🤖 Testing AI Analysis Modules...');
  console.log('=' .repeat(50));
  
  const result = await testAIAnalysis();
  
  if (result.success) {
    console.log('✅ API Response Success');
    
    // Check AI modules
    const aiModules = {
      'MarTech Analysis': result.data.martech_analysis,
      'Challenges': result.data.challenges,
      'Tech Stack': result.data.tech_stack,
      'TP Alignment': result.data.tp_alignment
    };
    
    console.log('\n🤖 AI Analysis Modules Status:');
    Object.entries(aiModules).forEach(([name, data]) => {
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        console.log(`   ✅ ${name}: Working (${Object.keys(data).length} sections)`);
        // Show sample content
        const firstKey = Object.keys(data)[0];
        const sample = typeof data[firstKey] === 'string' ? 
          data[firstKey].substring(0, 100) + '...' : 
          JSON.stringify(data[firstKey]).substring(0, 100) + '...';
        console.log(`      Sample: ${sample}`);
      } else {
        console.log(`   ❌ ${name}: ${data === null ? 'Null' : 'Empty'}`);
      }
    });
    
    // Check people data
    const totalPeople = Object.values(result.data.accountMap || {}).flat().length;
    console.log(`\n👥 People Data: ${totalPeople} total contacts across ${Object.keys(result.data.accountMap || {}).length} categories`);
    
    // Check company data
    const company = result.data.company;
    console.log(`\n🏢 Company: ${company?.name} (${company?.industry})`);
    
  } else {
    console.log('❌ API Error:', result.error || result.statusCode);
    if (result.rawData) {
      console.log('Raw response:', result.rawData.substring(0, 500));
    }
  }
}

runTest().catch(console.error);
