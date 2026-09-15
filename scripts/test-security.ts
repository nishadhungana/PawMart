import {
  canonicalizeTransaction,
  createTransactionHash,
  createTransactionSignature,
  verifyTransactionSignature,
  verifyTransactionIntegrity,
  getPublicKey,
  type CanonicalTransactionData,
} from '../src/lib/transaction-security';

console.log('=== PawMart Cryptographic Security Demonstration Tests ===\n');

const sampleTxn: CanonicalTransactionData = {
  transactionId: 'txn_pm_test_001',
  orderId: 'order_pm_test_001',
  customerId: 'cust_hina_001',
  amount: 2450.0,
  currency: 'NPR',
  paymentMethod: 'ESEWA',
  paymentStatus: 'PAID',
  timestamp: '2026-09-05T10:00:00.000Z',
};

// Test 1: Canonicalization
const canonical1 = canonicalizeTransaction(sampleTxn);
const canonical2 = canonicalizeTransaction({ ...sampleTxn });
console.log('1. Deterministic Canonicalization:');
console.log('   Canonical String:', canonical1);
if (canonical1 !== canonical2) {
  throw new Error('FAILED: Canonical strings are not identical');
}
console.log('   ✓ Deterministic ordering verified.\n');

// Test 2: SHA-256 Hashing
const hash1 = createTransactionHash(sampleTxn);
const hash2 = createTransactionHash(sampleTxn);
console.log('2. SHA-256 Hashing:');
console.log('   Original Hash:', hash1);
if (hash1 !== hash2 || hash1.length !== 64) {
  throw new Error('FAILED: SHA-256 hash must be 64-char hex and deterministic');
}

const tamperedAmountTxn: CanonicalTransactionData = {
  ...sampleTxn,
  amount: 9450.0, // Tampered amount!
};
const tamperedHash = createTransactionHash(tamperedAmountTxn);
console.log('   Tampered Hash (Amount 2450 -> 9450):', tamperedHash);
if (hash1 === tamperedHash) {
  throw new Error('FAILED: Tampered amount produced identical hash!');
}
console.log('   ✓ Tampered data produces distinct SHA-256 hash.\n');

// Test 3: RSA-2048 Digital Signature & Verification
console.log('3. RSA-SHA256 Digital Signature:');
const signature = createTransactionSignature(sampleTxn);
console.log('   Signature (Base64 prefix):', signature.slice(0, 48) + '...');
const publicKey = getPublicKey();
console.log('   Public Key Available:', publicKey.includes('BEGIN PUBLIC KEY'));

const isOriginalValid = verifyTransactionSignature(sampleTxn, signature);
console.log('   Original Signature Verification:', isOriginalValid ? '✓ VALID' : '✗ INVALID');
if (!isOriginalValid) {
  throw new Error('FAILED: Original signature did not verify');
}

// Test 4: Tampering Detection via Digital Signature
console.log('\n4. Tampering Detection:');
const isTamperedValid = verifyTransactionSignature(tamperedAmountTxn, signature);
console.log('   Tampered Data Verification Result:', isTamperedValid ? '✗ ERROR (Accepted tampered)' : '✓ REJECTED (Invalid)');
if (isTamperedValid) {
  throw new Error('FAILED: Digital signature accepted tampered data!');
}

// Test 5: Full Integrity Verification Helper
console.log('\n5. Full Transaction Integrity Check:');
const validResult = verifyTransactionIntegrity(sampleTxn, hash1, signature);
console.log('   Original Transaction Status:', validResult.status);
console.log('   Original Hash Match:', validResult.hashMatch);
console.log('   Original Signature Valid:', validResult.signatureValid);
if (!validResult.isValid) {
  throw new Error('FAILED: Valid transaction failed integrity check');
}

const tamperedResult = verifyTransactionIntegrity(tamperedAmountTxn, hash1, signature);
console.log('\n   Tampered Transaction Status:', tamperedResult.status);
console.log('   Tampered Hash Match:', tamperedResult.hashMatch);
console.log('   Tampered Signature Valid:', tamperedResult.signatureValid);
console.log('   Tampered Details:', tamperedResult.details);
if (tamperedResult.isValid || tamperedResult.status !== 'TAMPERED') {
  throw new Error('FAILED: Tampered transaction was not flagged as TAMPERED');
}

console.log('\n============================================================');
console.log('✓ ALL CRYPTOGRAPHIC SECURITY TESTS PASSED SUCCESSFULLY!');
console.log('============================================================\n');
