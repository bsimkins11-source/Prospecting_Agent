export type ApolloOrg = {
  name?: string;
  website_url?: string;
  industry?: string;
  estimated_annual_revenue?: string | number;
  employee_count?: number;
  locations?: { country?: string; city?: string; state?: string }[];
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

export async function enrichOrganization(domainOrName: string, apiKey: string): Promise<ApolloOrg> {
  const url = new URL(`${APOLLO_BASE}/organizations/enrich`);
  // You can pass domain or name; domain tends to be more reliable.
  url.searchParams.set("domain", domainOrName);
  
  const res = await fetch(url.toString(), {
    headers: { 
      "Content-Type": "application/json", 
      "X-Api-Key": apiKey 
    },
    cache: "no-store",
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Apollo org enrich failed: ${res.status} ${res.statusText}`;
    
    if (res.status === 403) {
      errorMessage += ` - Your Apollo.io API key may not have access to Organization Enrichment. Please check your plan permissions.`;
    }
    
    errorMessage += ` - ${errorText}`;
    throw new Error(errorMessage);
  }
  
  const json = await res.json();
  return json.organization as ApolloOrg;
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
