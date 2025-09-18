const https = require('https');

async function testEnhancedProspect() {
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
  console.log('🔍 Testing Enhanced Prospect Analysis with Transparent Partners Focus');
  console.log('=' .repeat(70));
  
  const result = await testEnhancedProspect();
  
  if (result.success) {
    console.log('✅ SUCCESS - Enhanced Analysis Complete');
    
    // Company Data
    console.log('\n🏢 COMPANY DATA:');
    const company = result.data.company;
    console.log(`   • Name: ${company.name}`);
    console.log(`   • Industry: ${company.industry}`);
    console.log(`   • Revenue: ${company.revenue}`);
    console.log(`   • Employees: ${company.employees}`);
    console.log(`   • Location: ${company.locations?.join(', ') || 'N/A'}`);
    console.log(`   • Founded: ${company.founded_year || 'N/A'}`);
    console.log(`   • Overview: ${company.overview ? 'Present (' + company.overview.length + ' chars)' : 'Missing'}`);
    
    // Employee Data (Transparent Partners Focus Areas)
    console.log('\n👥 EMPLOYEE DATA (TP Focus Areas):');
    const accountMap = result.data.accountMap;
    Object.entries(accountMap).forEach(([dept, people]) => {
      console.log(`   • ${dept}: ${people.length} contacts`);
      if (people.length > 0) {
        people.slice(0, 3).forEach((person, i) => {
          console.log(`     - ${person.name} (${person.title})`);
        });
        if (people.length > 3) {
          console.log(`     ... and ${people.length - 3} more`);
        }
      }
    });
    
    // Analysis Modules
    console.log('\n🤖 AI ANALYSIS MODULES:');
    console.log(`   • MarTech Analysis: ${result.data.martech_analysis ? 'Present' : 'Missing'}`);
    console.log(`   • Challenges: ${result.data.challenges ? 'Present' : 'Missing'}`);
    console.log(`   • Tech Stack: ${result.data.tech_stack ? 'Present' : 'Missing'}`);
    console.log(`   • TP Alignment: ${result.data.tp_alignment ? 'Present' : 'Missing'}`);
    
    // Show sample analysis content
    if (result.data.martech_analysis) {
      console.log('\n📊 MARTECH ANALYSIS SAMPLE:');
      Object.entries(result.data.martech_analysis).slice(0, 2).forEach(([key, value]) => {
        console.log(`   • ${key}: ${typeof value === 'string' ? value.substring(0, 100) + '...' : 'Complex data'}`);
      });
    }
    
    if (result.data.challenges) {
      console.log('\n⚠️  CHALLENGES SAMPLE:');
      Object.entries(result.data.challenges).slice(0, 2).forEach(([key, value]) => {
        console.log(`   • ${key}: ${typeof value === 'string' ? value.substring(0, 100) + '...' : 'Complex data'}`);
      });
    }
    
    if (result.data.tp_alignment) {
      console.log('\n🎯 TP ALIGNMENT SAMPLE:');
      Object.entries(result.data.tp_alignment).slice(0, 2).forEach(([key, value]) => {
        console.log(`   • ${key}: ${typeof value === 'string' ? value.substring(0, 100) + '...' : 'Complex data'}`);
      });
    }
    
    // Summary
    const totalPeople = Object.values(accountMap).flat().length;
    console.log('\n📈 SUMMARY:');
    console.log(`   • Total Contacts: ${totalPeople}`);
    console.log(`   • Analysis Modules: ${Object.values(result.data).filter(v => v && typeof v === 'object' && !Array.isArray(v)).length - 1}`);
    console.log(`   • Data Quality: ${company.overview && company.locations?.length > 0 ? 'High' : 'Medium'}`);
    
    console.log('\n🎉 Enhanced prospect analysis with Transparent Partners focus areas is working!');
    
  } else {
    console.log('❌ FAILED:', result.error || result.statusCode);
    if (result.rawData) {
      console.log('Raw response:', result.rawData);
    }
  }
}

runTest().catch(console.error);
