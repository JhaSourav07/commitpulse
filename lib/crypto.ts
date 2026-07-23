import 'server-only';

// Polyfill global crypto for older environments if needed
const webCrypto = typeof crypto !== 'undefined' ? crypto : globalThis.crypto;

const ALGO = 'AES-GCM';

async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const k = process.env.ENCRYPTION_KEY;
  if (!k || k.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }

  const baseKey = await webCrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(k),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return webCrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-512',
    },
    baseKey,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptToken(plain: string): Promise<string> {
  const salt = webCrypto.getRandomValues(new Uint8Array(16));
  const iv = webCrypto.getRandomValues(new Uint8Array(12));
  const derivedKey = await deriveKey(salt);

  const encoded = new TextEncoder().encode(plain);
  const encryptedBuffer = await webCrypto.subtle.encrypt(
    { name: ALGO, iv, tagLength: 128 },
    derivedKey,
    encoded
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const enc = encryptedBytes.slice(0, -16);
  const tag = encryptedBytes.slice(-16);

  const toBase64 = (arr: Uint8Array) => Buffer.from(arr).toString('base64');

  return [toBase64(salt), toBase64(iv), toBase64(tag), toBase64(enc)].join('.');
}

export async function decryptToken(payload: string): Promise<string> {
  const parts = payload.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid payload format');
  }

  const [salt, iv, tag, enc] = parts.map((p) => new Uint8Array(Buffer.from(p, 'base64')));

  const derivedKey = await deriveKey(salt);

  const cipherTextWithTag = new Uint8Array(enc.length + tag.length);
  cipherTextWithTag.set(enc);
  cipherTextWithTag.set(tag, enc.length);

  const decryptedBuffer = await webCrypto.subtle.decrypt(
    { name: ALGO, iv, tagLength: 128 },
    derivedKey,
    cipherTextWithTag
  );

  return new TextDecoder().decode(decryptedBuffer);
}
