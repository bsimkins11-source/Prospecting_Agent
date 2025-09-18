export type AccountMapLane = "Marketing" | "Media & AdTech" | "MarTech" | "Analytics & Data" | "Customer Strategy";

export type Person = {
  name: string;
  title: string;
  seniority?: string;
  email?: string;
  linkedin_url?: string;
  company?: string;
};

export type Company = {
  name?: string;
  website?: string;
  industry?: string;
  revenue?: string | number;
  employees?: number;
  locations?: string[];
  overview?: string;
  founded_year?: number;
  linkedin_url?: string;
  logo_url?: string;
  keywords?: string;
  raw_address?: string;
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

export type ChildBrands = {
  is_portfolio_company: boolean;
  parent_company: string;
  child_brands: string[];
  note: string;
};

export type TechStackCategory = {
  primary: string;
  secondary: string;
  potential_issues?: string[];
};

export type TechStackIssue = {
  category: string;
  issue: string;
  solution: string;
  impact: 'High' | 'Medium' | 'Low';
};

export type TechnologyStack = {
  email_marketing?: TechStackCategory;
  data_management?: TechStackCategory;
  analytics?: TechStackCategory;
  advertising?: TechStackCategory;
  crm?: TechStackCategory;
  potential_issues?: TechStackIssue[];
  integration_complexity?: 'High' | 'Medium' | 'Low';
  recommendation?: string;
};

export type ProspectResult = {
  company: Company;
  accountMap: Record<AccountMapLane, Person[]>;
  martech_analysis?: any;
  challenges?: any;
  tech_stack?: any;
  tp_alignment?: any;
  generated_at?: string;
};
