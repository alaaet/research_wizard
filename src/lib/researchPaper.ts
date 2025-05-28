export interface research_paper {
  uid: string;
  project_uid?: string | null; // Usually added on backend before DB insert, can be optional here
  title: string;
  url: string; // Stores web URL or file path
  summary?: string | null;
  publishedDate?: string | Date | null; // Allow string for form input, Date for objects, null for DB
  author?: string | null;
  score?: number | null;
  sourceQuery?: string | null;
  index?: number | null; // For ordering
  // No resource_type field
}