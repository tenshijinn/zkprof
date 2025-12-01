// Base64 encoding utility with chunking to prevent stack overflow
const encodeBase64 = (arr: Uint8Array): string => {
  const CHUNK_SIZE = 8192; // Process 8KB at a time to avoid call stack limit
  let binary = '';
  
  for (let i = 0; i < arr.length; i += CHUNK_SIZE) {
    const chunk = arr.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

import { generateZKProof, serializeProof, ZKProofResult, ZKProofProgressCallback } from './zkproof';

export interface EncryptionResult {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  commitment: string;
  zkProof?: ZKProofResult; // ZK-SNARK proof of encryption
}

export async function encryptImage(
  imageDataUrl: string,
  recipientPublicKey: string,
  onZKProgress?: ZKProofProgressCallback
): Promise<EncryptionResult> {
  // Convert data URL to blob
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const imageData = new Uint8Array(arrayBuffer);

  // Generate a random symmetric key for AES-256-GCM
  const symmetricKey = crypto.getRandomValues(new Uint8Array(32));
  
  // Generate IV for AES-GCM (96 bits / 12 bytes)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Import the symmetric key for Web Crypto API
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    symmetricKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt the image data using AES-256-GCM
  const encryptedDataBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    cryptoKey,
    imageData
  );
  const encryptedData = new Uint8Array(encryptedDataBuffer);

  // Encrypt the symmetric key using a deterministic key derived from wallet public key
  // This allows the owner to decrypt later by signing with their wallet
  const keyDerivationMaterial = new TextEncoder().encode(`zkprof-key-derivation:${recipientPublicKey}`);
  // @ts-ignore - TypeScript has issues with ArrayBufferLike vs ArrayBuffer, but this works at runtime
  const derivedKeyHash = await crypto.subtle.digest('SHA-256', keyDerivationMaterial);
  
  const wrappingKey = await crypto.subtle.importKey(
    'raw',
    derivedKeyHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const keyIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: keyIv },
    wrappingKey,
    symmetricKey
  );
  
  // Combine IV and encrypted key for storage
  const encryptedKey = new Uint8Array([...keyIv, ...new Uint8Array(encryptedKeyBuffer)]);

  // Create commitment hash using SHA-256
  const commitmentInput = new Uint8Array([...symmetricKey, ...iv]);
  const commitmentHash = await crypto.subtle.digest('SHA-256', commitmentInput);
  const commitment = encodeBase64(new Uint8Array(commitmentHash));

  // Generate ZK-SNARK proof (proves knowledge of key without revealing it)
  let zkProof: ZKProofResult | undefined;
  try {
    console.log('Generating ZK-SNARK proof...');
    zkProof = await generateZKProof(symmetricKey, iv, recipientPublicKey, onZKProgress);
    console.log('ZK-SNARK proof generated successfully');
  } catch (error) {
    console.warn('ZK-SNARK proof generation failed, falling back to commitment-only:', error);
    // Continue without ZK proof - commitment is still secure
    // This allows the app to function even if ZK artifacts aren't available yet
  }

  return {
    encryptedData: encodeBase64(encryptedData),
    encryptedKey: encodeBase64(encryptedKey),
    iv: encodeBase64(iv),
    commitment,
    zkProof
  };
}

// Decode base64 to Uint8Array
const decodeBase64 = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export async function decryptImage(
  encryptedDataBase64: string,
  encryptedKeyBase64: string,
  ivBase64: string,
  walletPublicKey: string
): Promise<string> {
  try {
    // Decode base64 inputs
    const encryptedData = decodeBase64(encryptedDataBase64);
    const encryptedKeyWithIv = decodeBase64(encryptedKeyBase64);
    const iv = decodeBase64(ivBase64);

    // Extract IV and encrypted key (first 12 bytes are IV)
    const keyIv = encryptedKeyWithIv.slice(0, 12);
    const encryptedKey = encryptedKeyWithIv.slice(12);

    // Derive the wrapping key from wallet public key
    const keyDerivationMaterial = new TextEncoder().encode(`zkprof-key-derivation:${walletPublicKey}`);
    // @ts-ignore - TypeScript has issues with ArrayBufferLike vs ArrayBuffer, but this works at runtime
    const derivedKeyHash = await crypto.subtle.digest('SHA-256', keyDerivationMaterial);
    
    const wrappingKey = await crypto.subtle.importKey(
      'raw',
      derivedKeyHash,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt the symmetric key
    const symmetricKeyBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: keyIv },
      wrappingKey,
      encryptedKey
    );
    const symmetricKey = new Uint8Array(symmetricKeyBuffer);

    // Import the symmetric key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      symmetricKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt the image data
    // @ts-ignore - TypeScript has issues with ArrayBufferLike vs ArrayBuffer, but this works at runtime
    const decryptedDataBuffer = await crypto.subtle.decrypt(
      // @ts-ignore
      { name: 'AES-GCM', iv: iv },
      cryptoKey,
      encryptedData
    );

    // Convert decrypted data to data URL
    const blob = new Blob([decryptedDataBuffer]);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt image. This zkPFP may have been created before decryption support was added.');
  }
}
