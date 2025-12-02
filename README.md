# zkProf

**Privacy-first encrypted profile photos with zero-knowledge proofs on Solana.**

---

## For Users: What is zkProf?

zkProf is a privacy-focused platform that lets you create encrypted profile photos that only you can decrypt and share. Think of it as taking a profile picture that's locked in a digital vault—no one can see it unless you explicitly grant them access.

### What You Can Do with zkProf

1. **Take Encrypted Photos**: Capture a profile photo through your webcam or phone. The photo is immediately encrypted using advanced cryptography, ensuring no one—not even zkProf—can view it without your permission.

2. **Prove It's Encrypted (Without Revealing Your Keys)**: Using zero-knowledge proof technology (ZK-SNARKs), zkProf creates mathematical proof that your photo was properly encrypted, without ever revealing your encryption keys. This proof is recorded on the Solana blockchain as permanent, tamper-proof evidence.

3. **Control Who Sees Your Photo**: You decide which third-party platforms (dating apps, social networks, professional platforms) can access your encrypted photo. Access requires:
   - Your explicit permission
   - The viewer signing a legal NDA (digitally, using their crypto wallet)
   - The platform paying a small fee per view

4. **Decrypt and Preview**: You can always decrypt and view your own photos through a protected preview system with anti-screenshot safeguards.

5. **Manage Sharing Permissions**: Grant or revoke access to platforms at any time through the "Manage Sharing" page.

### Why zkProf?

- **True Privacy**: Your photos are encrypted client-side (in your browser) before leaving your device
- **Verifiable Security**: Cryptographic proofs on Solana blockchain guarantee encryption integrity
- **You're in Control**: No platform can access your photo without your explicit, NDA-backed permission
- **Monetization Potential**: Platforms pay per view, creating potential revenue streams for photo owners in the future

### How It Works (Simple Version)

1. Connect your Solana wallet (like Phantom)
2. Take a photo with your webcam
3. The photo is encrypted and a proof is created automatically
4. A record is saved to the Solana blockchain (costs ~$5.00 in SOL)
5. Your encrypted photo is stored securely
6. You control who can see it through the Manage Sharing page

---

## For Developers: Technical Implementation

zkProf is an open-source platform for zero-knowledge encrypted profile photos with third-party API access. This section covers installation, architecture, and integration for developers who want to fork, deploy, or integrate with zkProf.

### Core Features

- **Zero-Knowledge Encryption**: Photos encrypted with AES-256-GCM, proven with ZK-SNARK circuits
- **Solana Blockchain Integration**: On-chain proof via memo transactions containing commitment hashes
- **Wallet-Based Identity**: Solana wallet public keys serve as primary authorization mechanism
- **Decryptable Previews**: Users can decrypt and preview their zkPFPs with protected mouse-reveal interface
- **Third-Party API**: Platforms can access user zkPFPs through NDA-gated, payment-based API
- **Screenshot Prevention**: Multi-layered deterrents (CSS, JS, visual watermarks) during decryption
- **ZK Proof Verification**: On-page verification of ZK-SNARK proofs with verification badges
- **x402 Payment Rails**: Platforms pay per API call using Solana-based x402 payment protocol (SOL/USDC/USDT)

## Tech Stack

**Frontend:**

- React 18 + TypeScript
- Vite build system
- TailwindCSS for styling
- Solana Web3.js + Wallet Adapter
- snarkjs (ZK-SNARK proof generation in browser)

**Backend:**

- Supabase (PostgreSQL database + Edge Functions + Storage)
- Deno (Edge Functions runtime)

**Blockchain:**

- Solana (mainnet/devnet for on-chain proof and payments)
- x402 Payment Protocol (SOL/USDC/USDT payments for API access)

**Cryptography:**

- **ZK-SNARKs** (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge) - Part of **ZCash cryptography research**
- Circom (ZK circuit design language)
- snarkjs (Groth16 proving system)
- AES-256-GCM (Symmetric encryption)
- tweetnacl (Ed25519 signature verification)

## Prerequisites

- Node.js 18+ and npm
- Git
- Circom compiler (for ZK artifacts generation)
- snarkjs CLI
- Solana wallet (Phantom, Solflare, etc.)
- Supabase account (or self-hosted Supabase)
- Custom Solana RPC endpoint (Helius, QuickNode, etc.) recommended for mainnet

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd zkprof
npm install
```

### 2. Generate ZK-SNARK Artifacts

**CRITICAL**: ZK-SNARK artifacts must be generated locally before the application can function. These artifacts cannot be generated in the browser.

```bash
cd scripts
chmod +x setup-zk-artifacts.sh
./setup-zk-artifacts.sh
```

This script will:

- Install Circom and snarkjs (if not already installed)
- Compile the `circuits/zkpfp.circom` circuit
- Run Powers of Tau ceremony
- Generate proving and verification keys
- Copy artifacts to `public/zk-artifacts/`

**Expected artifacts:**

- `public/zk-artifacts/zkpfp.wasm` (~2MB)
- `public/zk-artifacts/zkpfp_final.zkey` (~3MB)
- `public/zk-artifacts/verification_key.json` (~1KB)

See `docs/ZK_SETUP_GUIDE.md` for detailed instructions and troubleshooting.

### 3. Set Up Supabase

**Database Schema:**

Run the migrations in `supabase/migrations/` in order:

```bash
# If using Supabase CLI
supabase db reset

