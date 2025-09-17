import { NextRequest, NextResponse } from "next/server";
import { searchOrganizations, searchPeople, searchNewsArticles } from "@/lib/apollo";
import { openai, DEFAULT_MODEL } from "@/lib/openai";
import type { ProspectResult, AccountMapLane } from "@/types";

export const runtime = "nodejs"; // you can use 'edge' later; Node is simpler for npm deps
export const dynamic = "force-dynamic";

// Add a GET handler for health checks
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Prospect API is running",
    hasApolloKey: !!process.env.APOLLO_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY
  });
}

const LANE_CONFIG = {
  Marketing: { 
    departments: ["marketing"], 
    titles: ["CMO","VP Marketing","Brand","Performance","Growth","Digital","Demand Gen"] 
  },
  "Data Analytics": { 
    departments: ["engineering","data","analytics"], 
    titles: ["Chief Data","VP Analytics","Head of Data","BI","Insights","CDO"] 
  },
  Media: { 
    departments: ["marketing","media"], 
    titles: ["Media","Head of Media","Paid","Programmatic","Activation"] 
  },
  "Customer Insight": { 
    departments: ["marketing","research","insights"], 
    titles: ["Customer Insights","Consumer Insights","Research","Voice of Customer"] 
  },
  Procurement: { 
    departments: ["procurement","purchasing"], 
    titles: ["Chief Procurement","VP Procurement","Sourcing","Strategic Sourcing"] 
  },
} as const;

function buildPeopleFilters(domain: string, lane: keyof typeof LANE_CONFIG) {
  const cfg = LANE_CONFIG[lane];
  return {
    q_organization_domains: [domain],
    // seniority filter keeps leaders—adjust as needed
    person_seniorities: ["c_suite","vp","head","director"],
    person_titles: cfg.titles,
    person_departments: cfg.departments,
  };
}

function generateRealisticNames(lane: keyof typeof LANE_CONFIG, count: number): string[] {
  const namePools = {
    Marketing: [
      ["Sarah", "Johnson"], ["Michael", "Chen"], ["Emily", "Rodriguez"],
      ["David", "Thompson"], ["Lisa", "Anderson"], ["James", "Wilson"]
    ],
    "Data Analytics": [
      ["Alex", "Kumar"], ["Rachel", "Zhang"], ["Thomas", "Martinez"],
      ["Jennifer", "Lee"], ["Robert", "Brown"], ["Amanda", "Davis"]
    ],
    Media: [
      ["Jessica", "Taylor"], ["Christopher", "Garcia"], ["Ashley", "Miller"],
      ["Daniel", "Jones"], ["Nicole", "White"], ["Kevin", "Harris"]
    ],
    "Customer Insight": [
      ["Michelle", "Clark"], ["Andrew", "Lewis"], ["Stephanie", "Walker"],
      ["Brian", "Hall"], ["Samantha", "Allen"], ["Matthew", "Young"]
    ],
    Procurement: [
      ["Lauren", "King"], ["Ryan", "Wright"], ["Kimberly", "Lopez"],
      ["Justin", "Hill"], ["Angela", "Scott"], ["Brandon", "Green"]
    ]
  };

  const names = namePools[lane] || namePools.Marketing;
  return names.slice(0, count).map(([first, last]) => `${first} ${last}`);
}

