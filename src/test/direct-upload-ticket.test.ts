import { describe, expect, it, vi } from "vitest";

import { createDirectUploadTicket, readDirectUploadTicket } from "@/server/storage/direct-upload-ticket";

const ticketInput = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  actorUserId: "22222222-2222-4222-8222-222222222222",
  storageKey: "workspaces/11111111-1111-4111-8111-111111111111/workspace-files/upload.pdf",
  originalFilename: "annual-report.pdf",
  mimeType: "application/pdf",
  category: "source_document" as const,
  sizeBytes: 5_000_000,
};

describe("direct private upload tickets", () => {
  it("round-trips a signed private upload authorization", () => {
    vi.stubEnv("UPLOAD_TICKET_SECRET", "test-secret-with-adequate-length");

    const ticket = createDirectUploadTicket(ticketInput, new Date("2026-09-02T12:00:00.000Z"));

    expect(readDirectUploadTicket(ticket, new Date("2026-09-02T12:01:00.000Z"))).toMatchObject(ticketInput);
  });

  it("rejects a tampered or expired authorization without exposing its storage key", () => {
    vi.stubEnv("UPLOAD_TICKET_SECRET", "test-secret-with-adequate-length");
    const ticket = createDirectUploadTicket(ticketInput, new Date("2026-09-02T12:00:00.000Z"));
    const [payload, signature] = ticket.split(".");

    expect(() => readDirectUploadTicket(`${payload}.${signature}x`, new Date("2026-09-02T12:01:00.000Z"))).toThrowError("The private upload authorization is not valid.");
    expect(() => readDirectUploadTicket(ticket, new Date("2026-09-02T12:16:00.000Z"))).toThrowError("The private upload authorization has expired. Select the file again.");
  });

  it("requires a dedicated upload-ticket secret in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPLOAD_TICKET_SECRET", "");

    expect(() => createDirectUploadTicket(ticketInput)).toThrowError("Private direct uploads are not configured.");
  });
});