# Or apply migrations manually through Supabase dashboard
```

**Key tables:**

- `encrypted_photos`: Stores encrypted image URLs, commitments, ZK proofs
- `nft_mints`: Records minted NFT addresses and metadata
- `platform_registrations`: Third-party platform API keys and credit balances
- `access_grants`: User A → Platform access permissions
- `access_sessions`: Viewer sessions with NDA signatures and time limits
- `platform_credit_transactions`: Platform payment tracking
- `nda_templates`: NDA template storage

**Storage Buckets:**

Create a public storage bucket named `encrypted-pfps` in Supabase Storage.

**Edge Functions:**

Deploy edge functions from `supabase/functions/`:

```bash
supabase functions deploy register-platform
supabase functions deploy platform-balance
supabase functions deploy grant-access
supabase functions deploy revoke-access
supabase functions deploy get-sol-price
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# Solana RPC (CRITICAL: must match your wallet network)
VITE_SOLANA_RPC_ENDPOINT=https://your-rpc-endpoint.com
# Use mainnet endpoint for production, devnet for testing
# Recommended: Helius, QuickNode, or similar private RPC

# Edge Function Secrets (set in Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MORALIS_API_KEY=your-moralis-key
SOLANA_RPC_ENDPOINT=your-rpc-endpoint
```

**Important Notes:**

- `VITE_SOLANA_RPC_ENDPOINT` must use `VITE_` prefix to be accessible in browser
- Wallet network and RPC endpoint MUST match (both mainnet or both devnet)
- Changes to `VITE_` variables require rebuild to take effect (Vite bakes them at build time)

### 5. Run Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:8080`

## Architecture Overview

### Encryption Flow

1. **Photo Capture**: User takes photo via webcam (optional name overlay)
2. **Key Generation**: Deterministic encryption key derived from wallet public key
3. **AES Encryption**: Photo encrypted with AES-256-GCM
4. **ZK Proof Generation**: snarkjs generates Groth16 proof of correct encryption
   - Inputs: encryption key bytes, wallet public key bytes
   - Outputs: commitment hash, proof, public signals
5. **Upload**: Encrypted image uploaded to Supabase Storage
6. **Database Record**: Commitment, proof, public signals stored in `encrypted_photos`
7. **On-Chain Memo**: Solana memo transaction with `zkpfp:{commitment}:{timestamp}`

### Decryption Flow

1. **Wallet Signature**: User signs message to authorize decryption
2. **Key Recovery**: Encryption key recovered from deterministic derivation
3. **Decryption**: AES-256-GCM decrypt encrypted image blob
4. **Protected Display**: Glass blur effect with mouse-reveal + screenshot prevention layers

### Third-Party API Flow

1. **Platform Registration**: Platform registers via `/register-platform` edge function
2. **User Grants Access**: User A grants platform access to specific zkPFP via UI
3. **Viewer Signs NDA**: User B (viewer) signs NDA with Solana wallet on platform
4. **Platform Pays**: Platform pays $0.50 per reveal (deducted from prepaid credits)
5. **Image Reveal**: Platform receives time-limited URL (60 min) + verification metadata
6. **Session Tracking**: Each viewer gets individual session tracked in `access_sessions`

## Third-Party Platform Integration

zkProf provides a complete API for third-party platforms (dating apps, social networks, professional platforms) to access user-encrypted photos through an NDA-gated, payment-based system.

### Integration Overview

**Business Model:**

- User A grants platform access to their zkPFP (free for user)
- User B views the image on the platform (free for viewer)
- Platform pays zkProf $0.50 USD per API call via **x402 payment rails on Solana**
- Platforms operate on prepaid credit system (top-up and debit model)

**Payment Methods:**

- SOL (Solana native token)
- USDC (USD Coin stablecoin)
- USDT (Tether stablecoin)

**Access Requirements:**

1. User A explicitly grants platform access to specific zkPFP
2. User B (viewer) cryptographically signs NDA using Solana wallet
3. Platform has sufficient prepaid credits
4. Each viewer receives individual 60-minute time-limited URL

### API Endpoints

All edge functions are deployed at: `https://chfqfdxpccxfmonhitjd.supabase.co/functions/v1/`

#### 1. Register Platform

**Endpoint:** `POST /register-platform`

**Request:**

```json
{
  "platform_name": "YourPlatform",
  "platform_domain": "yourplatform.com",
  "contact_email": "dev@yourplatform.com"
}
```

**Response:**

```json
{
  "success": true,
  "platform_id": "uuid",
  "api_key": "generated-api-key"
}
```

