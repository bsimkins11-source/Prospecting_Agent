// Test the company matching logic
function generateFallbackCompanyData(company) {
  const knownCompanies = {
    'fordmotor': {
      name: 'Ford Motor Company',
      website_url: 'ford.com',
      industry: 'Automotive Manufacturing',
      estimated_annual_revenue: '$150B+',
      organization_headcount: 190000,
      organization_city: 'Dearborn',
      organization_state: 'MI',
      organization_country: 'United States'
    },
    'cvshealth': {
      name: 'CVS Health Corporation',
      website_url: 'cvs.com',
      industry: 'Healthcare & Pharmacy',
      estimated_annual_revenue: '$300B+',
      organization_headcount: 300000,
      organization_city: 'Woonsocket',
      organization_state: 'RI',
      organization_country: 'United States'
    }
  };
  
  // Try multiple matching strategies
  const companyLower = company.toLowerCase();
  const companyKey = companyLower.replace(/[^a-z]/g, '');
  
  console.log(`Testing company: "${company}"`);
  console.log(`companyLower: "${companyLower}"`);
  console.log(`companyKey: "${companyKey}"`);
  
  // Direct key match
  let knownData = knownCompanies[companyKey];
  if (knownData) {
    console.log(`Direct match found: ${knownData.name}`);
    return knownData;
  }
  
  // Try partial matches for common variations
  const partialMatches = Object.keys(knownCompanies).filter(key => {
    return companyKey.includes(key) || key.includes(companyKey) ||
           companyLower.includes(key) || key.includes(companyLower);
  });
  
  console.log(`Partial matches:`, partialMatches);
  
  if (partialMatches.length > 0) {
    // Use the best match (longest key)
    const bestMatch = partialMatches.reduce((a, b) => a.length > b.length ? a : b);
    knownData = knownCompanies[bestMatch];
    if (knownData) {
      console.log(`Best partial match: ${bestMatch} -> ${knownData.name}`);
      return knownData;
    }
  }
  
  console.log('No match found, returning generic data');
  return {
    name: company,
    website_url: `${company.toLowerCase()}.com`,
    industry: 'Technology',
    estimated_annual_revenue: '$1B-$10B',
    organization_headcount: 1000,
    organization_city: 'San Francisco',
    organization_state: 'CA',
    organization_country: 'United States'
  };
}

// Test cases
console.log('=== Testing Ford Motor ===');
const fordResult = generateFallbackCompanyData('Ford Motor');
console.log('Result:', fordResult.name, fordResult.industry);
console.log('');

console.log('=== Testing CVS Health ===');
const cvsResult = generateFallbackCompanyData('CVS Health');
console.log('Result:', cvsResult.name, cvsResult.industry);
console.log('');

console.log('=== Testing Alphabet ===');
const alphabetResult = generateFallbackCompanyData('Alphabet');
console.log('Result:', alphabetResult.name, alphabetResult.industry);
