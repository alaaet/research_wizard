// // --- Report Synthesis --- (MODIFIED with Timeout Logic)

// import { ResearchDraftOutline } from "../../src/lib/researchDraftOutline";
// import { generateSectionParagraph } from "../ai_client";

// /**
//  * Synthesizes the full report, handling paragraph retries and overall timeout.
//  */
// async function synthesizeReport(
//     topic: string,
//     outline: ResearchDraftOutline,
//     indexedSearchResults: { index: number; title: string; url: string; text: string }[],
//     minWords: number,
//     maxWords: number,
//     timeoutMs = 2000, // Use configured timeout
//     delayBetweenCalls = 1000 // Default delay between calls
//   ) {
//     console.log(
//       `Synthesizing report section by section (Timeout: ${
//         timeoutMs / 60000
//       } minutes)...`
//     );
//     const startTime = Date.now();
//     let timedOut = false;
  
//     if (!outline || !outline.title || !outline.sections)
//       return "[Error: Invalid outline]";
//     if (!indexedSearchResults || indexedSearchResults.length === 0)
//       return `[Error: No search results for "${topic}"]`;
  
//     let fullReport = `# ${outline.title}\n\n`;
//     const allCitedIndices = new Set<number>();
  
//     // Use labelled loops for easier breaking on timeout
//     outerLoop: for (const section of outline.sections) {
//       fullReport += `## ${section.title}\n\n`;
//       if (section.subsections && Array.isArray(section.subsections)) {
//         for (const subsection of section.subsections) {
//           // --- Timeout Check ---
//           const elapsedTime = Date.now() - startTime;
//           if (elapsedTime > timeoutMs) {
//             console.warn(
//               `!!! Report generation timeout reached (${
//                 timeoutMs / 60000
//               } min) !!!`
//             );
//             timedOut = true;
//             fullReport += `\n\n[REPORT GENERATION TIMED OUT - Subsequent content may be missing]\n`;
//             break outerLoop; // Break both loops
//           }
//           // ---------------------
  
//           fullReport += `### ${subsection}\n\n`;
  
//           // Call the paragraph generator (which handles its own retries)
//           const result = await generateSectionParagraph(
//             topic,
//             section.title,
//             subsection,
//             indexedSearchResults,
//             minWords,
//             maxWords
//             // Retries configured via MAX_PARAGRAPH_RETRIES, RETRY_DELAY_MS
//           );
  
//           fullReport += `${result.text}\n\n`; // Append text (success or failure message)
//           if (result.success) {
//             result.citedIndices.forEach((index: number) => allCitedIndices.add(index));
//           }
  
//           // Optional delay between *successful* or *failed* paragraph attempts
//           const elapsedTimeAfter = Date.now() - startTime;
//           if (elapsedTimeAfter < timeoutMs) {
//             // Only sleep if not timed out
//             console.log(
//               `   Waiting ${delayBetweenCalls}ms before next paragraph...`
//             );
//             await sleep(delayBetweenCalls);
//           }
//         }
//       } else {
//         console.warn(`Section "${section.title}" has no subsections.`);
//         fullReport += `[No subsections defined for this section]\n\n`;
//       }
//     } // End outerLoop
  
//     if (timedOut) {
//       console.log("Report generation finished due to timeout.");
//     } else {
//       console.log("Finished generating all paragraphs.");
//     }
  
//     // --- Generate References Section ---
//     fullReport += `## References\n\n`;
//     if (allCitedIndices.size > 0) {
//       const sortedIndices = Array.from(allCitedIndices).sort((a, b) => a - b);
//       sortedIndices.forEach((index) => {
//         const result = indexedSearchResults.find((r: any) => r.index === index);
//         if (result && result.url) {
//           // Format as: [index] [URL](URL)
//           fullReport += `[${index} ${result?.title || result?.url}](${result.url})\n \n`;
//           // fullReport += `[<span class="math-inline">${index}\] \[${result.title}\]\(</span>${result.url})\n \n`;
//         } else {
//           // Keep the fallback if URL is somehow missing
//           fullReport += `[${index}] URL not found\n`;
//         }
//       });
//     } else {
//       fullReport += timedOut
//         ? "No sources were cited in the generated portion of the report.\n"
//         : "No sources were cited in the generated report.\n";
//     }
  
//     console.log("Report synthesis complete.");
//     return fullReport;
//   }
  
//   function sleep(ms: number) {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }

//   export { synthesizeReport };