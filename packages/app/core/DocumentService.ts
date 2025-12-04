import type {
  DocumentRepository,
  DocumentTemplateRepository,
  Document,
  NewDocument,
  GeneratedBy,
} from "@ai-starter/core";
import type { FileStorage } from "@ai-starter/core";
import { executeTemplate } from "./utils/executeTemplate";
import { notFound, badImplementation } from "@hapi/boom";

export interface Deps {
  repos: {
    document: DocumentRepository;
    documentTemplate: DocumentTemplateRepository;
  };
  storage: FileStorage;
}

export interface GenerateFromTemplateProps {
  matterId: string;
  templateId: string;
  data: unknown;
  name: string;
  generatedBy?: GeneratedBy;
}

export interface CreateAdHocDocumentProps {
  matterId: string;
  name: string;
  content: Buffer | string;
  mimeType: string;
  generatedBy?: GeneratedBy;
  metadata?: unknown;
}

export const DocumentService = (deps: Deps) => {
  const { repos, storage } = deps;

  return {
    getDocument: repos.document.get,
    listByMatter: repos.document.listByMatter,

    async getDocumentContent(documentId: string): Promise<Buffer> {
      const document = await repos.document.get(documentId);
      if (!document) {
        throw notFound(`Document with ID ${documentId} not found`);
      }

      return await storage.read(document.storagePath);
    },

    async deleteDocument(documentId: string): Promise<void> {
      const document = await repos.document.get(documentId);
      if (!document) {
        throw notFound(`Document with ID ${documentId} not found`);
      }

      // Delete file from storage
      try {
        await storage.delete(document.storagePath);
      } catch (error) {
        // Log error but continue with database deletion
        console.error(`Failed to delete file ${document.storagePath}:`, error);
      }

      // Delete database record
      await repos.document.delete(documentId);
    },

    async generateFromTemplate(
      props: GenerateFromTemplateProps
    ): Promise<Document> {
      const { matterId, templateId, data, name, generatedBy = "agent" } = props;

      // Get template
      const template = await repos.documentTemplate.get(templateId);
      if (!template) {
        throw notFound(`Document template with ID ${templateId} not found`);
      }

      // Execute template
      const result = await executeTemplate({
        template,
        data,
        timeout: 30000,
      });

      if (result.error) {
        throw badImplementation(`Template execution failed: ${result.error}`);
      }

      // Determine file extension from output format
      const extension = getFileExtension(template.outputFormat);
      const storagePath = `documents/${matterId}/${templateId}.${extension}`;

      // Write to storage
      const content =
        typeof result.output === "string" ? result.output : result.output;
      await storage.write(storagePath, content);

      // Create document record
      const documentData: NewDocument = {
        matterId,
        templateId,
        name,
        mimeType: getMimeType(template.outputFormat),
        storagePath,
        fileSize: Buffer.byteLength(content),
        generatedBy,
        metadata: {
          templateName: template.name,
          executionLogs: result.logs,
        },
      };

      return await repos.document.create(documentData);
    },

    async createAdHocDocument(
      props: CreateAdHocDocumentProps
    ): Promise<Document> {
      const {
        matterId,
        name,
        content,
        mimeType,
        generatedBy = "user",
        metadata,
      } = props;

      // Generate storage path
      const extension = getExtensionFromMimeType(mimeType);
      const storagePath = `documents/${matterId}/${Date.now()}.${extension}`;

      // Write to storage
      await storage.write(storagePath, content);

      // Create document record
      const documentData: NewDocument = {
        matterId,
        templateId: null,
        name,
        mimeType,
        storagePath,
        fileSize: Buffer.byteLength(content),
        generatedBy,
        metadata,
      };

      return await repos.document.create(documentData);
    },
  };
};

export type DocumentService = ReturnType<typeof DocumentService>;

// Helper functions
function getFileExtension(outputFormat: string): string {
  switch (outputFormat) {
    case "csv":
      return "csv";
    case "xlsx":
      return "xlsx";
    case "html":
      return "html";
    case "json":
      return "json";
    case "text":
      return "txt";
    default:
      return "txt";
  }
}

function getMimeType(outputFormat: string): string {
  switch (outputFormat) {
    case "csv":
      return "text/csv";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "html":
      return "text/html";
    case "json":
      return "application/json";
    case "text":
      return "text/plain";
    default:
      return "text/plain";
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  if (mimeType === "text/csv") return "csv";
  if (mimeType === "text/html") return "html";
  if (mimeType === "application/json") return "json";
  if (mimeType === "text/plain") return "txt";
  if (mimeType.includes("spreadsheetml")) return "xlsx";
  return "txt";
}
