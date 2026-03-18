'use server';
/**
 * @fileOverview An AI troubleshooting tool for video link extraction failures.
 *
 * - troubleshootLinkExtraction - A function that analyzes why a video link resolver failed.
 * - AiLinkExtractionTroubleshooterInput - The input type for the troubleshootLinkExtraction function.
 * - AiLinkExtractionTroubleshooterOutput - The return type for the troubleshootLinkExtraction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const AiLinkExtractionTroubleshooterInputSchema = z.object({
  failedUrl: z.string().url().describe('The URL that the video link resolver failed to process.'),
  errorMessage: z.string().describe('The error message or reason for the failure provided by the video link resolver.'),
  additionalContext: z.string().optional().describe('Any additional context or details about the failure, such as HTTP response headers or specific known limitations.'),
});
export type AiLinkExtractionTroubleshooterInput = z.infer<typeof AiLinkExtractionTroubleshooterInputSchema>;

// Output Schema
const AiLinkExtractionTroubleshooterOutputSchema = z.object({
  analysis: z.string().describe('A detailed explanation of why the video link extraction likely failed, considering common issues like DRM, authentication, CORS, or unsupported server features.'),
  suggestions: z.array(z.string()).describe('A list of actionable suggestions or alternative methods the user can try to resolve the issue or obtain the video link.'),
  potentialIssues: z.array(z.enum([
    'DRM_PROTECTED',
    'AUTHENTICATION_REQUIRED',
    'CORS_BLOCKED',
    'NO_RANGE_SUPPORT',
    'GEO_RESTRICTED',
    'TEMPORARY_LINK_EXPIRED',
    'EMBED_ONLY',
    'INVALID_URL_FORMAT',
    'WEBPAGE_SCRAPING_FAILED',
    'UNKNOWN_ISSUE'
  ])).describe('A list of identified potential technical issues that led to the failure.').optional(),
});
export type AiLinkExtractionTroubleshooterOutput = z.infer<typeof AiLinkExtractionTroubleshooterOutputSchema>;

// Wrapper function
export async function troubleshootLinkExtraction(input: AiLinkExtractionTroubleshooterInput): Promise<AiLinkExtractionTroubleshooterOutput> {
  return aiLinkExtractionTroubleshooterFlow(input);
}

// Define the prompt
const aiLinkExtractionTroubleshooterPrompt = ai.definePrompt({
  name: 'aiLinkExtractionTroubleshooterPrompt',
  input: {schema: AiLinkExtractionTroubleshooterInputSchema},
  output: {schema: AiLinkExtractionTroubleshooterOutputSchema},
  prompt: `You are an expert AI assistant specialized in troubleshooting video link extraction failures.
Your goal is to analyze why a given video URL failed to resolve into a playable MP4 stream and provide clear, actionable insights and suggestions.

The user attempted to extract a video from the following URL:
URL: {{{failedUrl}}}

The error message received from the video resolver was:
Error Message: {{{errorMessage}}}

{{#if additionalContext}}
Additional context provided:
{{{additionalContext}}}
{{/if}}

Based on this information, provide:
1. A detailed analysis of the likely reasons for the failure. Consider common issues such as:
   - Digital Rights Management (DRM) protection
   - Required authentication or login
   - Cross-Origin Resource Sharing (CORS) restrictions
   - Server not supporting HTTP Range requests (preventing partial downloads)
   - Geo-restrictions
   - Temporary link expiration (e.g., signed URLs from cloud storage)
   - Video being embedded only and not directly accessible
   - Incorrect or malformed URL
   - Webpage structure changes preventing scraping
   - General network issues
2. A list of actionable suggestions for the user to try and resolve the issue or gather more information.
3. A list of specific technical issues (potentialIssues) that best categorize the problem. Choose from: DRM_PROTECTED, AUTHENTICATION_REQUIRED, CORS_BLOCKED, NO_RANGE_SUPPORT, GEO_RESTRICTED, TEMPORARY_LINK_EXPIRED, EMBED_ONLY, INVALID_URL_FORMAT, WEBPAGE_SCRAPING_FAILED, UNKNOWN_ISSUE.

Format your response strictly as a JSON object matching the provided output schema.`,
});

// Define the flow
const aiLinkExtractionTroubleshooterFlow = ai.defineFlow(
  {
    name: 'aiLinkExtractionTroubleshooterFlow',
    inputSchema: AiLinkExtractionTroubleshooterInputSchema,
    outputSchema: AiLinkExtractionTroubleshooterOutputSchema,
  },
  async (input) => {
    const {output} = await aiLinkExtractionTroubleshooterPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate troubleshooting output.');
    }
    return output;
  }
);
