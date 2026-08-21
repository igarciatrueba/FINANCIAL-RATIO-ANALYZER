import { createHash, randomUUID } from "node:crypto";
import { extname } from "node:path";
import { z } from "zod";

import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AuthorizationService } from "@/server/services/authorization-service";
import type { StorageService } from "@/server/storage/types";

const allowedMimeTypes = new Set(["application/pdf", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const maximumFileSizeBytes = 20 * 1024 * 1024;
const fileUploadSchema = z.object({
  companyId: z.string().uuid().optional(),
  originalFilename: z.string().trim().min(1).max(512),
  mimeType: z.string().min(1).max(255),
  category: z.enum(["financial_input", "source_document", "import", "report"]),
  body: z.instanceof(Uint8Array),
}).strict();

function safeExtension(filename: string) {
  const extension = extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return extension.slice(0, 16);
}

export function createPrivateStorageKey(workspaceId: string, companyId: string | undefined, originalFilename: string) {
  const companySegment = companyId ? `companies/${companyId}` : "workspace-files";
  return `workspaces/${workspaceId}/${companySegment}/${randomUUID()}${safeExtension(originalFilename)}`;
}

export class FileService {
  private readonly authorization: AuthorizationService;

  constructor(private readonly repository: BackendRepository, private readonly storage: StorageService) {
    this.authorization = new AuthorizationService(repository);
  }

  async upload(actorUserId: string, workspaceId: string, input: unknown) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-files");
    const parsedInput = fileUploadSchema.safeParse(input);
    if (!parsedInput.success) throw new AppError("VALIDATION_ERROR", "The file metadata is not valid.");
    const upload = parsedInput.data;
    if (upload.companyId) await this.authorization.requireCompanyAccess(actorUserId, workspaceId, upload.companyId, "manage-files");
    if (upload.originalFilename.includes("/") || upload.originalFilename.includes("\\")) throw new AppError("VALIDATION_ERROR", "The original filename is not valid.");
    if (!allowedMimeTypes.has(upload.mimeType)) throw new AppError("VALIDATION_ERROR", "This file type is not allowed.");
    if (upload.body.byteLength === 0 || upload.body.byteLength > maximumFileSizeBytes) throw new AppError("VALIDATION_ERROR", "The file size is outside the allowed limit.");
    const storageKey = createPrivateStorageKey(workspaceId, upload.companyId, upload.originalFilename);
    const checksum = createHash("sha256").update(upload.body).digest("hex");
    await this.storage.upload({ key: storageKey, body: upload.body, mimeType: upload.mimeType });
    try {
      const file = await this.repository.createFileMetadata({ workspaceId, companyId: upload.companyId, uploadedBy: actorUserId, originalFilename: upload.originalFilename, storageKey, mimeType: upload.mimeType, sizeBytes: upload.body.byteLength, category: upload.category, checksum });
      await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId: upload.companyId, eventType: "file.uploaded", entityType: "file", entityId: file.id });
      return file;
    } catch (error) {
      await this.storage.delete(storageKey);
      throw error;
    }
  }

  async getSignedUrl(actorUserId: string, workspaceId: string, fileId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "read");
    if (!z.string().uuid().safeParse(fileId).success) throw new AppError("VALIDATION_ERROR", "A valid file identifier is required.");
    const file = await this.repository.findFileForWorkspace(workspaceId, fileId);
    if (!file) throw new AppError("NOT_FOUND", "The requested file is not available in this workspace.");
    return this.storage.getSignedUrl(file.storageKey, 60 * 5);
  }
}
