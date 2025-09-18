export type AccountMapLane = "Marketing" | "Media and Advertising" | "Content and Creative" | "Social Media" | "Brand" | "CRM" | "MarTech" | "Analytics & Data" | "Customer Strategy";

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

export type MarTechStack = {
  total_technologies: number;
  martech_technologies: Array<{
    uid: string;
    name: string;
    category: string;
  }>;
  categories: string[];
  top_categories: Array<{
    category: string;
    count: number;
  }>;
};

export type TechnologyCategories = {
  [category: string]: Array<{
    name: string;
    uid: string;
  }>;
};

export type ProspectResult = {
  company: Company;
  accountMap: Record<AccountMapLane, Person[]>;
  articles?: Article[];
  child_brands?: ChildBrands;
  technology_stack?: TechnologyStack;
  martech_stack?: MarTechStack;
  technology_categories?: TechnologyCategories;
  generated_at?: string;
};
