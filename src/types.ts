export type WorkType = "Remote" | "WFO" | "Hybrid";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string; // Bangalore, Kochi, Mumbai, Delhi NCR, Chennai, Hyderabad, Pune, Kolkata, Remote, etc.
  workType: WorkType;
  description: string;
  skills: string[];
  salaryRange?: string;
  experienceLevel: string; // "Entry Level" | "Mid Level" | "Senior Level" | "Lead / Manager"
  postedDate: string; // YYYY-MM-DD
  portalSource: string; // LinkedIn, Naukri, Indeed, Glassdoor, AmbitionBox, Company Portal, etc.
  applyUrl: string;
}

export interface LocationStats {
  location: string;
  count: number;
  WFO: number;
  Remote: number;
  Hybrid: number;
}

export interface SearchFilters {
  query: string;
  location: string; // "All" or specific location
  workType: string;  // "All", "Remote", "WFO", "Hybrid"
  experienceLevel: string; // "All", "Entry Level", "Mid Level", "Senior Level", "Lead"
  dateRange: string; // "All" | "Past 24 Hours" | "Past Week" | "Past Month"
}

export interface SearchApiResponse {
  success: boolean;
  jobs: Job[];
  source: "database" | "ai_live";
  error?: string;
}

export interface PersonProfile {
  id: string;
  name: string;
  role: string;
  organization: string;
  location: string;
  skills: string[];
  linkedinUrl: string;
  avatarInitials: string;
}

export interface ResearchOpening {
  id: string;
  title: string;
  institution: string;
  location: string;
  department: string;
  focusArea: string;
  stipend: string;
  deadline: string;
  applyUrl: string;
  eligibility: string;
}

export interface NewsUpdate {
  id: string;
  title: string;
  date: string;
  source: string;
  summary: string;
  linkedinTemplate: string;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  duration: string;
  level: string;
  skills: string[];
  url: string;
  certType: string;
}
