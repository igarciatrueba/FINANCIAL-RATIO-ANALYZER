import { createClient } from "@supabase/supabase-js";

import { AppError } from "@/server/errors";
import type { StorageService, UploadObjectInput } from "@/server/storage/types";

export class SupabaseStorageService implements StorageService {
  private readonly client;

  constructor(private readonly bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "financial-ratio-analyzer-private") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) throw new AppError("CONFIGURATION_ERROR", "Private object storage is not configured.");
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async upload(input: UploadObjectInput) {
    const { error } = await this.client.storage.from(this.bucket).upload(input.key, input.body, { contentType: input.mimeType, upsert: false });
    if (error) throw new AppError("STORAGE_ERROR", "The file could not be stored safely.");
  }

  async getSignedUrl(key: string, expiresInSeconds: number) {
    const { data, error } = await this.client.storage.from(this.bucket).createSignedUrl(key, expiresInSeconds);
    if (error || !data?.signedUrl) throw new AppError("STORAGE_ERROR", "A private file link could not be created.");
    return data.signedUrl;
  }

  async delete(key: string) {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) throw new AppError("STORAGE_ERROR", "The stored file could not be deleted safely.");
  }

  async exists(key: string) {
    const { data, error } = await this.client.storage.from(this.bucket).list(key.split("/").slice(0, -1).join("/"), { search: key.split("/").at(-1), limit: 1 });
    if (error) throw new AppError("STORAGE_ERROR", "The private file could not be checked safely.");
    return data.some((entry) => entry.name === key.split("/").at(-1));
  }
}
