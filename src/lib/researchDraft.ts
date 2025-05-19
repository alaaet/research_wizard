import { ResearchDraftOutline } from "./researchDraftOutline";

export interface ResearchDraft {
  uid: string;
  project_uid: string;
  title: string;
  outline: ResearchDraftOutline;
  report?: string; // Large formatted text
  created_at: string;
  updated_at?: string;
} 