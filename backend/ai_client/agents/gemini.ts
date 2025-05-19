import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai";
import type { AIAgent } from '../../../shared/aiAgentTypes';
import { getAIAgentBySlug } from '../../database';
import { BaseAIAgent } from './BaseAIAgent';

const GOOGLE_AI_LITE_MODEL = 'gemini-1.5-flash';

// Safety settings configuration for Google AI
const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

export class GeminiAgent extends BaseAIAgent {
    private client: GoogleGenerativeAI;

    static async create() {
        const agent = (await getAIAgentBySlug('gemini')) as AIAgent;
        if (!agent || !agent.key_value) {
            throw new Error('Google API key for Gemini not found in database.');
        }
        return new GeminiAgent(agent);
    }

    private constructor(agent: AIAgent) {
        super();
        this.client = new GoogleGenerativeAI(agent.key_value);
    }

    async getLLMResponse({
        system = "You are a helpful assistant.",
        user = "",
        temperature = 0.7,
        model = GOOGLE_AI_LITE_MODEL, // Use appropriate default
      }) {
        try {
            if (!user) {
                throw new Error('User prompt is required.');
            }
          const generativeModel = this.client.getGenerativeModel({ model, safetySettings});
          const fullPrompt = `${system}\n\n---\n\nUser Prompt:\n${user}`;
      
          // console.log(`--- Sending request to ${model} ---`); // Optional: Log request start
          const result = await generativeModel.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig: { temperature },
          });
          // console.log(`--- Received response from ${model} ---`); // Optional: Log request end
      
          const response = result.response;
      
          // --- Stricter Error Handling ---
          if (!response) {
            // This case might indicate a network error or severe API issue
            console.log(`LLM call to ${model} failed: No response object.`);
            throw new Error(`LLM call failed: No response object.`); // Throw for retry
          }
      
          // Check for blocking first
          if (response.promptFeedback?.blockReason) {
            const reason = response.promptFeedback.blockReason;
            console.log(
              `LLM content blocked for model ${model}. Reason: ${reason}`
            );
            // Decide if blocking is retryable (maybe sometimes?) - for now, treat as non-retryable failure for the paragraph
            return `[LLM response blocked due to ${reason}]`;
          }
      
          // Check candidate structure and finish reason
          if (
            !response.candidates ||
            response.candidates.length === 0 ||
            !response.candidates[0].content
          ) {
            const finishReason = response.candidates?.[0]?.finishReason;
            console.log(
              `LLM call to ${model} returned invalid structure or no content. Finish Reason: ${
                finishReason || "N/A"
              }`
            );
            // Treat finish reasons like SAFETY or RECITATION as non-retryable paragraph failures
            if (finishReason && finishReason !== "STOP") {
              return `[LLM generation stopped due to ${finishReason}]`;
            }
            // Otherwise, might be a temporary issue - throw to allow retry
            throw new Error(
              `LLM call failed: Invalid response structure. Finish Reason: ${
                finishReason || "N/A"
              }`
            );
          }
      
          // Assuming text is in the first part
          const textContent = response.candidates[0].content.parts?.[0]?.text;
          if (textContent === undefined || textContent === null) {
            // Check specifically for missing text
            console.log(
              `LLM call to ${model} response structure OK but no text content.`
            );
            throw new Error(`LLM call failed: No text content in response.`); // Throw for retry
          }
      
          return textContent.trim(); // Success
        } catch (error) {
          // Log the caught error from the API call itself
          let message = '';
          if (error instanceof Error) {
            message = error.message;
            console.log(
              `Error during Google Generative AI call (Model: ${model}):`,
              message
            );
            if (
              message.includes("503") ||
              message.toLowerCase().includes("network") ||
              message.toLowerCase().includes("timeout")
            ) {
              console.warn(
                `-> Suggesting retry for model ${model} due to error: ${message}`
              );
              throw error; // Rethrow the original error to signal a retry is needed
            } else {
              console.log(`-> Non-retryable error for model ${model}.`);
              return `[Error generating LLM response: ${message}]`;
            }
          } else {
            message = String(error);
            console.log(
              `Error during Google Generative AI call (Model: ${model}):`,
              message
            );
            return `[Error generating LLM response: ${message}]`;
          }
        }
      }
}
