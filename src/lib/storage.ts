import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileValidationError";
  }
}

export type SavedFile = {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export type StorageVisibility = "public" | "private";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // Keep server uploads below Vercel's 4.5 MB request limit.
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const RECEIPT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function driver(): "local" | "vercel-blob" {
  const configured = (process.env.STORAGE_DRIVER || "auto").toLowerCase();
  if (configured === "local") return "local";
  if (configured === "vercel-blob" || configured === "blob") return "vercel-blob";
  // Auto mode keeps local development simple and automatically uses durable
  // Vercel Blob storage in deployed Vercel functions.
  return process.env.VERCEL === "1" ? "vercel-blob" : "local";
}

function safeSegment(value: string): string {
  const clean = value.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!clean || clean.includes("..") || clean.split("/").some((p) => !p || p === "." || p === "..")) {
    throw new FileValidationError("Invalid storage path.");
  }
  return clean;
}

function extensionFor(mimeType: string, originalName: string): string {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
  };
  return byMime[mimeType] || path.extname(originalName).replace(/^\./, "").toLowerCase() || "bin";
}

function validateMagic(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/gif") return buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a";
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (mimeType === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  return false;
}

function validateUpload(buffer: Buffer, mimeType: string, originalName: string, kind?: string): void {
  if (!buffer.length) throw new FileValidationError("The uploaded file is empty.");
  if (buffer.length > MAX_FILE_BYTES) throw new FileValidationError("File is too large. Maximum size is 4 MB.");
  if (!mimeType) throw new FileValidationError("The uploaded file type could not be determined.");
  const allowed = kind === "receipt" ? RECEIPT_TYPES : IMAGE_TYPES;
  if (!allowed.has(mimeType)) {
    throw new FileValidationError(kind === "receipt" ? "Receipts must be JPG, PNG, WebP or PDF." : "Images must be JPG, PNG, WebP or GIF.");
  }
  if (!validateMagic(buffer, mimeType)) throw new FileValidationError("The uploaded file does not match its declared file type.");
  const ext = extensionFor(mimeType, originalName);
  if (!/^[a-z0-9]+$/.test(ext)) throw new FileValidationError("Invalid file extension.");
}

function localRoot(visibility: StorageVisibility): string {
  const root = process.env.STORAGE_DIR || "./storage";
  return path.resolve(root, visibility);
}

function localPath(key: string, visibility: StorageVisibility): string {
  const safeKey = safeSegment(key);
  const root = localRoot(visibility);
  const resolved = path.resolve(root, safeKey);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new FileValidationError("Invalid storage path.");
  }
  return resolved;
}

function blobPath(key: string, visibility: StorageVisibility): string {
  return `${visibility}/${safeSegment(key)}`;
}

async function loadBlobSdk(): Promise<any> {
  // Deliberately dynamic so local development does not require the Vercel
  // runtime package when STORAGE_DRIVER=local. Production installs it from
  // package.json when Vercel Blob is selected.
  const importer = new Function("return import('@vercel/blob')") as () => Promise<any>;
  try {
    return await importer();
  } catch {
    throw new Error("Vercel Blob storage is enabled but @vercel/blob is not installed.");
  }
}

export async function saveFile(args: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  isPublic?: boolean;
  folder?: string;
  kind?: "receipt" | "image" | string;
}): Promise<SavedFile> {
  const visibility: StorageVisibility = args.isPublic === false ? "private" : "public";
  validateUpload(args.buffer, args.mimeType, args.originalName, args.kind);
  const folder = args.folder ? safeSegment(args.folder) : "uploads";
  const ext = extensionFor(args.mimeType, args.originalName);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const key = `${folder}/${filename}`;

  if (driver() === "vercel-blob") {
    const blob = await loadBlobSdk();
    const result = await blob.put(blobPath(key, visibility), args.buffer, {
      access: visibility,
      addRandomSuffix: false,
      contentType: args.mimeType,
    });
    return {
      key,
      url: result.url,
      originalName: args.originalName,
      mimeType: args.mimeType,
      sizeBytes: args.buffer.length,
    };
  }

  const destination = localPath(key, visibility);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, args.buffer, { flag: "wx" });
  return {
    key,
    url: visibility === "public" ? `/media/${key.split("/").map(encodeURIComponent).join("/")}` : `/files/${key.split("/").map(encodeURIComponent).join("/")}`,
    originalName: args.originalName,
    mimeType: args.mimeType,
    sizeBytes: args.buffer.length,
  };
}

export async function readStoredFile(key: string, visibility: StorageVisibility): Promise<{ bytes: Buffer; ext: string } | null> {
  try {
    if (driver() === "vercel-blob") {
      const blob = await loadBlobSdk();
      const result = await blob.get(blobPath(key, visibility), { access: visibility, useCache: false });
      if (!result) return null;
      const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
      const ext = extensionFor(result.blob?.contentType || "application/octet-stream", key);
      return { bytes, ext };
    }
    const file = await fs.readFile(localPath(key, visibility));
    return { bytes: file, ext: path.extname(key).replace(/^\./, "").toLowerCase() || "bin" };
  } catch (error: any) {
    if (error?.code === "ENOENT" || error?.status === 404) return null;
    return null;
  }
}

// Backwards-compatible name used by the existing media routes.
export const readLocalFile = readStoredFile;

export function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
