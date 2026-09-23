import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM envelope for every token or key we persist (DB rows, cookies).
// Format: "v1.<iv>.<authTag>.<ciphertext>", all base64url. The version prefix
// leaves room for key rotation without a data migration.
const VERSION = "v1";
const IV_BYTES = 12;

let cachedKey: Buffer | null = null;

function getKey() {
  if (cachedKey) return cachedKey;

  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not configured");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes encoded as base64");
  }

  cachedKey = key;
  return key;
}

export function encryptSecret(plaintext: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSecret(envelope: string) {
  const [version, iv, tag, ciphertext] = envelope.split(".");
  if (version !== VERSION || !iv || !tag || ciphertext === undefined) {
    throw new Error("Unrecognized secret envelope");
  }

  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function encryptOptional(value: string | null | undefined) {
  return value ? encryptSecret(value) : null;
}

export function decryptOptional(value: string | null | undefined) {
  return value ? decryptSecret(value) : null;
}

export function encryptJson(value: unknown) {
  return encryptSecret(JSON.stringify(value));
}

export function decryptJson<T>(envelope: string): T {
  return JSON.parse(decryptSecret(envelope)) as T;
}
