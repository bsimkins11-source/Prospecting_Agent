#!/usr/bin/env node

/**
 * UAT Production Test Script - F100 Companies
 * Tests the prospect agent API with 25 Fortune 100 companies
 */

// Fortune 100 companies for testing
const F100_COMPANIES = [
  "Walmart",
  "Amazon",
  "Apple",
  "CVS Health",
  "UnitedHealth Group",
  "Berkshire Hathaway",
  "McKesson",
  "AmerisourceBergen",
  "Alphabet",
  "Exxon Mobil",
  "Microsoft",
  "Costco Wholesale",
  "Cigna",
  "Cardinal Health",
  "Chevron",
  "Home Depot",
  "Marathon Petroleum",
  "Verizon Communications",
  "JPMorgan Chase",
  "Kroger",
  "Ford Motor",
  "General Motors",
  "AT&T",
  "Walgreens Boots Alliance",
  "Bank of America"
];

// Configuration
const CONFIG = {
  // Update this to your production URL
  baseUrl: process.env.PRODUCTION_URL || 'http://localhost:3000',
  maxConcurrent: 5, // Limit concurrent requests
  timeout: 30000, // 30 second timeout per request
  retryAttempts: 2
};

class UATTester {
  constructor() {
    this.results = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  async testCompany(company, index) {
    const testId = `Test-${index + 1}`;
    const startTime = Date.now();
    
    console.log(`\n${testId}: Testing ${company}...`);
    
    try {
      const response = await fetch(`${CONFIG.baseUrl}/api/prospect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company }),
        signal: AbortSignal.timeout(CONFIG.timeout)
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        const result = {
          testId,
          company,
          status: 'SUCCESS',
          duration,
          statusCode: response.status,
          hasCompanyData: !!data.company,
          hasAccountMap: !!data.accountMap,
          totalPeople: this.countTotalPeople(data.accountMap),
          departments: Object.keys(data.accountMap || {}),
          hasArticles: data.articles && data.articles.length > 0,
          hasTPAlignment: data.tp_alignment && data.tp_alignment.length > 0,
          hasTechStack: !!data.technology_stack,
          companyName: data.company?.name,
          companyIndustry: data.company?.industry,
          companyEmployees: data.company?.employees,
          companyRevenue: data.company?.revenue
        };

        console.log(`✅ ${testId}: ${company} - ${duration}ms`);
        console.log(`   Found ${result.totalPeople} people across ${result.departments.length} departments`);
        console.log(`   Company: ${result.companyName} (${result.companyIndustry})`);
        
        this.results.push(result);
        return result;
      } else {
        const errorText = await response.text();
        const error = {
          testId,
          company,
          status: 'ERROR',
          duration: endTime - startTime,
          statusCode: response.status,
          error: errorText
        };
        
        console.log(`❌ ${testId}: ${company} - ${response.status} ${response.statusText}`);
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
        
        this.errors.push(error);
        return error;
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const errorResult = {
        testId,
        company,
        status: 'ERROR',
        duration,
        error: error.message,
        isTimeout: error.name === 'TimeoutError'
      };
      
      console.log(`❌ ${testId}: ${company} - ${error.message}`);
      
      this.errors.push(errorResult);
      return errorResult;
    }
  }

  countTotalPeople(accountMap) {
    if (!accountMap) return 0;
    return Object.values(accountMap).reduce((total, dept) => {
      return total + (Array.isArray(dept) ? dept.length : 0);
    }, 0);
  }

  async runTests() {
    console.log('🚀 Starting UAT Production Test with F100 Companies');
    console.log('=' .repeat(60));
    console.log(`Target URL: ${CONFIG.baseUrl}`);
    console.log(`Companies to test: ${F100_COMPANIES.length}`);
    console.log(`Max concurrent: ${CONFIG.maxConcurrent}`);
    console.log(`Timeout: ${CONFIG.timeout}ms`);
    console.log('');

    // Test in batches to avoid overwhelming the server
    for (let i = 0; i < F100_COMPANIES.length; i += CONFIG.maxConcurrent) {
      const batch = F100_COMPANIES.slice(i, i + CONFIG.maxConcurrent);
      const batchPromises = batch.map((company, batchIndex) => 
        this.testCompany(company, i + batchIndex)
      );
      
      await Promise.all(batchPromises);
      
      // Small delay between batches
      if (i + CONFIG.maxConcurrent < F100_COMPANIES.length) {
        console.log('\n⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    this.generateReport();
  }

  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    const successCount = this.results.length;
    const errorCount = this.errors.length;
    const totalTests = F100_COMPANIES.length;

    console.log('\n' + '=' .repeat(60));
    console.log('📊 UAT TEST REPORT');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`Average per test: ${(totalDuration / totalTests / 1000).toFixed(1)}s`);

    if (this.results.length > 0) {
      console.log('\n📈 SUCCESS METRICS:');
      const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
      const avgPeople = this.results.reduce((sum, r) => sum + r.totalPeople, 0) / this.results.length;
      const companiesWithData = this.results.filter(r => r.hasCompanyData).length;
      const companiesWithPeople = this.results.filter(r => r.totalPeople > 0).length;
      
      console.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`);
      console.log(`Average People Found: ${avgPeople.toFixed(1)}`);
      console.log(`Companies with Data: ${companiesWithData}/${successCount}`);
      console.log(`Companies with People: ${companiesWithPeople}/${successCount}`);
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => {
        console.log(`  ${error.testId}: ${error.company} - ${error.error}`);
      });
    }

    console.log('\n🏆 TOP PERFORMING COMPANIES:');
    this.results
      .sort((a, b) => b.totalPeople - a.totalPeople)
      .slice(0, 5)
      .forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.company}: ${result.totalPeople} people (${result.duration}ms)`);
      });

    console.log('\n' + '=' .repeat(60));
    
    // Save detailed results to file
    this.saveDetailedResults();
  }

  saveDetailedResults() {
    const detailedResults = {
      summary: {
        totalTests: F100_COMPANIES.length,
        successful: this.results.length,
        failed: this.errors.length,
        successRate: ((this.results.length / F100_COMPANIES.length) * 100).toFixed(1),
        totalDuration: Date.now() - this.startTime
      },
      results: this.results,
      errors: this.errors,
      timestamp: new Date().toISOString()
    };

    const fs = require('fs');
    const filename = `uat-results-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(detailedResults, null, 2));
    console.log(`📁 Detailed results saved to: ${filename}`);
  }
}

// Run the tests
const tester = new UATTester();
tester.runTests().catch(console.error);
