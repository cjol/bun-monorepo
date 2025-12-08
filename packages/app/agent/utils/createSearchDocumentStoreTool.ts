import { tool } from "ai";
import { z } from "zod";

export interface DocumentSearchResult {
  title: string;
  fullText: string;
}

export interface SearchDocumentStoreResult {
  results: DocumentSearchResult[];
  totalResults: number;
  query: string;
}

/**
 * Creates a tool that allows the agent to search the document store.
 * Currently uses a mock implementation that returns simulated search results.
 */
export function createSearchDocumentStoreTool() {
  return tool({
    description:
      "Search the document management system for relevant documents. Use this to find contracts, engagement letters, correspondence, or other documents that may provide context for time entries or matter work.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "The search query to find relevant documents. Can include keywords, phrases, or document names."
        ),
    }),
    execute: async ({ query }) => {
      // Mock implementation - simulate realistic search delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Return mock results that look realistic
      // In production, this would query an actual document store
      const mockResults: DocumentSearchResult[] = [
        {
          title: "Engagement Letter - Initial Consultation",
          fullText: `This engagement letter confirms the terms of our legal representation regarding the matter referenced above. Our firm agrees to provide legal services in connection with ${query}. The scope of our engagement includes initial consultation, document review, and preliminary legal analysis. Billing will be conducted on an hourly basis according to the fee schedule provided separately.`,
        },
        {
          title: "Client Correspondence - Project Update",
          fullText: `Dear Client, Please find below an update on the current status of your matter. Following our recent discussions regarding ${query}, we have completed the initial review phase and identified several key areas requiring attention. Our team has logged approximately 12.5 hours of work this billing period. Please let us know if you have any questions.`,
        },
        {
          title: "Internal Memo - Matter Strategy",
          fullText: `PRIVILEGED AND CONFIDENTIAL. This memorandum outlines the recommended strategy for addressing ${query}. Based on our analysis, we suggest a phased approach beginning with document collection and review. Key considerations include regulatory compliance requirements and stakeholder communication protocols.`,
        },
      ];

      return {
        results: mockResults,
        totalResults: mockResults.length,
        query,
      } satisfies SearchDocumentStoreResult;
    },
  });
}
