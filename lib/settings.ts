import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

function getKey(): Buffer {
  return scryptSync(ENCRYPTION_KEY, 'salt', 32);
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final('utf8');
}

export async function getSettingValue(key: string): Promise<string> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (rows.length === 0) {
    throw new Error(`Setting "${key}" not found. Please configure it in /settings.`);
  }
  return decrypt(rows[0].value);
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  const encrypted = encrypt(value);
  await db
    .insert(settings)
    .values({ key, value: encrypted, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: encrypted, updatedAt: new Date() },
    });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  const result: Record<string, string> = {};
  for (const row of rows) {
    try {
      result[row.key] = decrypt(row.value);
    } catch {
      result[row.key] = '';
    }
  }
  return result;
}
