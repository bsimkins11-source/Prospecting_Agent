export type AccountMapLane = "Marketing" | "Data Analytics" | "Media" | "Customer Insight" | "Procurement";

export type Person = {
  name: string;
  title: string;
  seniority?: string;
  linkedin_url?: string;
};

export type Company = {
  name?: string;
  website?: string;
  industry?: string;
  revenue?: string | number;
  employees?: number;
  locations?: string[];
  overview?: string;
};

export type Article = {
  title: string;
  url: string;
  source?: string;
  published_at?: string;
  why_it_matters?: string;
};

export type TPSolutionAlignment = {
  need: string;
  suggested_solution: string;
  rationale: string;
};

export type ProspectResult = {
  company: Company;
  accountMap: Record<AccountMapLane, Person[]>;
  articles: Article[];
  tp_alignment?: TPSolutionAlignment[];
};
