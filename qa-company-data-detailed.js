const https = require('https');

// Test companies with known characteristics for validation
const testCompanies = [
  { domain: 'southwest.com', expectedIndustry: 'airlines', expectedRevenue: '20B+', expectedEmployees: '50K+' },
  { domain: 'verizon.com', expectedIndustry: 'telecommunications', expectedRevenue: '100B+', expectedEmployees: '100K+' },
  { domain: 'microsoft.com', expectedIndustry: 'technology', expectedRevenue: '200B+', expectedEmployees: '200K+' },
  { domain: 'apple.com', expectedIndustry: 'technology', expectedRevenue: '300B+', expectedEmployees: '150K+' },
  { domain: 'amazon.com', expectedIndustry: 'e-commerce', expectedRevenue: '500B+', expectedEmployees: '1M+' },
  { domain: 'google.com', expectedIndustry: 'technology', expectedRevenue: '200B+', expectedEmployees: '150K+' },
  { domain: 'mcdonalds.com', expectedIndustry: 'restaurants', expectedRevenue: '20B+', expectedEmployees: '100K+' },
  { domain: 'walmart.com', expectedIndustry: 'retail', expectedRevenue: '500B+', expectedEmployees: '2M+' },
  { domain: 'coca-cola.com', expectedIndustry: 'beverages', expectedRevenue: '40B+', expectedEmployees: '50K+' },
  { domain: 'tesla.com', expectedIndustry: 'automotive', expectedRevenue: '50B+', expectedEmployees: '100K+' }
];

