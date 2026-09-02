import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { AppError } from "@/server/errors";

const ticketLifetimeMilliseconds = 10 * 60 * 1_000;

const directUploadTicketSchema = z.object({
  version: z.literal(1),
  workspaceId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  storageKey: z.string().min(1).max(1_024),
  originalFilename: z.string().min(1).max(512),
  mimeType: z.string().min(1).max(255),
  category: z.enum(["financial_input", "source_document", "import", "report"]),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024),
  expiresAt: z.number().int().positive(),
}).strict();

export type DirectUploadTicketInput = Omit<z.infer<typeof directUploadTicketSchema>, "version" | "expiresAt">;
export type DirectUploadTicket = z.infer<typeof directUploadTicketSchema>;

function ticketSecret() {
  const secret = process.env.UPLOAD_TICKET_SECRET
    ?? (process.env.NODE_ENV !== "production" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined);
  if (!secret) throw new AppError("CONFIGURATION_ERROR", "Private direct uploads are not configured.");
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", ticketSecret()).update(payload).digest("base64url");
}

function invalidTicket() {
  return new AppError("VALIDATION_ERROR", "The private upload authorization is not valid.");
}

export function createDirectUploadTicket(input: DirectUploadTicketInput, now = new Date()) {
  const ticket = directUploadTicketSchema.parse({
    ...input,
    version: 1,
    expiresAt: now.getTime() + ticketLifetimeMilliseconds,
  });
  const payload = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readDirectUploadTicket(ticket: unknown, now = new Date()): DirectUploadTicket {
  if (typeof ticket !== "string") throw invalidTicket();
  const [payload, signature, extra] = ticket.split(".");
  if (!payload || !signature || extra) throw invalidTicket();

  const expectedSignature = sign(payload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.byteLength !== expected.byteLength || !timingSafeEqual(actual, expected)) throw invalidTicket();

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw invalidTicket();
  }
  const result = directUploadTicketSchema.safeParse(parsed);
  if (!result.success) throw invalidTicket();
  if (result.data.expiresAt <= now.getTime()) {
    throw new AppError("VALIDATION_ERROR", "The private upload authorization has expired. Select the file again.");
  }
  return result.data;
}
