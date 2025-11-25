#!/bin/bash

# zkProf ZK-SNARK Artifacts Setup Script
# This script automates the generation of trusted setup artifacts for zkProf
# Run this script from the project root directory

set -e  # Exit on any error

echo "========================================="
echo "zkProf ZK-SNARK Artifacts Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js detected: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm detected: $(npm --version)${NC}"
echo ""

# Step 1: Install circom
echo "========================================="
echo "Step 1: Installing Circom"
echo "========================================="
echo ""

if ! command -v circom &> /dev/null; then
    echo "Circom not found. Installing circom..."
    
    # Check OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install circom
        else
            echo -e "${YELLOW}Warning: Homebrew not found. Please install circom manually from https://docs.circom.io/getting-started/installation/${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Please install circom manually from https://docs.circom.io/getting-started/installation/"
        exit 1
    else
        echo -e "${RED}Unsupported OS. Please install circom manually from https://docs.circom.io/getting-started/installation/${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Circom already installed: $(circom --version)${NC}"
fi
echo ""

# Step 2: Install snarkjs
echo "========================================="
echo "Step 2: Installing snarkjs"
echo "========================================="
echo ""

if ! command -v snarkjs &> /dev/null; then
    echo "Installing snarkjs globally..."
    npm install -g snarkjs
else
    echo -e "${GREEN}✓ snarkjs already installed${NC}"
fi
echo ""

# Step 3: Install circomlib
echo "========================================="
echo "Step 3: Installing circomlib"
echo "========================================="
echo ""

if [ ! -d "node_modules/circomlib" ]; then
    echo "Installing circomlib..."
    npm install circomlib
else
    echo -e "${GREEN}✓ circomlib already installed${NC}"
fi
echo ""

# Step 4: Compile the circuit
echo "========================================="
echo "Step 4: Compiling zkpfp.circom circuit"
echo "========================================="
echo ""

mkdir -p build/circuits

echo "Compiling circuit (this may take a few minutes)..."
circom circuits/zkpfp.circom --r1cs --wasm --sym -o build/circuits

if [ -f "build/circuits/zkpfp.r1cs" ]; then
    echo -e "${GREEN}✓ Circuit compiled successfully${NC}"
    echo "  - build/circuits/zkpfp.r1cs (constraint system)"
    echo "  - build/circuits/zkpfp.wasm (witness calculator)"
    echo "  - build/circuits/zkpfp.sym (debug symbols)"
else
    echo -e "${RED}Error: Circuit compilation failed${NC}"
    exit 1
fi
echo ""

# Step 5: Powers of Tau ceremony
echo "========================================="
echo "Step 5: Powers of Tau Ceremony"
echo "========================================="
echo ""

mkdir -p build/ceremony

echo "Starting new Powers of Tau ceremony (constraint power: 14)..."
snarkjs powersoftau new bn128 14 build/ceremony/pot14_0000.ptau -v

echo "Contributing to ceremony (adding randomness)..."
snarkjs powersoftau contribute build/ceremony/pot14_0000.ptau build/ceremony/pot14_0001.ptau \
    --name="First contribution" \
    --entropy="$(date +%s)$(openssl rand -hex 32)" \
    -v

echo "Preparing phase 2..."
snarkjs powersoftau prepare phase2 build/ceremony/pot14_0001.ptau build/ceremony/pot14_final.ptau -v

echo -e "${GREEN}✓ Powers of Tau ceremony completed${NC}"
echo ""

# Step 6: Generate proving and verification keys
echo "========================================="
echo "Step 6: Generating Keys"
echo "========================================="
echo ""

echo "Generating proving key (.zkey)..."
snarkjs groth16 setup build/circuits/zkpfp.r1cs build/ceremony/pot14_final.ptau build/ceremony/zkpfp_0000.zkey

echo "Contributing to phase 2 ceremony..."
snarkjs zkey contribute build/ceremony/zkpfp_0000.zkey build/ceremony/zkpfp_final.zkey \
    --name="Phase 2 contribution" \
    --entropy="$(date +%s)$(openssl rand -hex 32)" \
    -v

echo "Exporting verification key..."
snarkjs zkey export verificationkey build/ceremony/zkpfp_final.zkey build/ceremony/verification_key.json

echo -e "${GREEN}✓ Keys generated successfully${NC}"
echo ""

# Step 7: Copy artifacts to public directory
echo "========================================="
echo "Step 7: Installing Artifacts"
echo "========================================="
echo ""

mkdir -p public/zk-artifacts

echo "Copying artifacts to public/zk-artifacts/..."
cp build/circuits/zkpfp_js/zkpfp.wasm public/zk-artifacts/
cp build/ceremony/zkpfp_final.zkey public/zk-artifacts/
cp build/ceremony/verification_key.json public/zk-artifacts/

echo -e "${GREEN}✓ Artifacts installed successfully${NC}"
echo ""

# Step 8: Display file sizes
echo "========================================="
echo "Generated Artifacts"
echo "========================================="
echo ""

echo "File sizes:"
ls -lh public/zk-artifacts/zkpfp.wasm | awk '{print "  zkpfp.wasm: " $5}'
ls -lh public/zk-artifacts/zkpfp_final.zkey | awk '{print "  zkpfp_final.zkey: " $5}'
ls -lh public/zk-artifacts/verification_key.json | awk '{print "  verification_key.json: " $5}'
echo ""

# Step 9: Optional verification test
echo "========================================="
echo "Step 9: Verification Test (Optional)"
echo "========================================="
echo ""

read -p "Would you like to run a verification test? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating test input..."
    cat > build/test_input.json << EOF
{
  "symmetricKey": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],
  "iv": [1,2,3,4,5,6,7,8,9,10,11,12],
  "walletPubKey": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]
}
EOF

    echo "Generating test proof..."
    snarkjs groth16 fullprove build/test_input.json build/circuits/zkpfp_js/zkpfp.wasm build/ceremony/zkpfp_final.zkey build/test_proof.json build/test_public.json

    echo "Verifying test proof..."
    snarkjs groth16 verify build/ceremony/verification_key.json build/test_public.json build/test_proof.json

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Verification test passed!${NC}"
    else
        echo -e "${RED}✗ Verification test failed${NC}"
    fi
    
    echo "Cleaning up test files..."
    rm -f build/test_input.json build/test_proof.json build/test_public.json
fi

echo ""
echo "========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "ZK-SNARK artifacts have been generated and installed."
echo "Your zkProf application is now ready to generate real ZK proofs!"
echo ""
echo "Next steps:"
echo "  1. Restart your development server (if running)"
echo "  2. Test the encryption and minting flow"
echo "  3. Verify that ZK proofs are being generated"
echo ""
echo "Build artifacts saved in: build/"
echo "Public artifacts saved in: public/zk-artifacts/"
echo ""
echo -e "${YELLOW}Note: The build/ directory can be deleted after successful setup.${NC}"
echo -e "${YELLOW}The public/zk-artifacts/ directory is required for the app to function.${NC}"
echo ""