async function testCompanyData(company) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ company: company.domain });
    
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
            company: company,
            success: res.statusCode === 200,
            statusCode: res.statusCode,
            data: result
          });
        } catch (error) {
          resolve({
            company: company,
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
        company: company,
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

function analyzeCompanyData(company, result) {
  const companyData = result.data?.company;
  if (!companyData) {
    return { score: 0, issues: ['No company data found'] };
  }

  let score = 0;
  let issues = [];
  let strengths = [];

  // Basic company info (40 points)
  if (companyData.name) {
    score += 10;
    strengths.push('Company name present');
  } else {
    issues.push('Missing company name');
  }

  if (companyData.website) {
    score += 10;
    strengths.push('Website present');
  } else {
    issues.push('Missing website');
  }

  if (companyData.industry) {
    score += 10;
    strengths.push('Industry present');
    
    // Check if industry matches expected
    const expectedIndustry = company.expectedIndustry.toLowerCase();
    const actualIndustry = companyData.industry.toLowerCase();
    if (actualIndustry.includes(expectedIndustry) || expectedIndustry.includes(actualIndustry.split('/')[0])) {
      score += 5;
      strengths.push('Industry matches expected');
    } else {
      issues.push(`Industry mismatch: expected ${expectedIndustry}, got ${actualIndustry}`);
    }
  } else {
    issues.push('Missing industry');
  }

  if (companyData.employees) {
    score += 10;
    strengths.push('Employee count present');
    
    // Check if employee count is reasonable
    const employees = parseInt(companyData.employees.toString().replace(/,/g, ''));
    if (employees > 1000) {
      score += 5;
      strengths.push('Employee count seems reasonable');
    } else if (employees < 100) {
      issues.push('Employee count seems too low');
    }
  } else {
    issues.push('Missing employee count');
  }

  // Revenue data (20 points)
  if (companyData.revenue) {
    score += 10;
    strengths.push('Revenue present');
    
    // Check if revenue is reasonable
    const revenue = companyData.revenue.toString();
    if (revenue.includes('B') || revenue.includes('billion')) {
      score += 5;
      strengths.push('Revenue in billions (reasonable scale)');
    } else if (revenue.includes('M') || revenue.includes('million')) {
      score += 3;
      strengths.push('Revenue in millions');
    }
  } else {
    issues.push('Missing revenue');
  }

  // Location data (15 points)
  if (companyData.locations && companyData.locations.length > 0) {
    score += 10;
    strengths.push('Location data present');
    
    if (companyData.locations.length > 1) {
      score += 5;
      strengths.push('Multiple locations');
    }
  } else {
    issues.push('Missing location data');
  }

  // Overview/Description (15 points)
  if (companyData.overview) {
    score += 10;
    strengths.push('Company overview present');
    
    if (companyData.overview.length > 50) {
      score += 5;
      strengths.push('Detailed overview');
    }
  } else {
    issues.push('Missing company overview');
  }

  // Additional data quality checks (10 points)
  if (companyData.name && companyData.name !== company.domain.replace('.com', '')) {
    score += 5;
    strengths.push('Company name differs from domain (good)');
  }

  // Check for generic data patterns
  const isGeneric = companyData.industry === 'Technology' && 
                   companyData.revenue === '$1B-$10B' && 
                   companyData.employees === 1429;
  
  if (isGeneric) {
    score = 0;
    issues = ['Generic fallback data detected'];
  }

  return { score, issues, strengths };
}

async function runDetailedQA() {
  console.log('🔍 DETAILED COMPANY DATA QA TEST');
  console.log('=' .repeat(80));
  console.log('Testing comprehensive company data quality including:');
  console.log('- Basic company information (name, website, industry)');
  console.log('- Financial data (revenue, employees)');
  console.log('- Location and overview data');
  console.log('- Data accuracy and specificity');
  console.log('=' .repeat(80));
  
  const results = [];
  let totalScore = 0;
  let maxScore = 0;
  
  for (const company of testCompanies) {
    console.log(`\n🏢 Testing: ${company.domain}`);
    console.log(`   Expected: ${company.expectedIndustry} industry, ${company.expectedRevenue} revenue, ${company.expectedEmployees} employees`);
    
    const result = await testCompanyData(company);
    results.push(result);
    
    if (result.success) {
      const analysis = analyzeCompanyData(company, result);
      totalScore += analysis.score;
      maxScore += 100;
      
      console.log(`✅ SUCCESS - Data Quality Score: ${analysis.score}/100`);
      
      // Show company data
      const companyData = result.data.company;
      console.log(`   📊 Company: ${companyData.name || 'N/A'}`);
      console.log(`   🏭 Industry: ${companyData.industry || 'N/A'}`);
      console.log(`   💰 Revenue: ${companyData.revenue || 'N/A'}`);
      console.log(`   👥 Employees: ${companyData.employees || 'N/A'}`);
      console.log(`   🌍 Locations: ${companyData.locations?.join(', ') || 'N/A'}`);
      console.log(`   📝 Overview: ${companyData.overview ? companyData.overview.substring(0, 100) + '...' : 'N/A'}`);
      
      // Show strengths
      if (analysis.strengths.length > 0) {
        console.log(`   ✅ Strengths:`);
        analysis.strengths.forEach(strength => {
          console.log(`      • ${strength}`);
        });
      }
      
      // Show issues
      if (analysis.issues.length > 0) {
        console.log(`   ⚠️  Issues:`);
        analysis.issues.forEach(issue => {
          console.log(`      • ${issue}`);
        });
      }
      
      // Show people data summary
      const totalPeople = Object.values(result.data.accountMap || {}).flat().length;
      console.log(`   👥 Total People Found: ${totalPeople}`);
      
    } else {
      console.log(`❌ FAILED: ${result.error || result.statusCode}`);
      if (result.rawData) {
        console.log(`   Raw response: ${result.rawData.substring(0, 200)}...`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 DETAILED QA SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful requests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed requests: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgScore = Math.round(totalScore / successful.length);
    console.log(`📈 Average data quality score: ${avgScore}/100`);
    
    // Grade the overall quality
    let grade = 'F';
    if (avgScore >= 90) grade = 'A';
    else if (avgScore >= 80) grade = 'B';
    else if (avgScore >= 70) grade = 'C';
    else if (avgScore >= 60) grade = 'D';
    
    console.log(`🎯 Overall Grade: ${grade}`);
    
    // Show companies with best/worst scores
    const scoredResults = successful.map(r => ({
      company: r.company.domain,
      score: analyzeCompanyData(r.company, r).score
    })).sort((a, b) => b.score - a.score);
    
    console.log(`\n🏆 TOP PERFORMERS:`);
    scoredResults.slice(0, 3).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.company}: ${r.score}/100`);
    });
    
    if (scoredResults.length > 3) {
      console.log(`\n⚠️  NEEDS IMPROVEMENT:`);
      scoredResults.slice(-2).forEach((r, i) => {
        console.log(`   ${scoredResults.length - 1 + i}. ${r.company}: ${r.score}/100`);
      });
    }
  }
  
  // Check for common issues
  const allIssues = successful.flatMap(r => analyzeCompanyData(r.company, r).issues);
  const issueCounts = {};
  allIssues.forEach(issue => {
    issueCounts[issue] = (issueCounts[issue] || 0) + 1;
  });
  
  if (Object.keys(issueCounts).length > 0) {
    console.log(`\n🔍 COMMON ISSUES:`);
    Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([issue, count]) => {
        console.log(`   • ${issue}: ${count} companies`);
      });
  }
  
  if (successful.length > 0 && totalScore / successful.length >= 80) {
    console.log('\n🎉 EXCELLENT! Company data quality is high!');
  } else if (successful.length > 0 && totalScore / successful.length >= 60) {
    console.log('\n👍 GOOD! Company data quality is acceptable with room for improvement.');
  } else {
    console.log('\n⚠️  NEEDS WORK! Company data quality needs improvement.');
  }
}

runDetailedQA().catch(console.error);
