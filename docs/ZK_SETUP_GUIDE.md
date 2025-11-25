# zkProf ZK-SNARK Setup Guide

This comprehensive guide will walk you through generating real ZK-SNARK artifacts for zkProf. These artifacts are necessary for the application to generate cryptographic proofs that validate encrypted photos without revealing the encryption keys.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Setup (Automated)](#quick-setup-automated)
3. [Manual Setup (Step-by-Step)](#manual-setup-step-by-step)
4. [Understanding the Artifacts](#understanding-the-artifacts)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Production Considerations](#production-considerations)

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **npm** (comes with Node.js)
   - Verify: `npm --version`

3. **Git** (for cloning repositories)
   - Download: https://git-scm.com/
   - Verify: `git --version`

4. **Circom** (circuit compiler)
   - Installation instructions below

5. **Rust** (required for circom compilation)
   - Download: https://rustup.rs/
   - Verify: `rustc --version`

### System Requirements

- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: ~2GB free space
- **OS**: macOS, Linux, or Windows (with WSL2)

---

## Quick Setup (Automated)

The fastest way to generate artifacts is using our automated setup script.

### Step 1: Download the Script

The script is located at `scripts/setup-zk-artifacts.sh` in your project.

### Step 2: Make it Executable

```bash
chmod +x scripts/setup-zk-artifacts.sh
```

### Step 3: Run the Script

```bash
./scripts/setup-zk-artifacts.sh
```

### What the Script Does

1. ✅ Checks for required dependencies
2. ✅ Installs circom (macOS via Homebrew)
3. ✅ Installs snarkjs globally
4. ✅ Installs circomlib for SHA-256 circuits
5. ✅ Compiles the zkpfp.circom circuit
6. ✅ Runs the Powers of Tau ceremony
7. ✅ Generates proving and verification keys
8. ✅ Copies artifacts to `public/zk-artifacts/`
9. ✅ Runs optional verification test

### Expected Output

```
=========================================
zkProf ZK-SNARK Artifacts Setup
=========================================

✓ Node.js detected: v20.x.x
✓ npm detected: 10.x.x
✓ Circom already installed
✓ snarkjs already installed
✓ circomlib already installed
✓ Circuit compiled successfully
✓ Powers of Tau ceremony completed
✓ Keys generated successfully
✓ Artifacts installed successfully

Generated Artifacts:
  zkpfp.wasm: 1.2M
  zkpfp_final.zkey: 8.5M
  verification_key.json: 1.1K

✓ Setup Complete!
```

### Time Estimate

- First run: 10-20 minutes
- Subsequent runs: 5-10 minutes

---

## Manual Setup (Step-by-Step)

If you prefer manual control or the automated script fails, follow these steps.

### 1. Install Circom

#### macOS (Homebrew)

```bash
brew install circom
```

#### Linux (Build from Source)

```bash
# Install Rust first
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone circom repository
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom

# Verify installation
circom --version
```

#### Windows (WSL2)

Use the Linux instructions above within WSL2.

### 2. Install snarkjs

```bash
npm install -g snarkjs
```

### 3. Install circomlib

From your project root:

```bash
npm install circomlib
```

### 4. Compile the Circuit

```bash
# Create build directory
mkdir -p build/circuits

# Compile circuit
circom circuits/zkpfp.circom --r1cs --wasm --sym -o build/circuits
```

**Output Files:**
- `build/circuits/zkpfp.r1cs` - Rank-1 Constraint System (circuit constraints)
- `build/circuits/zkpfp_js/zkpfp.wasm` - WebAssembly witness calculator
- `build/circuits/zkpfp.sym` - Symbol table for debugging

### 5. Powers of Tau Ceremony

The Powers of Tau ceremony generates a common reference string (CRS) that enables zero-knowledge proofs.

```bash
# Create ceremony directory
mkdir -p build/ceremony

# Phase 1: Start new ceremony (power 14 = 2^14 = 16,384 constraints)
snarkjs powersoftau new bn128 14 build/ceremony/pot14_0000.ptau -v

# Phase 1: Contribute randomness (can be done multiple times)
snarkjs powersoftau contribute build/ceremony/pot14_0000.ptau build/ceremony/pot14_0001.ptau \
  --name="First contribution" -v

# Phase 1: Prepare for phase 2
snarkjs powersoftau prepare phase2 build/ceremony/pot14_0001.ptau build/ceremony/pot14_final.ptau -v
```

**What's Happening:**
- `new`: Creates initial ceremony parameters
- `contribute`: Adds your random contribution (enter random text when prompted)
- `prepare phase2`: Finalizes phase 1 for circuit-specific setup

**Security Note:** For production, multiple parties should contribute to prevent any single party from having the "toxic waste" that could forge proofs.

### 6. Generate Circuit-Specific Keys

```bash
# Phase 2: Setup proving key for our specific circuit
snarkjs groth16 setup build/circuits/zkpfp.r1cs build/ceremony/pot14_final.ptau build/ceremony/zkpfp_0000.zkey

# Phase 2: Contribute randomness for this circuit
snarkjs zkey contribute build/ceremony/zkpfp_0000.zkey build/ceremony/zkpfp_final.zkey \
  --name="Phase 2 contribution" -v

# Export verification key (public key for verifying proofs)
snarkjs zkey export verificationkey build/ceremony/zkpfp_final.zkey build/ceremony/verification_key.json
```

**What's Happening:**
- `setup`: Links the Powers of Tau to your specific circuit
- `contribute`: Adds randomness specific to your circuit
- `export verificationkey`: Extracts the public verification key

### 7. Copy Artifacts to Public Directory

```bash
# Create public artifacts directory
mkdir -p public/zk-artifacts

# Copy required files
cp build/circuits/zkpfp_js/zkpfp.wasm public/zk-artifacts/
cp build/ceremony/zkpfp_final.zkey public/zk-artifacts/
cp build/ceremony/verification_key.json public/zk-artifacts/
```

**These files must be in `public/zk-artifacts/` for the app to work!**

---

## Understanding the Artifacts

### zkpfp.wasm (~1-2 MB)

**Purpose:** Witness calculator  
**Used For:** Computing the witness (private inputs and intermediate values) in the browser  
**Contains:** Compiled circuit logic as WebAssembly

### zkpfp_final.zkey (~5-20 MB)

**Purpose:** Proving key  
**Used For:** Generating ZK-SNARK proofs in the browser  
**Contains:** Encrypted parameters from the trusted setup ceremony  
**Security:** Cannot forge proofs without the "toxic waste" from ceremony

### verification_key.json (~1 KB)

**Purpose:** Verification key  
**Used For:** Verifying proofs (on-chain or in browser)  
**Contains:** Public parameters for proof verification  
**Can Be:** Safely shared publicly

---

## Verification

After setup, verify everything works correctly.

### Test Proof Generation

Create a test input file:

```bash
cat > build/test_input.json << 'EOF'
{
  "symmetricKey": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],
  "iv": [1,2,3,4,5,6,7,8,9,10,11,12],
  "walletPubKey": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]
}
EOF
```

Generate and verify proof:

```bash
# Generate proof
snarkjs groth16 fullprove build/test_input.json \
  public/zk-artifacts/zkpfp.wasm \
  public/zk-artifacts/zkpfp_final.zkey \
  build/test_proof.json \
  build/test_public.json

# Verify proof
snarkjs groth16 verify \
  public/zk-artifacts/verification_key.json \
  build/test_public.json \
  build/test_proof.json
```

**Expected Output:**

```
[INFO]  snarkJS: OK!
```

### Test in Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser

3. Connect your Solana wallet

4. Take a photo and encrypt it

5. Check browser console for:
   ```
   Generating ZK-SNARK proof...
   ZK-SNARK proof generated successfully
   ```

6. Look for the "ZK-SNARK Verified ✓" badge on minted photos

---

## Troubleshooting

### "circom: command not found"

**Solution:** Install circom following the [installation instructions](#1-install-circom)

### "Out of memory" during compilation

**Solution:** Increase Node.js heap size:

```bash
export NODE_OPTIONS="--max-old-space-size=8192"
```

Then retry the compilation step.

### "Constraint count exceeds power"

**Error Message:** `Error: constraint count 50000 exceeds power 16384`

**Solution:** Increase the Powers of Tau power (14 → 15):

```bash
snarkjs powersoftau new bn128 15 build/ceremony/pot15_0000.ptau -v
```

Then repeat steps 5-7 with `pot15` instead of `pot14`.

### Slow proof generation in browser

**Cause:** Large proving key size  
**Solutions:**
1. Optimize circuit constraints
2. Use a smaller Powers of Tau power (if circuit permits)
3. Host artifacts on CDN for faster loading

### Artifacts not loading in browser

**Check:**
1. Files are in `public/zk-artifacts/` (not `build/`)
2. File names match exactly: `zkpfp.wasm`, `zkpfp_final.zkey`, `verification_key.json`
3. Development server has been restarted
4. Browser cache has been cleared

### "Failed to generate ZK-SNARK proof"

**Debug Steps:**
1. Open browser console (F12)
2. Look for specific error messages
3. Verify artifacts loaded correctly (Network tab)
4. Check that wallet is connected
5. Verify input formats are correct

---

## Production Considerations

### Security Best Practices

1. **Multi-Party Ceremony**
   - For production, run a multi-party computation (MPC) ceremony
   - Have 3+ independent parties contribute randomness
   - Document all participants and their contributions
   - Store ceremony transcripts

2. **Artifact Verification**
   - Verify all artifacts are correctly generated
   - Compare hashes with other participants
   - Run extensive test suites before deployment

3. **Key Management**
   - Delete `pot14_0000.ptau` and intermediate `.zkey` files after setup
   - Keep only `pot14_final.ptau`, `zkpfp_final.zkey`, and verification keys
   - Never expose proving keys source code or ceremony randomness

### Performance Optimization

1. **CDN Hosting**
   - Host large artifacts (`.wasm`, `.zkey`) on a CDN
   - Reduces initial load time
   - Improves global accessibility

2. **Lazy Loading**
   - Load artifacts only when needed (before first encryption)
   - Show loading indicator during download

3. **Caching**
   - Set appropriate cache headers for artifacts
   - Use service workers for offline capability

### Circuit Updates

**Important:** Any change to `circuits/zkpfp.circom` requires regenerating all artifacts!

**Process:**
1. Update circuit code
2. Increment circuit version
3. Re-run entire setup process
4. Update artifact file names to include version
5. Update code to reference new artifact paths
6. Deploy new artifacts and code together

### Monitoring

Track these metrics in production:
- Proof generation time (should be <30 seconds)
- Proof verification success rate (should be 100%)
- Artifact loading time
- User errors during encryption/minting

---

## Additional Resources

- **Circom Documentation:** https://docs.circom.io/
- **snarkjs Documentation:** https://github.com/iden3/snarkjs
- **ZK-SNARK Explainer:** https://z.cash/technology/zksnarks/
- **Trusted Setup Ceremonies:** https://ceremony.ethereum.org/

---

## Need Help?

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review browser console for error messages
3. Verify all prerequisites are installed correctly
4. Check that file paths match exactly

---

**Last Updated:** November 2024  
**Circuit Version:** 1.0.0  
**Compatible With:** zkProf v1.x
