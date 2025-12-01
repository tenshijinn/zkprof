import { groth16 } from 'snarkjs';

export interface ZKProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface ZKProofResult {
  proof: ZKProof;
  publicSignals: string[];
  commitment: string;
  walletPubKey: string;
}

export type ZKProofProgressCallback = (step: string, progress: number) => void;

/**
 * Generate a ZK-SNARK proof that proves knowledge of encryption key
 * without revealing the key itself
 */
export async function generateZKProof(
  symmetricKey: Uint8Array,
  iv: Uint8Array,
  walletPublicKey: string,
  onProgress?: ZKProofProgressCallback
): Promise<ZKProofResult> {
  try {
    onProgress?.('Preparing cryptographic inputs...', 0);
    
    // Convert wallet public key to byte array
    const walletPubKeyBytes = Array.from(
      new Uint8Array(Buffer.from(walletPublicKey, 'base64'))
    ).slice(0, 32); // Solana pubkey is 32 bytes

    // Prepare circuit inputs
    const input = {
      symmetricKey: Array.from(symmetricKey),
      iv: Array.from(iv),
      walletPubKey: walletPubKeyBytes,
    };

    onProgress?.('Loading ZK-SNARK circuit artifacts...', 20);
    console.log('Generating ZK-SNARK proof...');

    onProgress?.('Computing cryptographic witness...', 40);
    
    // Generate witness and proof
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      '/zk-artifacts/zkpfp.wasm',
      '/zk-artifacts/zkpfp_final.zkey'
    );

    onProgress?.('Generating zero-knowledge proof...', 80);
    console.log('ZK-SNARK proof generated successfully');

    onProgress?.('ZK-SNARK proof complete!', 100);

    return {
      proof: proof as ZKProof,
      publicSignals: publicSignals,
      commitment: publicSignals[0], // First public signal is the commitment
      walletPubKey: walletPublicKey,
    };
  } catch (error) {
    console.error('ZK-SNARK proof generation failed:', error);
    throw new Error('Failed to generate ZK-SNARK proof: ' + (error as Error).message);
  }
}

/**
 * Verify a ZK-SNARK proof
 */
export async function verifyZKProof(
  proof: ZKProof,
  publicSignals: string[]
): Promise<boolean> {
  try {
    console.log('🔍 Starting ZK-SNARK verification...');
    console.log('Proof structure:', JSON.stringify(proof, null, 2));
    console.log('Public signals:', publicSignals);
    
    // Load verification key
    const vKeyResponse = await fetch('/zk-artifacts/verification_key.json');
    const vKey = await vKeyResponse.json();
    console.log('Verification key loaded successfully');

    // Verify the proof
    console.log('Calling groth16.verify...');
    const isValid = await groth16.verify(vKey, publicSignals, proof);

    console.log('ZK-SNARK proof verification:', isValid ? '✅ VALID' : '❌ INVALID');
    return isValid;
  } catch (error) {
    console.error('❌ ZK-SNARK proof verification failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Serialize proof for storage
 */
export function serializeProof(proof: ZKProof): string {
  return JSON.stringify(proof);
}

/**
 * Deserialize proof from storage
 */
export function deserializeProof(proofStr: string): ZKProof {
  return JSON.parse(proofStr);
}
