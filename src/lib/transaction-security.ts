import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Normalized representation of transaction data for deterministic cryptographic processing.
 */
export interface CanonicalTransactionData {
  transactionId: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  timestamp: string; // ISO 8601 string
}

export interface TransactionVerificationResult {
  isValid: boolean;
  hashMatch: boolean;
  signatureValid: boolean;
  computedHash: string;
  expectedHash: string;
  status: 'VERIFIED' | 'TAMPERED' | 'INVALID_SIGNATURE';
  details: string;
}

const KEYS_DIR = path.resolve(process.cwd(), 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'transaction_private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'transaction_public.pem');

let cachedPrivateKey: string | null = null;
let cachedPublicKey: string | null = null;

/**
 * Ensures an RSA-2048 key pair is available for digital signatures.
 * Generates local keys automatically on first run and stores them in ignored keys/ directory.
 */
function ensureKeyPair(): { privateKey: string; publicKey: string } {
  if (cachedPrivateKey && cachedPublicKey) {
    return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
  }

  // 1. Check environment variables
  if (process.env.TRANSACTION_PRIVATE_KEY && process.env.TRANSACTION_PUBLIC_KEY) {
    cachedPrivateKey = process.env.TRANSACTION_PRIVATE_KEY.replace(/\\n/g, '\n');
    cachedPublicKey = process.env.TRANSACTION_PUBLIC_KEY.replace(/\\n/g, '\n');
    return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
  }

  // 2. Check local key files
  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    try {
      cachedPrivateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
      cachedPublicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
      return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
    } catch (e) {
      console.warn('[TransactionSecurity] Could not read existing key files, generating new pair...', e);
    }
  }

  // 3. Generate new 2048-bit RSA key pair
  console.log('[TransactionSecurity] Generating local 2048-bit RSA key pair for transaction signatures...');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  try {
    if (!fs.existsSync(KEYS_DIR)) {
      fs.mkdirSync(KEYS_DIR, { recursive: true });
    }
    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { encoding: 'utf8', mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { encoding: 'utf8', mode: 0o644 });
    console.log('[TransactionSecurity] RSA keys saved to keys/ directory (ignored by git).');
  } catch (err) {
    console.warn('[TransactionSecurity] Could not write keys to disk (using in-memory):', err);
  }

  cachedPrivateKey = privateKey;
  cachedPublicKey = publicKey;
  return { privateKey, publicKey };
}

/**
 * Returns the server-side private key. Never expose to client-side code.
 */
export function getPrivateKey(): string {
  return ensureKeyPair().privateKey;
}

/**
 * Returns the public key used to verify digital signatures.
 */
export function getPublicKey(): string {
  return ensureKeyPair().publicKey;
}

/**
 * Creates a deterministic, canonical representation of transaction data.
 * All properties are formatted in fixed lexicographical order with strict numeric formatting
 * so that any alteration immediately produces an incompatible string.
 */
export function canonicalizeTransaction(data: CanonicalTransactionData): string {
  const normalizedAmount = Number(data.amount).toFixed(2);
  const normalizedCurrency = (data.currency || 'NPR').trim().toUpperCase();
  const normalizedCustomerId = String(data.customerId || '').trim();
  const normalizedOrderId = String(data.orderId || '').trim();
  const normalizedMethod = String(data.paymentMethod || '').trim().toUpperCase();
  const normalizedStatus = String(data.paymentStatus || '').trim().toUpperCase();
  const normalizedTimestamp = String(data.timestamp || '').trim();
  const normalizedTxnId = String(data.transactionId || '').trim();

  return [
    `amount=${normalizedAmount}`,
    `currency=${normalizedCurrency}`,
    `customerId=${normalizedCustomerId}`,
    `orderId=${normalizedOrderId}`,
    `paymentMethod=${normalizedMethod}`,
    `paymentStatus=${normalizedStatus}`,
    `timestamp=${normalizedTimestamp}`,
    `transactionId=${normalizedTxnId}`,
  ].join('|');
}

/**
 * Generates a standard SHA-256 hexadecimal digest for the canonical transaction data.
 */
export function createTransactionHash(canonicalData: string | CanonicalTransactionData): string {
  const payload = typeof canonicalData === 'string' ? canonicalData : canonicalizeTransaction(canonicalData);
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Signs the canonical transaction payload using RSA with SHA-256.
 * Returns a Base64-encoded digital signature string.
 */
export function createTransactionSignature(
  canonicalData: string | CanonicalTransactionData,
  privateKeyPem?: string
): string {
  const payload = typeof canonicalData === 'string' ? canonicalData : canonicalizeTransaction(canonicalData);
  const key = privateKeyPem || getPrivateKey();

  const signer = crypto.createSign('SHA256');
  signer.update(payload, 'utf8');
  signer.end();

  return signer.sign(key, 'base64');
}

/**
 * Verifies a Base64-encoded RSA digital signature against canonical transaction data.
 * Returns true if the signature was genuinely produced by the server's private key
 * and the transaction data has not been modified.
 */
export function verifyTransactionSignature(
  canonicalData: string | CanonicalTransactionData,
  signatureBase64: string,
  publicKeyPem?: string
): boolean {
  try {
    if (!signatureBase64) return false;
    const payload = typeof canonicalData === 'string' ? canonicalData : canonicalizeTransaction(canonicalData);
    const key = publicKeyPem || getPublicKey();

    const verifier = crypto.createVerify('SHA256');
    verifier.update(payload, 'utf8');
    verifier.end();

    return verifier.verify(key, signatureBase64, 'base64');
  } catch (err) {
    console.error('[TransactionSecurity] Signature verification exception:', err);
    return false;
  }
}

/**
 * Comprehensive transaction integrity check:
 * 1. Checks if SHA-256 hash of data matches stored hash.
 * 2. Checks if RSA digital signature is valid.
 */
export function verifyTransactionIntegrity(
  currentData: CanonicalTransactionData,
  storedHash: string,
  storedSignature: string,
  publicKeyPem?: string
): TransactionVerificationResult {
  const canonical = canonicalizeTransaction(currentData);
  const computedHash = createTransactionHash(canonical);
  const hashMatch = Boolean(storedHash) && computedHash.toLowerCase() === storedHash.toLowerCase();
  const signatureValid = Boolean(storedSignature) && verifyTransactionSignature(canonical, storedSignature, publicKeyPem);
  const isValid = hashMatch && signatureValid;

  let status: 'VERIFIED' | 'TAMPERED' | 'INVALID_SIGNATURE' = 'VERIFIED';
  let details = 'Transaction integrity verified. Cryptographic hash matches and digital signature is valid.';

  if (!hashMatch && !signatureValid) {
    status = 'TAMPERED';
    details = 'Tampering detected: Both SHA-256 hash mismatch and digital signature verification failed.';
  } else if (!hashMatch) {
    status = 'TAMPERED';
    details = 'Tampering detected: Current SHA-256 hash does not match original stored hash.';
  } else if (!signatureValid) {
    status = 'INVALID_SIGNATURE';
    details = 'Digital signature verification failed. The transaction content does not match the server signature.';
  }

  return {
    isValid,
    hashMatch,
    signatureValid,
    computedHash,
    expectedHash: storedHash,
    status,
    details,
  };
}
