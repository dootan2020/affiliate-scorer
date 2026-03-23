// AES-256-GCM encrypted cookie persistence
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Cookie } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COOKIE_FILE = `${__dirname}/../../data/.cookies.enc`;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(keyHex, 'hex');
}

export function saveCookies(cookies: Cookie[]): void {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(cookies);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: [iv (12)] + [authTag (16)] + [ciphertext]
  const payload = Buffer.concat([iv, authTag, encrypted]);

  const dir = dirname(COOKIE_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(COOKIE_FILE, payload);
  log('Cookies saved and encrypted.');
}

export function loadCookies(): Cookie[] | null {
  if (!existsSync(COOKIE_FILE)) {
    return null;
  }

  try {
    const key = getEncryptionKey();
    const payload = readFileSync(COOKIE_FILE);

    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    const cookies = JSON.parse(decrypted.toString('utf8')) as Cookie[];
    log(`Loaded ${cookies.length} cookies from store.`);
    return cookies;
  } catch (err) {
    log(`Failed to load cookies: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

export function clearCookies(): void {
  if (existsSync(COOKIE_FILE)) {
    writeFileSync(COOKIE_FILE, Buffer.alloc(0));
    log('Cookie store cleared.');
  }
}

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [cookie-store] ${message}`);
}
