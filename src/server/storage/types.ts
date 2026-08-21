export type UploadObjectInput = { key: string; body: Uint8Array; mimeType: string };

export interface StorageService {
  upload(input: UploadObjectInput): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
