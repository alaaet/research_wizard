import { getUserMetaDataByKey, listAIAgents, getResourcesForProject } from '../database';
import type { AIAgent } from '../../shared/aiAgentTypes';

/**
 * Processes a query by routing it to the active AI agent.
 * @param params - { user: string, system?: string, temperature?: number, model?: string }
 * @returns {Promise<string>} - The LLM response or error message
 */
export async function processQuery(params: {
  user: string;
  system?: string;
  temperature?: number;
  model?: string;
  skipLanguageForceSet?: boolean;
}) {
  try {
    const defaultTemperature: number = await getUserMetaDataByKey('TEMPERATURE') as number || 0.7;
    console.log('defaultTemperature:', defaultTemperature);
    if (!params.temperature) {
      params.temperature = defaultTemperature;
    }
    if (!params.skipLanguageForceSet) {
    const defaultLanguage: string = await getUserMetaDataByKey('research_language') as string || 'English';
    params.user += `\n\n Please respond in ${defaultLanguage} language`;
    }
    // Get the active AI agent
    const agents = await listAIAgents() as AIAgent[];
    const activeAgent = agents.find((a: AIAgent) => a.is_active);
    if (!activeAgent) {
      throw new Error('No active AI agent found.');
    }
    const slug = activeAgent.slug;
    const preselectedModel = activeAgent.selected_model;
    if (!params.model) {
      params.model = preselectedModel;
    }
    // Dynamically import the agent class from the agents folder
    let AgentClass;
    switch (slug) {
      case 'gemini': {
        // Import GeminiAgent
        const mod = await import('./agents/gemini');
        AgentClass = mod.GeminiAgent;
        break;
      }
      case 'openai': {
        // Import OpenAIAgent
        const mod = await import('./agents/openai');
        AgentClass = mod.OpenAIAgent;
        break;
      }
      case 'claude': {
        // Import ClaudeAIAgent
        const mod = await import('./agents/claude');
        AgentClass = mod.ClaudeAIAgent;
        break;
      }
      // Add more cases for other agents as you implement them
      default:
        throw new Error(`AI agent '${slug}' is not supported.`);
    }
    // Instantiate the agent using its static create method
    const agent = await AgentClass.create();
    // Send the query to the agent's getLLMResponse method
    const response = await agent.getLLMResponse(params);
    return response;
  } catch (err) {
    let message = '';
    if (err instanceof Error) {
      message = err.message;
    } else {
      message = String(err);
    }
    return `[AI Error: ${message}]`;
  }
}

export async function generateResearchKeywordsFromTopic(topic: string) {
  const response = await processQuery({
    user: `Generate 5 academic research keywords for the topic: ${topic}, the keywords should be three words or less, the keywords should be in the form of a new line separated list with no numbers, the response should only contain the keywords`,
  });
  const keywords = response.split('\n').map(line => line.trim());
  console.log('Generated keywords:', keywords);
  return keywords.filter(keyword => keyword.length > 0);
}

export async function generateResearchQuestionsFromTopic(topic: string) {
  const response = await processQuery({
    user: `Generate 5 research questions for the topic: ${topic}, the questions should be in the form of a new line separated list with no numbers, the response should only contain the questions`,
  });
  const questions = response.split('\n').map(line => line.trim());
  console.log('Generated questions:', questions);
  return questions.filter(question => question.length > 0);
}

export async function generateResearchQueriesFromQuestions(questions: string[]) {
  const response = await processQuery({
    user: `Generate 5 research queries for the questions: ${questions.join(', ')}, the queries should be in the form of a new line separated list with no numbers, the response should only contain the queries`,
  });
  const queries = response.split('\n').map(line => line.trim());
  console.log('Generated queries:', queries);
  return queries.filter(query => query.length > 0);
}

export async function generateProjectDescription(topic: string) {
  const response = await processQuery({
    user: `Generate a description for a research project on the topic: ${topic}, the description should be a set of short paragraphs (100 words or less each), the response should only contain the description`,
  });
  return response;
}

