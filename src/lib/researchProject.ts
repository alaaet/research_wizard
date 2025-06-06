// ResearchProject data model and utilities

export interface ResearchProject {
  uid: string;
  title: string;
  keywords?: string[];
  description?: string;
  research_questions?: string[];
  status?: string; // New field
  created_at?: string;
  updated_at?: string;
}

// Define and export an array of predefined status options
export const PROJECT_STATUSES = [
  'Not Started',
  'Planning',
  'Data Collection',
  'Analysis',
  'Writing',
  'Submitted',
  'Completed',
  'On Hold'
] as const; // Use 'as const' for stricter typing if desired

export type ProjectStatus = typeof PROJECT_STATUSES[number]; // Optional: type for status

// UID generation (16-character cryptographically strong)
export function generateUID(): string {
  // Use crypto if available (browser/Node)
  if (typeof window !== 'undefined' && window.crypto) {
    return Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
  } else {
    // Fallback for Node.js
    return require('crypto').randomBytes(8).toString('hex');
  }
} 