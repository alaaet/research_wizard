export interface ResearchDraftOutline {
  title: string;
  sections: {
    title: string;
    subsections: string[];
  }[];
}

// Example of expected output:
// {
//   title: "Report Title",
//   sections: [
//     {
//       title: "Section 1 Title",
//       subsections: ["Subsection 1.1 Title", "Subsection 1.2 Title"]
//     },
//     // ... more sections ...
//   ]
// } 