export async function generateProjectOutline(
  topic: string,
  language: string = 'English'
) {
  const minSections: number = await getUserMetaDataByKey('MIN_SECTIONS_PER_REPORT') as number || 5;
  const maxSections: number = await getUserMetaDataByKey('MAX_SECTIONS_PER_REPORT') as number || 10;
  const minSubSections: number = await getUserMetaDataByKey('MIN_SUBSECTIONS_PER_SECTION') as number || 2;
  const maxSubSections: number = await getUserMetaDataByKey('MAX_SUBSECTIONS_PER_SECTION') as number || 5;
  console.log('minSections:', minSections);
  console.log('maxSections:', maxSections);
  console.log('minSubSections:', minSubSections);
  console.log('maxSubSections:', maxSubSections);
  console.log('Generating report outline...');
  const prompt = `Create a logical outline for a research report on the topic: "${topic}".\nThe outline should be structured as a JSON object with the following format:\n{\n  "title": "Report Title",\n  "sections": [ /* Aim for ${minSections}-${maxSections} sections */\n    {\n      "title": "Section 1 Title",\n      "subsections": [ /* Aim for ${minSubSections}-${maxSubSections} subsections */\n        "Subsection 1.1 Title", "Subsection 1.2 Title" /* ... */\n      ]\n    } /* ... more sections ... */\n  ]\n}\nEnsure the titles are descriptive and cover key aspects of the topic. while the JSON property keys should always be in English, the values should be *only* in ${language} language with the valid JSON object, without any introductory text, comments, or explanations.`;

  const system = `You are a research planning assistant. Generate a structured report outline in JSON format based on the user's topic. Output only the JSON values and nothing else in ${language} language, keep the keys always in English.`;

  const response = await processQuery({
    user: prompt,
    system,
    skipLanguageForceSet: true,
  });

  if (response.startsWith('[Error') || response.startsWith('[AI')) {
    console.error('Failed to generate outline due to LLM error:', response);
    return null;
  }

  try {
    const jsonString = response
      .replace(/```json\n?/, '')
      .replace(/```$/, '')
      .trim();
    const outline = JSON.parse(jsonString);
    if (outline && outline.title && Array.isArray(outline.sections)) {
      console.log('Outline generated successfully.');
      return outline;
    } else {
      console.error('Generated outline has an invalid structure:', outline);
      return null;
    }
  } catch (error) {
    console.error('Failed to parse generated outline JSON:', error);
    console.error('LLM Response was:', response);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export async function generateSectionParagraph(
  projectId: string,
  topic: string,
  sectionTitle: string,
  subsectionTitle: string,
  language: string = 'English',
  model: string = '',
): Promise<{ success: boolean; text: string; citedIndices: number[] }> {
  const minWords: number = await getUserMetaDataByKey('MIN_WORDS_PER_PARAGRAPH') as number || 250;
  const maxWords: number = await getUserMetaDataByKey('MAX_WORDS_PER_PARAGRAPH') as number || 1500;
  const maxRetries: number = await getUserMetaDataByKey('MAX_PARAGRAPH_RETRIES') as number || 2;
  const retryDelay: number = await getUserMetaDataByKey('RETRY_DELAY_MS') as number || 5000;
  const contentSlice = 1000;

  console.log(
    `   Generating paragraph for: ${sectionTitle} -> ${subsectionTitle}`
  );

  const papers = (await getResourcesForProject(projectId)) as any[];
  const inputData = papers.map((item) => ({
    index: item.index,
    url: item.url,
    text: item.summary,
  }))
    .map(
      (item) =>
        `--START ITEM ${item.index}--\nURL: ${item.url}\nCONTENT: ${
          item.text
            ? item.text.slice(0, contentSlice)
            : '[Content not available]'
        }\n--END ITEM ${item.index}--\n`
    )
    .join('\n');

  const userPrompt = `You are writing a research report on "${topic}". Outline context: ${sectionTitle} -> ${subsectionTitle}. ${inputData?.length > 0 ? 'Available Information (Input Data):\n' + inputData : ''} \nInstructions:\n1. Write a single, coherent paragraph or multiple paragraphs focusing *only* on subsection "${subsectionTitle}" in ${language} language.\n2. Length: ${minWords}-${maxWords} words (STRICTLY ENFORCED).\n3. Base paragraph/paragraphs *strictly* on Input Data unless the Input Data is not relevant to the subsection, format the output text by including bullet points and other formatting to make it more readable.\n4. Synthesize from multiple sources if relevant.\n5. Cite sources using footnote notation ([index]).\n6. You MUST include at least one citation.\n7. After the paragraph, on a NEW line, if there are cited sources, list cited source indices: "Cited sources: [index1, index2, ...]".\n8. If you cannot meet the word count or citation requirements, explain why in the response.\nBegin paragraph now:`;

  const system = `You are a meticulous research assistant writing a specific paragraph for a report. Follow all instructions precisely: topic focus, word count (${minWords}-${maxWords}), strict adherence to provided data, citation format ([index]), and the final "Cited sources: [...]" line. You must include at least one citation and meet the word count requirements.`;

  let attempts = 0;
  let currentDelay = retryDelay;

  while (attempts <= maxRetries) {
    attempts++;
    try {
      console.log(
        `      Attempt ${attempts}/${
          maxRetries + 1
        } for "${subsectionTitle}"...`
      );
      const llmResponse = await processQuery({
        model,
        system,
        user: userPrompt,
      });

      if (llmResponse.startsWith('[Error') || llmResponse.startsWith('[AI') || llmResponse.startsWith('[LLM')) {
        console.error(
          `      Failed attempt ${attempts} for "${subsectionTitle}": ${llmResponse}`
        );
        if (attempts > maxRetries) {
          return {
            success: false,
            text: `[Paragraph generation failed after ${attempts} attempts: ${llmResponse}]`,
            citedIndices: [],
          };
        }
        throw new Error(llmResponse);
      }

      // --- Parse successful response ---
      const lines = llmResponse.split('\n');
      let paragraph = '';
      let citedIndices: number[] = [];
      const citedLineIndex = lines.findIndex((line) =>
        line.trim().startsWith('Cited sources: [')
      );

      if (citedLineIndex !== -1) {
        paragraph = lines.slice(0, citedLineIndex).join('\n').trim();
        const citedLine = lines[citedLineIndex].trim();
        try {
          const indicesMatch = citedLine.match(/\[(.*?)\]/);
          if (indicesMatch && indicesMatch[1].trim() !== '') {
            citedIndices = indicesMatch[1]
              .split(',')
              .map((s) => parseInt(s.trim(), 10))
              .filter((n) => !isNaN(n));
          } else if (!indicesMatch) {
            console.warn(
              `      Could not parse cited indices from line: "${citedLine}" for "${subsectionTitle}"`
            );
          }
        } catch (parseError) {
          console.warn(
            `      Error parsing cited indices from line "${citedLine}" for "${subsectionTitle}":`,
            parseError
          );
        }
      } else {
        console.warn(
          `      "Cited sources: [...]" line not found in response for "${subsectionTitle}". Assuming entire response is paragraph.`
        );
        paragraph = llmResponse;
      }

      // Word count validation with stricter enforcement
      const wordCount = paragraph.split(/\s+/).filter(Boolean).length;
      if (wordCount < minWords || wordCount > maxWords) {
        console.warn(
          `      Generated paragraph word count (${wordCount}) for "${subsectionTitle}" outside target range (${minWords}-${maxWords}). Retrying...`
        );
        if (attempts <= maxRetries) {
          throw new Error(`Word count ${wordCount} outside required range ${minWords}-${maxWords}`);
        }
      }

      // Citation validation
      if (citedIndices.length === 0) {
        console.warn(
          `      No citations found in response for "${subsectionTitle}". Retrying...`
        );
        if (attempts <= maxRetries) {
          throw new Error('No citations found in response');
        }
      }

      console.log(
        `      Successfully generated paragraph for "${subsectionTitle}" on attempt ${attempts}.`
      );
      console.log(`\n---------------------------------- \n       Paragraph: ${paragraph} \n---------------------------------- \n \n`);
      return { success: true, text: paragraph, citedIndices: citedIndices };
    } catch (error: any) {
      console.warn(
        `      Attempt ${attempts} failed for "${subsectionTitle}". Error: ${error.message}`
      );
      if (attempts > maxRetries) {
        console.error(
          `      Maximum retries (${maxRetries}) reached for "${subsectionTitle}". Giving up.`
        );
        return {
          success: false,
          text: `[Paragraph generation failed after ${attempts} attempts: ${error.message}]`,
          citedIndices: [],
        };
      } else {
        console.log(
          `      Waiting ${currentDelay}ms before retrying "${subsectionTitle}"...`
        );
        await sleep(currentDelay);
        currentDelay *= 2;
      }
    }
  }
  return {
    success: false,
    text: `[Paragraph generation failed unexpectedly for "${subsectionTitle}"]`,
    citedIndices: [],
  };
}


