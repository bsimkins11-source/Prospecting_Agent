import { NextRequest, NextResponse } from "next/server";
import { enrichOrganization, searchPeople, searchNewsArticles } from "@/lib/apollo";
import { openai, DEFAULT_MODEL } from "@/lib/openai";
import type { ProspectResult, AccountMapLane } from "@/types";

export const runtime = "nodejs"; // you can use 'edge' later; Node is simpler for npm deps
export const dynamic = "force-dynamic";

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

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json() as { company: string }; // domain or name (prefer domain)
    const APOLLO_API_KEY = process.env.APOLLO_API_KEY!;
    const OPENAI_MODEL = DEFAULT_MODEL;

    if (!APOLLO_API_KEY) {
      throw new Error("APOLLO_API_KEY environment variable is required");
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    // 1) Enrich org
    const org = await enrichOrganization(company, APOLLO_API_KEY);

    const domain = org?.website_url?.replace(/^https?:\/\//, "")?.replace(/\/.*/, "") || company;

    // 2) Account map by lane (cap ~5 per lane)
    const lanes = Object.keys(LANE_CONFIG) as Array<keyof typeof LANE_CONFIG>;
    const accountMap: ProspectResult["accountMap"] = {} as any;
    
    for (const lane of lanes) {
      try {
        const r = await searchPeople(buildPeopleFilters(domain, lane), APOLLO_API_KEY, 1, 10);
        const items = (r?.people || r?.contacts || []).slice(0, 5).map((p: any) => ({
          name: [p?.first_name, p?.last_name].filter(Boolean).join(" "),
          title: p?.title,
          seniority: p?.seniority,
          linkedin_url: p?.linkedin_url,
        }));
        accountMap[lane] = items;
      } catch (error) {
        console.warn(`Failed to search people for lane ${lane}:`, error);
        accountMap[lane] = [];
      }
    }

    // 3) News (3 articles)
    let articles: any[] = [];
    try {
      const news = await searchNewsArticles(domain, APOLLO_API_KEY, 3);
      articles = (news?.articles || []).map((a: any) => ({
        title: a?.title,
        url: a?.url,
        source: a?.source_name,
        published_at: a?.published_at,
      }));
    } catch (error) {
      console.warn("Failed to search news articles:", error);
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

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a precise B2B research analyst. Output valid JSON only." },
        { role: "user", content: prompt }
      ]
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}") as ProspectResult;

    // Fill missing top-level company fields from Apollo enrichment
    parsed.company = {
      name: parsed.company?.name ?? (org as any)?.name,
      website: parsed.company?.website ?? org?.website_url,
      industry: parsed.company?.industry ?? org?.industry,
      revenue: parsed.company?.revenue ?? org?.estimated_annual_revenue,
      employees: parsed.company?.employees ?? org?.employee_count,
      locations: parsed.company?.locations,
      overview: parsed.company?.overview
    };

    return NextResponse.json(parsed, { status: 200 });
  } catch (err: any) {
    console.error("Prospect API error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
