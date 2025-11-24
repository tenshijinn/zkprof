import nacl from 'tweetnacl';

// Base64 encoding/decoding utilities
const encodeBase64 = (arr: Uint8Array): string => {
  return btoa(String.fromCharCode.apply(null, Array.from(arr)));
};

const decodeBase64 = (str: string): Uint8Array => {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
};

export interface EncryptionResult {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  commitment: string;
}

export async function encryptImage(
  imageDataUrl: string,
  recipientPublicKey: string
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

  // Encrypt the symmetric key with recipient's public key using NaCl box
  const recipientPubKeyBytes = decodeBase64(recipientPublicKey);
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);
  
  const encryptedKey = nacl.box(
    symmetricKey,
    nonce,
    recipientPubKeyBytes,
    ephemeralKeyPair.secretKey
  );

  // Create commitment hash using SHA-256
  const commitmentInput = new Uint8Array([...symmetricKey, ...iv]);
  const commitmentHash = await crypto.subtle.digest('SHA-256', commitmentInput);
  const commitment = encodeBase64(new Uint8Array(commitmentHash));

  return {
    encryptedData: encodeBase64(encryptedData),
    encryptedKey: encodeBase64(new Uint8Array([...ephemeralKeyPair.publicKey, ...nonce, ...encryptedKey])),
    iv: encodeBase64(iv),
    commitment
  };
}
