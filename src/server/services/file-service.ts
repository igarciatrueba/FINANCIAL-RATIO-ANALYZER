import { createHash, randomUUID } from "node:crypto";
import { extname } from "node:path";
import { z } from "zod";

import { AppError } from "@/server/errors";
import { BackendRepository, type PageRequest } from "@/server/repositories/backend-repository";
import { AuthorizationService } from "@/server/services/authorization-service";
import { createDirectUploadTicket, readDirectUploadTicket } from "@/server/storage/direct-upload-ticket";
import type { StorageService } from "@/server/storage/types";

const allowedMimeTypes = new Set(["application/pdf", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const maximumFileSizeBytes = 20 * 1024 * 1024;
const fileMetadataSchema = z.object({
  companyId: z.string().uuid().optional(),
  originalFilename: z.string().trim().min(1).max(512),
  mimeType: z.string().min(1).max(255),
  category: z.enum(["financial_input", "source_document", "import", "report"]),
  sizeBytes: z.number().int().positive().max(maximumFileSizeBytes),
}).strict();
const fileUploadSchema = fileMetadataSchema.omit({ sizeBytes: true }).extend({
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

  constructor(private readonly repository: BackendRepository, private readonly storage?: StorageService) {
    this.authorization = new AuthorizationService(repository);
  }

  private requireStorage() {
    if (!this.storage) {
      throw new AppError("CONFIGURATION_ERROR", "Private object storage is not configured.");
    }
    return this.storage;
  }

  private async validateFileMetadata(actorUserId: string, workspaceId: string, input: unknown) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-files");
    const parsedInput = fileMetadataSchema.safeParse(input);
    if (!parsedInput.success) throw new AppError("VALIDATION_ERROR", "The file metadata is not valid.");
    const upload = parsedInput.data;
    if (upload.companyId) await this.authorization.requireCompanyAccess(actorUserId, workspaceId, upload.companyId, "manage-files");
    if (upload.originalFilename.includes("/") || upload.originalFilename.includes("\\")) throw new AppError("VALIDATION_ERROR", "The original filename is not valid.");
    if (!allowedMimeTypes.has(upload.mimeType)) throw new AppError("VALIDATION_ERROR", "This file type is not allowed.");
    return upload;
  }

  async upload(actorUserId: string, workspaceId: string, input: unknown) {
    const parsedInput = fileUploadSchema.safeParse(input);
    if (!parsedInput.success) throw new AppError("VALIDATION_ERROR", "The file metadata is not valid.");
    const upload = parsedInput.data;
    await this.validateFileMetadata(actorUserId, workspaceId, {
      companyId: upload.companyId,
      originalFilename: upload.originalFilename,
      mimeType: upload.mimeType,
      category: upload.category,
      sizeBytes: upload.body.byteLength,
    });
    if (upload.body.byteLength === 0 || upload.body.byteLength > maximumFileSizeBytes) throw new AppError("VALIDATION_ERROR", "The file size is outside the allowed limit.");
    const storageKey = createPrivateStorageKey(workspaceId, upload.companyId, upload.originalFilename);
    const checksum = createHash("sha256").update(upload.body).digest("hex");
    const storage = this.requireStorage();
    await storage.upload({ key: storageKey, body: upload.body, mimeType: upload.mimeType });
    try {
      const file = await this.repository.createFileMetadata({ workspaceId, companyId: upload.companyId, uploadedBy: actorUserId, originalFilename: upload.originalFilename, storageKey, mimeType: upload.mimeType, sizeBytes: upload.body.byteLength, category: upload.category, checksum });
      await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId: upload.companyId, eventType: "file.uploaded", entityType: "file", entityId: file.id });
      return file;
    } catch (error) {
      await storage.delete(storageKey);
      throw error;
    }
  }

  async prepareDirectUpload(actorUserId: string, workspaceId: string, input: unknown) {
    const upload = await this.validateFileMetadata(actorUserId, workspaceId, input);
    const storageKey = createPrivateStorageKey(workspaceId, upload.companyId, upload.originalFilename);
    const uploadUrl = await this.requireStorage().createSignedUploadUrl(storageKey);
    return {
      uploadUrl,
      ticket: createDirectUploadTicket({
        workspaceId,
        actorUserId,
        companyId: upload.companyId,
        storageKey,
        originalFilename: upload.originalFilename,
        mimeType: upload.mimeType,
        category: upload.category,
        sizeBytes: upload.sizeBytes,
      }),
    };
  }

  async completeDirectUpload(actorUserId: string, workspaceId: string, ticketValue: unknown) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-files");
    const ticket = readDirectUploadTicket(ticketValue);
    if (ticket.workspaceId !== workspaceId || ticket.actorUserId !== actorUserId) {
      throw new AppError("FORBIDDEN", "This private upload authorization is not available to the current workspace.");
    }
    if (ticket.companyId) await this.authorization.requireCompanyAccess(actorUserId, workspaceId, ticket.companyId, "manage-files");

    const storage = this.requireStorage();
    let body: Uint8Array;
    try {
      body = await storage.download(ticket.storageKey);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("STORAGE_ERROR", "The private file could not be read safely.");
    }
    if (body.byteLength !== ticket.sizeBytes || body.byteLength === 0 || body.byteLength > maximumFileSizeBytes) {
      await storage.delete(ticket.storageKey).catch(() => undefined);
      throw new AppError("VALIDATION_ERROR", "The uploaded file size could not be verified.");
    }

    const checksum = createHash("sha256").update(body).digest("hex");
    try {
      const file = await this.repository.createFileMetadata({
        workspaceId,
        companyId: ticket.companyId,
        uploadedBy: actorUserId,
        originalFilename: ticket.originalFilename,
        storageKey: ticket.storageKey,
        mimeType: ticket.mimeType,
        sizeBytes: body.byteLength,
        category: ticket.category,
        checksum,
      });
      await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId: ticket.companyId, eventType: "file.uploaded", entityType: "file", entityId: file.id });
      return file;
    } catch (error) {
      await storage.delete(ticket.storageKey).catch(() => undefined);
      throw error;
    }
  }

  async abortDirectUpload(actorUserId: string, workspaceId: string, ticketValue: unknown) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-files");
    const ticket = readDirectUploadTicket(ticketValue);
    if (ticket.workspaceId !== workspaceId || ticket.actorUserId !== actorUserId) {
      throw new AppError("FORBIDDEN", "This private upload authorization is not available to the current workspace.");
    }
    await this.requireStorage().delete(ticket.storageKey).catch(() => undefined);
  }

  async getSignedUrl(actorUserId: string, workspaceId: string, fileId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "read");
    if (!z.string().uuid().safeParse(fileId).success) throw new AppError("VALIDATION_ERROR", "A valid file identifier is required.");
    const file = await this.repository.findFileForWorkspace(workspaceId, fileId);
    if (!file) throw new AppError("NOT_FOUND", "The requested file is not available in this workspace.");
    return this.requireStorage().getSignedUrl(file.storageKey, 60 * 5);
  }

  async downloadForProcessing(actorUserId: string, workspaceId: string, fileId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-files");
    if (!z.string().uuid().safeParse(fileId).success) throw new AppError("VALIDATION_ERROR", "A valid file identifier is required.");
    const file = await this.repository.findFileForWorkspace(workspaceId, fileId);
    if (!file) throw new AppError("NOT_FOUND", "The requested file is not available in this workspace.");
    return { file, bytes: await this.requireStorage().download(file.storageKey) };
  }

  async list(actorUserId: string, workspaceId: string, request: unknown, companyId?: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "read");
    if (companyId) await this.authorization.requireCompanyAccess(actorUserId, workspaceId, companyId, "read");
    const parsed = pageRequestSchema.safeParse(request);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "A pagination request must use a limit from 1 to 100.");
    return this.repository.listFilesForWorkspace(workspaceId, parsed.data satisfies PageRequest, companyId);
  }

  async delete(actorUserId: string, workspaceId: string, fileId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-files");
    if (!z.string().uuid().safeParse(fileId).success) throw new AppError("VALIDATION_ERROR", "A valid file identifier is required.");
    const file = await this.repository.findFileForWorkspace(workspaceId, fileId);
    if (!file) throw new AppError("NOT_FOUND", "The requested file is not available in this workspace.");
    const deleted = await this.repository.markFileDeleted(workspaceId, fileId);
    if (!deleted) throw new AppError("NOT_FOUND", "The requested file is not available in this workspace.");
    await this.requireStorage().delete(file.storageKey);
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, companyId: file.companyId ?? undefined, eventType: "file.deleted", entityType: "file", entityId: file.id });
    return deleted;
  }
}

const pageRequestSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100),
}).strict();