**Note:** Store `api_key` securely. It cannot be retrieved later. Platforms must top up credits before making API calls.

### 2. Top Up Credits (x402 Payment)

Platforms must maintain prepaid credit balance to make API calls. Credits are purchased using x402 payment protocol on Solana.

**Payment Process:**

1. Platform initiates Solana transaction sending payment (SOL/USDC/USDT) to zkProf treasury wallet
2. Transaction memo includes platform ID for credit attribution
3. zkProf backend monitors blockchain for incoming payments
4. Credits are automatically added to platform's `credit_balance_usd` in `platform_registrations` table
5. Transaction is recorded in `platform_credit_transactions` table

**Pricing:**

- $0.50 USD per zkPFP reveal/API call
- Minimum top-up: $10 USD equivalent (20 reveals)
- Credits never expire

### 3. Check Credit Balance

**Endpoint:** `POST /platform-balance`

**Headers:**

```
X-API-Key: your-api-key
```

**Response:**

```json
{
  "platform_id": "uuid",
  "credit_balance_usd": 100.00
}
```

### 4. Request Access Grant (User A Authorizes Platform)

User A must explicitly grant platform access to their zkPFP before any viewers can see it.

**Endpoint:** `POST /grant-access`

**Endpoint:** `POST /grant-access`

**Request:**

```json
{
  "blob_id": "zkpfp-blob-id",
  "platform_id": "your-platform-id",
  "wallet_public_key": "user-wallet-pubkey",
  "signature": "base64-encoded-signature"
}
```

**Signature Message Format:**

```
Grant access to zkPFP {blob_id} for platform {platform_id}
```

**Response:**

```json
{
  "success": true,
  "grant_id": "uuid"
}
```

### 4. Revoke Access

**Endpoint:** `POST /revoke-access`

**Request:**

```json
{
  "blob_id": "zkpfp-blob-id",
  "platform_id": "your-platform-id",
  "wallet_public_key": "user-wallet-pubkey",
  "signature": "base64-encoded-signature"
}
```

**Signature Message Format:**

```
Revoke access to zkPFP {blob_id} for platform {platform_id}
```

## ZK-SNARK Circuit Details

**Circuit:** `circuits/zkpfp.circom`

**Inputs:**

- `encryptionKeyBytes[32]`: AES-256 encryption key as byte array
- `walletPublicKeyBytes[32]`: Solana wallet public key as byte array

**Outputs:**

- `commitment`: Poseidon hash of (encryptionKey + walletPublicKey)

**Constraints:** ~260 (Poseidon hash operations)

**Proving System:** Groth16

**Key Coupling:** Verification key MUST be exported from the same `.zkey` used for proof generation. Mismatched keys cause silent verification failures.

## Deployment

### Frontend Deployment

1. Build production bundle:

```bash
npm run build
```

2. Deploy `dist/` folder to:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - AWS S3 + CloudFront
   - Any static hosting service

**Important:** Update environment variables in hosting platform. Changes to `VITE_` variables require rebuild.

### Edge Functions Deployment

Deploy via Supabase CLI:

```bash
supabase functions deploy
```

Or deploy individual functions:

```bash
supabase functions deploy <function-name>
```

## Key Constraints & Gotchas

1. **ZK Artifacts Required**: Application will NOT work without locally-generated ZK artifacts in `public/zk-artifacts/`

2. **Network Matching**: Wallet network and `VITE_SOLANA_RPC_ENDPOINT` MUST be on same network (mainnet or devnet)

3. **Key Coupling**: When regenerating ZK proving keys, MUST re-export verification key and redeploy both

4. **Legacy Proof Incompatibility**: Old zkPFPs created before key updates become permanently unverifiable

5. **Cache Busting**: Verification key fetches include timestamp query param to avoid stale caches

6. **Wallet-Based Auth**: No traditional email/password auth. All authorization via Solana wallet signatures

7. **Encryption Determinism**: Encryption keys derived deterministically from wallet public key enables recovery

8. **Build-Time Env Vars**: `VITE_` environment variables baked at build time, require rebuild when changed

## Security Model

- **RLS Policies**: Row Level Security on all tables based on wallet public key ownership
- **Wallet Signatures**: All privileged operations require cryptographic wallet signatures
- **ZK-SNARK Proofs**: Cryptographic proof of encryption without revealing keys
- **Time-Limited URLs**: Decrypted image URLs expire after 60 minutes
- **Screenshot Deterrents**: CSS + JS + visual protections during decryption (deterrent, not foolproof)
- **API Key Hashing**: Platform API keys stored as SHA-256 hashes in database
- **NDA Signatures**: Viewer wallet signatures serve as cryptographic NDA acceptance proof

## Contributing

This is an open-source project. Contributions welcome via pull requests.

## License

MIT License - See LICENSE file for details

## Credits

Built by [Arubaito](https://github.com/tenshijinn/arubaito)

Powered by:

- ZK-SNARKs (Circom + snarkjs)
- Solana blockchain
- ZCash cryptography research
- Supabase infrastructure
