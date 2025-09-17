#!/usr/bin/env node

/**
 * Apollo API Key Test Script
 * Tests Apollo.io API key functionality for people search and organization search
 */

const APOLLO_BASE = "https://api.apollo.io/api/v1";

// Test configuration
const TEST_CONFIG = {
  // Test with a well-known company
  testCompany: "salesforce.com",
  testPersonQuery: "marketing manager",
  perPage: 5,
  page: 1
};

async function testApolloAPI(apiKey) {
  console.log("🔍 Testing Apollo API Key...");
  console.log("=" .repeat(50));
  
  if (!apiKey) {
    console.error("❌ No API key provided. Please set APOLLO_API_KEY environment variable.");
    process.exit(1);
  }
  
  console.log(`✅ API Key found: ${apiKey.substring(0, 8)}...`);
  console.log(`🎯 Testing with company: ${TEST_CONFIG.testCompany}`);
  console.log("");

  try {
    // Test 1: Organization Search
    console.log("1️⃣ Testing Organization Search...");
    const orgResult = await testOrganizationSearch(apiKey);
    console.log("✅ Organization search successful");
    console.log(`   Found: ${orgResult.name} (${orgResult.primary_domain})`);
    console.log(`   Industry: ${orgResult.industry}`);
    console.log(`   Employees: ${orgResult.organization_headcount}`);
    console.log("");

    // Test 2: People Search
    console.log("2️⃣ Testing People Search...");
    const peopleResult = await testPeopleSearch(apiKey, orgResult.name);
    console.log(`✅ People search successful - Found ${peopleResult.people?.length || 0} people`);
    
    if (peopleResult.people && peopleResult.people.length > 0) {
      console.log("   Sample results:");
      peopleResult.people.slice(0, 3).forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.first_name} ${person.last_name} - ${person.title}`);
        console.log(`      Email: ${person.email || 'Not available'}`);
        console.log(`      LinkedIn: ${person.linkedin_url || 'Not available'}`);
      });
    }
    console.log("");

    // Test 3: News Articles Search
    console.log("3️⃣ Testing News Articles Search...");
    const newsResult = await testNewsSearch(apiKey, orgResult.primary_domain);
    console.log(`✅ News search successful - Found ${newsResult.news_articles?.length || 0} articles`);
    
    if (newsResult.news_articles && newsResult.news_articles.length > 0) {
      console.log("   Sample articles:");
      newsResult.news_articles.slice(0, 2).forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title}`);
        console.log(`      Source: ${article.source_name}`);
        console.log(`      URL: ${article.url}`);
      });
    }
    console.log("");

    console.log("🎉 All Apollo API tests passed!");
    console.log("✅ Your API key is working correctly for people search and organization search.");

  } catch (error) {
    console.error("❌ Apollo API test failed:");
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('403')) {
      console.error("   💡 This might be a permissions issue. Check if your Apollo plan includes:");
      console.error("      - Organization Search");
      console.error("      - People Search");
      console.error("      - News Articles Search");
    } else if (error.message.includes('401')) {
      console.error("   💡 This might be an authentication issue. Check if your API key is correct.");
    }
    
    process.exit(1);
  }
}

async function testOrganizationSearch(apiKey) {
  const response = await fetch(`${APOLLO_BASE}/mixed_companies/search`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "X-Api-Key": apiKey 
    },
    body: JSON.stringify({
      q: TEST_CONFIG.testCompany,
      per_page: 5,
      page: 1,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Organization search failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  const data = await response.json();
  const accounts = data.accounts || [];
  
  if (accounts.length === 0) {
    throw new Error("No organizations found");
  }
  
  return accounts[0];
}

async function testPeopleSearch(apiKey, companyName) {
  const response = await fetch(`${APOLLO_BASE}/people/search`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "X-Api-Key": apiKey 
    },
    body: JSON.stringify({
      q: `${companyName} ${TEST_CONFIG.testPersonQuery}`,
      page: 1,
      per_page: TEST_CONFIG.perPage,
      reveal_personal_emails: true,
      reveal_phone_numbers: false
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`People search failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
}

async function testNewsSearch(apiKey, companyDomain) {
  const response = await fetch(`${APOLLO_BASE}/news_articles/search`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "X-Api-Key": apiKey 
    },
    body: JSON.stringify({
      per_page: 3,
      page: 1,
      q_organization_domains: [companyDomain],
      sort_by: "published_at", 
      sort_dir: "desc",
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`News search failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
}

// Run the test
const apiKey = process.env.APOLLO_API_KEY;
testApolloAPI(apiKey);
