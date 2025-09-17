export type ApolloOrg = {
  name?: string;
  website_url?: string;
  industry?: string;
  estimated_annual_revenue?: string | number;
  organization_revenue?: number;
  organization_revenue_printed?: string;
  employee_count?: number;
  organization_headcount?: number;
  locations?: { country?: string; city?: string; state?: string }[];
  organization_city?: string;
  organization_state?: string;
  organization_country?: string;
};

export type ApolloPerson = {
  first_name?: string;
  last_name?: string;
  title?: string;
  seniority?: string;
  linkedin_url?: string;
  department?: string;
};

export type ApolloNewsArticle = {
  title?: string;
  url?: string;
  source_name?: string;
  published_at?: string;
};

const APOLLO_BASE = "https://api.apollo.io/api/v1";

export async function searchOrganizations(domainOrName: string, apiKey: string): Promise<ApolloOrg> {
  // Use Organization Search endpoint instead of Organization Enrichment
  const res = await fetch(`${APOLLO_BASE}/mixed_companies/search`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "X-Api-Key": apiKey 
    },
    body: JSON.stringify({
      q: domainOrName,
      per_page: 1,
      page: 1,
    }),
    cache: "no-store",
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Apollo organization search failed: ${res.status} ${res.statusText}`;
    
    if (res.status === 403) {
      errorMessage += ` - Your Apollo.io API key may not have access to Organization Search. Please check your plan permissions.`;
    }
    
    errorMessage += ` - ${errorText}`;
    throw new Error(errorMessage);
  }
  
  const json = await res.json();
  const organization = json.organizations?.[0] || json.accounts?.[0];
  
  if (!organization) {
    throw new Error("No organization found matching the search criteria");
  }
  
  return organization as ApolloOrg;
}

// Generic people search for a department/title lane
export async function searchPeople(
  filters: Record<string, any>,
  apiKey: string,
  page = 1,
  per_page = 25
) {
  const res = await fetch(`${APOLLO_BASE}/mixed_people/search`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "X-Api-Key": apiKey 
    },
    body: JSON.stringify({ ...filters, page, per_page }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Apollo people search failed: ${res.status} ${res.statusText} - ${errorText}`);
  }
  
  return res.json();
}

export async function searchNewsArticles(
  companyDomain: string,
  apiKey: string,
  limit = 3
) {
  const res = await fetch(`${APOLLO_BASE}/news_articles/search`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "X-Api-Key": apiKey 
    },
    body: JSON.stringify({
      q_organization_domains: [companyDomain],
      per_page: limit,
      page: 1,
      // keyword filter to bias to AI/MarTech/AdTech/Data related topics
      q_keywords: ["AI", "artificial intelligence", "MarTech", "AdTech", "data"],
      sort_by: "published_at", 
      sort_dir: "desc",
    }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Apollo news search failed: ${res.status} ${res.statusText} - ${errorText}`);
  }
  
  return res.json();
}
