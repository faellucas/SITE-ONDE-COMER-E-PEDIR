import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHash } from "node:crypto";
import { ENV } from "./_core/env";

type StorageConfig = { baseUrl: string; apiKey: string };

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toContentBody(data: Buffer | Uint8Array | string) {
  if (typeof data === "string") {
    return Buffer.from(data);
  }
  return Buffer.from(data);
}

function hasCloudinaryConfig() {
  return Boolean(
    ENV.cloudinaryCloudName &&
      ENV.cloudinaryApiKey &&
      ENV.cloudinaryApiSecret
  );
}

function normalizeCloudinaryPublicId(relKey: string) {
  return normalizeKey(relKey).replace(/\.[^.]+$/, "");
}

function getCloudinaryFolderPrefix() {
  return ENV.cloudinaryFolder
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

function buildCloudinaryPublicId(relKey: string) {
  const baseId = normalizeCloudinaryPublicId(relKey);
  const folderPrefix = getCloudinaryFolderPrefix();
  return folderPrefix ? `${folderPrefix}/${baseId}` : baseId;
}

function signCloudinaryParams(params: Record<string, string>) {
  const payload = Object.entries(params)
    .filter(([, value]) => value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${ENV.cloudinaryApiSecret}`)
    .digest("hex");
}

function buildCloudinaryAssetUrl(publicId: string) {
  return `https://res.cloudinary.com/${ENV.cloudinaryCloudName}/image/upload/${publicId}`;
}

async function storagePutCloudinary(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const publicId = buildCloudinaryPublicId(key);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signCloudinaryParams({
    public_id: publicId,
    timestamp,
  });
  const uploadUrl = `https://api.cloudinary.com/v1_1/${ENV.cloudinaryCloudName}/image/upload`;
  const form = new FormData();
  const fileName = key.split("/").pop() ?? "upload";

  form.append("file", new Blob([toContentBody(data)], { type: contentType }), fileName);
  form.append("api_key", ENV.cloudinaryApiKey);
  form.append("timestamp", timestamp);
  form.append("public_id", publicId);
  form.append("signature", signature);

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Cloudinary upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }

  const result = (await response.json()) as { secure_url?: string };
  return {
    key,
    url: result.secure_url ?? buildCloudinaryAssetUrl(publicId),
  };
}

function hasR2Config() {
  return Boolean(
    ENV.r2AccessKeyId &&
      ENV.r2SecretAccessKey &&
      ENV.r2Bucket &&
      (ENV.r2Endpoint || ENV.r2AccountId)
  );
}

function getR2Client() {
  const endpoint =
    ENV.r2Endpoint ||
    `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
  });
}

function getPublicR2Url(key: string) {
  if (!ENV.r2PublicUrl) {
    return null;
  }

  return new URL(normalizeKey(key), ensureTrailingSlash(ENV.r2PublicUrl)).toString();
}

async function storagePutR2(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: ENV.r2Bucket,
      Key: key,
      Body: toContentBody(data),
      ContentType: contentType,
    })
  );

  const publicUrl = getPublicR2Url(key);
  if (publicUrl) {
    return { key, url: publicUrl };
  }

  const signedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: ENV.r2Bucket,
      Key: key,
    }),
    { expiresIn: 60 * 60 * 24 * 7 }
  );

  return { key, url: signedUrl };
}

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage credentials missing: configure Cloudinary, Cloudflare R2, or set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

async function storagePutForge(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (hasCloudinaryConfig()) {
    return storagePutCloudinary(relKey, data, contentType);
  }

  if (hasR2Config()) {
    return storagePutR2(relKey, data, contentType);
  }

  return storagePutForge(relKey, data, contentType);
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  if (hasCloudinaryConfig()) {
    return {
      key,
      url: buildCloudinaryAssetUrl(buildCloudinaryPublicId(key)),
    };
  }

  if (hasR2Config()) {
    const publicUrl = getPublicR2Url(key);
    if (!publicUrl) {
      throw new Error("R2_PUBLIC_URL is required to read files from Cloudflare R2");
    }
    return { key, url: publicUrl };
  }

  const { baseUrl, apiKey } = getStorageConfig();
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}