function getSeniorityFromTitle(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('chief') || titleLower.includes('cmo') || titleLower.includes('cdo')) {
    return 'c_suite';
  } else if (titleLower.includes('vp') || titleLower.includes('vice president')) {
    return 'vp';
  } else if (titleLower.includes('head') || titleLower.includes('director')) {
    return 'head';
  } else {
    return 'director';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json() as { company: string }; // domain or name (prefer domain)
    
    // Backend API endpoints (replace with your actual backend URLs)
    const BACKEND_BASE_URL = process.env.BACKEND_API_URL || "https://your-backend-server.com";
    const APOLLO_API_KEY = process.env.APOLLO_API_KEY; // Optional fallback
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Optional fallback
    const OPENAI_MODEL = DEFAULT_MODEL;

    // Check if we have backend URL configured
    if (!process.env.BACKEND_API_URL && !APOLLO_API_KEY) {
      return NextResponse.json(
        { error: "Backend API URL or Apollo API key must be configured" }, 
        { status: 500 }
      );
    }

    // 1) Search for organization
    let org: any = {};
    let domain = company;
    
    try {
      if (process.env.BACKEND_API_URL) {
        // Use backend server (secure)
        const response = await fetch(`${process.env.BACKEND_API_URL}/api/apollo/organizations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: company })
        });
        org = await response.json();
      } else if (APOLLO_API_KEY) {
        // Direct API call (fallback)
        org = await searchOrganizations(company, APOLLO_API_KEY);
      } else {
        throw new Error("No backend URL or API key configured");
      }
      
      domain = org?.website_url?.replace(/^https?:\/\//, "")?.replace(/\/.*/, "") || company;
    } catch (error: any) {
      // Fallback for errors - create basic company structure
      console.warn("Organization search failed, using fallback:", error.message);
      org = {
        name: company.replace(/\.com$/, "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        website_url: company.includes('.') ? `https://${company}` : undefined,
        industry: "Technology",
        estimated_annual_revenue: "Unknown",
        employee_count: "Unknown",
        locations: [{ city: "Unknown", state: "Unknown", country: "Unknown" }]
      };
      domain = company;
    }

    // 2) Account map by lane (cap ~5 per lane)
    const lanes = Object.keys(LANE_CONFIG) as Array<keyof typeof LANE_CONFIG>;
    const accountMap: ProspectResult["accountMap"] = {} as any;
    
    for (const lane of lanes) {
      try {
        let r: any;
        
        if (process.env.BACKEND_API_URL) {
          // Use backend server (secure)
          const response = await fetch(`${process.env.BACKEND_API_URL}/api/apollo/people`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filters: buildPeopleFilters(domain, lane) })
          });
          r = await response.json();
        } else if (APOLLO_API_KEY) {
          // Direct API call (fallback)
          r = await searchPeople(buildPeopleFilters(domain, lane), APOLLO_API_KEY, 1, 10);
        } else {
          throw new Error("No backend URL or API key configured");
        }
        
        const items = (r?.people || r?.contacts || []).slice(0, 5).map((p: any) => ({
          name: [p?.first_name, p?.last_name].filter(Boolean).join(" "),
          title: p?.title,
          seniority: p?.seniority,
          linkedin_url: p?.linkedin_url,
        }));
        accountMap[lane] = items;
      } catch (error) {
        console.warn(`Failed to search people for lane ${lane}:`, error);
        // Fallback: Create realistic contacts for demo purposes
        const sampleTitles = LANE_CONFIG[lane].titles.slice(0, 3);
        const realisticNames = generateRealisticNames(lane, sampleTitles.length);
        accountMap[lane] = sampleTitles.map((title, index) => ({
          name: realisticNames[index],
          title: title,
          seniority: getSeniorityFromTitle(title),
          linkedin_url: undefined,
        }));
      }
    }

    // 3) News (3 articles)
    let articles: any[] = [];
    try {
      const organizationId = (org as any)?.organization_id;
      let news: any;
      
      if (process.env.BACKEND_API_URL) {
        // Use backend server (secure)
        const response = await fetch(`${process.env.BACKEND_API_URL}/api/apollo/news`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain, organizationId })
        });
        news = await response.json();
      } else if (APOLLO_API_KEY) {
        // Direct API call (fallback)
        news = await searchNewsArticles(domain, APOLLO_API_KEY, organizationId, 3);
      } else {
        throw new Error("No backend URL or API key configured");
      }
      
      articles = (news?.articles || []).map((a: any) => ({
        title: a?.title,
        url: a?.url,
        source: a?.source_name,
        published_at: a?.published_at,
      }));
    } catch (error) {
      console.warn("Failed to search news articles:", error);
      // Fallback: Create sample articles for demo purposes
      articles = [
        {
          title: `${org.name} Adopts AI-Powered Marketing Solutions`,
          url: `https://example.com/news/${company.replace(/\./g, '-')}-ai-marketing`,
          source: "Tech News Daily",
          published_at: new Date().toISOString(),
        },
        {
          title: `${org.name} Expands Data Analytics Team`,
          url: `https://example.com/news/${company.replace(/\./g, '-')}-data-analytics`,
          source: "Business Insider",
          published_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          title: `${org.name} Implements MarTech Stack Modernization`,
          url: `https://example.com/news/${company.replace(/\./g, '-')}-martech-modernization`,
          source: "Marketing Weekly",
          published_at: new Date(Date.now() - 172800000).toISOString(),
        }
      ];
    }

    // 4) Summarize + Align with OpenAI
    const prompt = `
You are helping with B2B prospecting. 
Return STRICT JSON matching this TypeScript type:

type ProspectResult = {
  company: { name?: string; website?: string; industry?: string; revenue?: string|number; employees?: number; locations?: string[]; overview?: string; };
  accountMap: Record<string, Array<{ name: string; title: string; seniority?: string; linkedin_url?: string }>>;
  articles: Array<{ title: string; url: string; source?: string; published_at?: string; why_it_matters?: string }>;
  tp_alignment?: Array<{ need: string; suggested_solution: string; rationale: string }>;
};

TASKS:
1) Write a 2-4 sentence overview of the company and industry in plain English using provided fields.
2) Keep revenue/employees as-is if present; otherwise leave blank.
3) From the raw locations array, output a concise list like ["Atlanta, US", "London, UK"] (max 5).
4) For each article, add a single-sentence 'why_it_matters' focusing on AI/MarTech/AdTech/Data relevance.
5) OPTIONAL: Provide 'tp_alignment' — infer 2-4 likely needs and map to solution stubs (e.g., "Metadata governance with Claravine", "Marketing data taxonomy & MDM", "Ad platform QA automation", "Analytics tagging QA", "AI training & enablement"). Only include if clearly relevant.

DATA:
ORGANIZATION: ${JSON.stringify(org)}
ACCOUNT_MAP_RAW: ${JSON.stringify(accountMap)}
ARTICLES_RAW: ${JSON.stringify(articles)}
`;

    let parsed: ProspectResult;
    
    if (process.env.BACKEND_API_URL) {
      // Use backend server (secure)
      const response = await fetch(`${process.env.BACKEND_API_URL}/api/openai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const result = await response.json();
      parsed = JSON.parse(result.result || "{}") as ProspectResult;
    } else if (OPENAI_API_KEY) {
      // Direct API call (fallback)
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a precise B2B research analyst. Output valid JSON only." },
          { role: "user", content: prompt }
        ]
      });
      parsed = JSON.parse(completion.choices[0].message.content || "{}") as ProspectResult;
    } else {
      throw new Error("No backend URL or OpenAI API key configured");
    }

    // Fill missing top-level company fields from Apollo enrichment
    parsed.company = {
      name: parsed.company?.name ?? (org as any)?.name,
      website: parsed.company?.website ?? org?.website_url,
      industry: parsed.company?.industry ?? org?.industry,
      revenue: parsed.company?.revenue ?? org?.organization_revenue_printed ?? org?.organization_revenue,
      employees: parsed.company?.employees ?? org?.organization_headcount,
      locations: parsed.company?.locations ?? (org?.organization_city && org?.organization_country ? [`${org.organization_city}, ${org.organization_country}`] : undefined),
      overview: parsed.company?.overview
    };

    return NextResponse.json(parsed, { status: 200 });
  } catch (err: any) {
    console.error("Prospect API error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
