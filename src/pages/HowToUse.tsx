import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Lock, Zap, Shield, Github, Code, CreditCard, FileText, Key } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import arubaitoLogo from "@/assets/arubaito-logo-new.png";
import { useWalletBalance } from "@/hooks/useWalletBalance";

const HowToUse = () => {
  const { walletBalance, solPrice } = useWalletBalance();

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Header currentPage="how-to-use" walletBalance={walletBalance} solPrice={solPrice} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-[800px]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-styrene font-black text-secondary mb-2">How To Use zkProf</h1>
            <p className="text-sm text-muted-foreground">Create encrypted profile photos with zero-knowledge proofs</p>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="users">For Users</TabsTrigger>
              <TabsTrigger value="developers">For Developers</TabsTrigger>
            </TabsList>

            {/* FOR USERS TAB */}
            <TabsContent value="users">
              <div className="space-y-6">
                {/* Step 1 */}
                <Card className="bg-muted/20 border-border p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-styrene font-black text-secondary mb-2">1. Connect Your Wallet</h3>
                      <p className="text-sm text-foreground">
                        Connect your Phantom or other Solana wallet to get started. Your wallet serves as your identity and
                        enables secure transactions.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Step 2 */}
                <Card className="bg-muted/20 border-border p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-styrene font-black text-secondary mb-2">2. Take Your Photo</h3>
                      <p className="text-sm text-foreground mb-2">
                        Position your face within the guide and click "Take a Photo". Your photo is captured with a
                        timestamp and optionally your name for identification.
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        Privacy note: Your photo never leaves your device unencrypted.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Step 3 */}
                <Card className="bg-muted/20 border-border p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-styrene font-black text-secondary mb-2">3. Encrypt & Mint</h3>
                      <p className="text-sm text-foreground mb-2">
                        Click "Encrypt & Mint" to encrypt your photo using AES-256-GCM encryption and create a ZK-SNARK
                        proof. The encrypted data and cryptographic commitment are stored on-chain.
                      </p>
                      <p className="text-xs text-muted-foreground italic">Cost: $5.00 USD (paid in SOL).</p>
                    </div>
                  </div>
                </Card>

                {/* Step 4 */}
                <Card className="bg-muted/20 border-border p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-styrene font-black text-secondary mb-2">4. Use Your zkPFP</h3>
                      <p className="text-sm text-foreground">
                        Your encrypted profile photo (zkPFP) can now be used on Arubaito and other platforms. You control
                        who can decrypt and view your photo using zero-knowledge proofs and NDAs.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* What is ZK-SNARK? */}
                <Card className="bg-secondary/10 border-secondary/30 p-6 mt-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-styrene font-black text-secondary mb-2">What is a ZK-SNARK?</h3>
                      <p className="text-sm text-foreground mb-2">
                        ZK-SNARK stands for "Zero-Knowledge Succinct Non-Interactive Argument of Knowledge". It's a
                        cryptographic proof that allows you to prove you know something (like an encryption key) without
                        revealing what that something is.
                      </p>
                      <p className="text-sm text-foreground">
                        In zkProf, ZK-SNARKs prove you created and encrypted a photo without revealing the photo itself or the
                        encryption key. This enables privacy-preserving identity verification.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* CTA */}
                <div className="text-center mt-12">
                  <Link
                    to="/"
                    className="inline-block px-8 py-3 rounded-xl font-styrene font-black text-base bg-secondary text-[#181818] border-2 border-secondary hover:bg-transparent hover:text-[#ed565a] hover:border-[#ed565a] transition-colors"
                  >
                    Create Your zkPFP
                  </Link>
                </div>
              </div>
            </TabsContent>

            {/* FOR DEVELOPERS TAB */}
            <TabsContent value="developers">
              <div className="space-y-6">
                {/* Introduction */}
                <Card className="bg-muted/20 border-border p-6">
                  <h3 className="text-lg font-styrene font-black text-secondary mb-3">Platform Integration</h3>
                  <p className="text-sm text-foreground mb-3">
                    zkProf allows third-party platforms to display user zkPFPs with NDA-gated access. Integrate our API to 
                    enable privacy-preserving identity verification on your platform.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cost: <strong>$0.50 USD per reveal</strong> (prepaid credit system)
                  </p>
                </Card>

                {/* Getting Started */}
                <Card className="bg-muted/20 border-border p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Key className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-styrene font-black text-secondary mb-2">1. Register Your Platform</h3>
                      <p className="text-sm text-foreground mb-3">
                        Register to receive an API key. Store this key securely - it cannot be retrieved later.
                      </p>
                      <pre className="bg-background/50 p-3 rounded-lg text-xs overflow-x-auto">
{`POST /functions/v1/register-platform

{
  "platform_name": "Your Platform",
  "platform_domain": "yourplatform.com",
  "contact_email": "dev@yourplatform.com"
}

Response:
{
  "platform_id": "uuid",
  "api_key": "zkp_..." // Store securely!
}`}
                      </pre>
                    </div>
                  </div>
                </Card>

                {/* Top Up */}
                <Card className="bg-muted/20 border-border p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-styrene font-black text-secondary mb-2">2. Top Up Credits</h3>
                      <p className="text-sm text-foreground mb-3">
                        Send SOL to the zkProf wallet, then register the payment. Credits are deducted per reveal ($0.50).
                      </p>
                      <pre className="bg-background/50 p-3 rounded-lg text-xs overflow-x-auto">
{`POST /functions/v1/platform-topup
Headers: x-api-key: your_api_key

{
  "amount_usd": 50.00,
  "solana_signature": "tx_signature..."
}

Response:
{
  "new_balance": 50.00,
  "transaction_id": "uuid"
}`}
                      </pre>
                    </div>
                  </div>
                </Card>

                {/* NDA Flow */}
                <Card className="bg-muted/20 border-border p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-styrene font-black text-secondary mb-2">3. NDA Signing Flow</h3>
                      <p className="text-sm text-foreground mb-3">
                        Before revealing a zkPFP, viewers must sign an NDA using their Solana wallet.
                      </p>
                      <pre className="bg-background/50 p-3 rounded-lg text-xs overflow-x-auto mb-3">
{`// Step A: Get NDA template
POST /functions/v1/get-nda-template

{
  "blob_id": "zkpfp_blob_id",
  "platform_id": "your_platform_id",
  "viewer_wallet": "viewer_public_key"
}

Response:
{
  "nda_content": "...",
  "nda_hash": "sha256_hash",
  "owner_wallet": "owner_public_key"
}`}
                      </pre>
                      <pre className="bg-background/50 p-3 rounded-lg text-xs overflow-x-auto">
{`// Step B: Submit signed NDA
POST /functions/v1/sign-nda
Headers: x-api-key: your_api_key

{
  "blob_id": "zkpfp_blob_id",
  "platform_id": "your_platform_id",
  "viewer_wallet": "viewer_public_key",
  "signature": "wallet_signature",
  "nda_hash": "sha256_hash",
  "consent_given": true
}

Response:
{
  "session_id": "uuid",
  "expires_at": "ISO_timestamp"
}`}
                      </pre>
                    </div>
                  </div>
                </Card>

                {/* Reveal */}
                <Card className="bg-muted/20 border-border p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Code className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-styrene font-black text-secondary mb-2">4. Reveal zkPFP</h3>
                      <p className="text-sm text-foreground mb-3">
                        With a valid session, request the encrypted image data. Decrypt client-side using the provided keys.
                      </p>
                      <pre className="bg-background/50 p-3 rounded-lg text-xs overflow-x-auto">
{`POST /functions/v1/reveal-zkpfp
Headers: x-api-key: your_api_key

{
  "session_id": "session_uuid"
}

Response:
{
  "encrypted_image_url": "https://...",
  "iv": "base64_iv",
  "encrypted_key": "base64_key",
  "commitment": "zk_commitment",
  "zk_proof": "proof_data",
  "zk_public_signals": ["..."]
}`}
                      </pre>
                    </div>
                  </div>
                </Card>

                {/* NDA Terms Link */}
                <Card className="bg-secondary/10 border-secondary/30 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-styrene font-black text-secondary mb-2">NDA Terms & Compliance</h3>
                      <p className="text-sm text-foreground mb-3">
                        Our NDA is compliant with ESIGN Act, UETA, and eIDAS regulations. View the full template:
                      </p>
                      <Link
                        to="/nda"
                        className="inline-block text-sm text-secondary hover:underline"
                      >
                        View NDA Template →
                      </Link>
                    </div>
                  </div>
                </Card>

                {/* GitHub */}
                <div className="text-center mt-8">
                  <a
                    href="https://github.com/tenshijinn/zkprof"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-styrene font-black text-base border-2 border-border text-foreground hover:border-secondary hover:text-secondary transition-colors"
                  >
                    <Github size={20} />
                    View SDK & Examples on GitHub
                  </a>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer - Hidden on mobile */}
      <div className="hidden md:flex w-full justify-between items-center px-8 py-6 mt-8">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">zkProf by</span>
          <a href="https://arubaito.app" target="_blank" rel="noopener noreferrer">
            <img src={arubaitoLogo} alt="Arubaito" className="h-4" />
          </a>
        </div>
        <a
          href="https://github.com/tenshijinn/zkprof"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github size={16} />
          <span>View on GitHub</span>
        </a>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default HowToUse;
