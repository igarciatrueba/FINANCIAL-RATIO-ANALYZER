export type UploadObjectInput = { key: string; body: Uint8Array; mimeType: string };

export interface StorageService {
  upload(input: UploadObjectInput): Promise<void>;
  createSignedUploadUrl(key: string): Promise<string>;
  download(key: string): Promise<Uint8Array>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
