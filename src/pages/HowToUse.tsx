import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Card } from "@/components/ui/card";
import { Camera, Lock, Zap, Shield, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import aruaitoLogo from "@/assets/arubaito-logo.png";

const HowToUse = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage="how-to-use" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-styrene font-black text-secondary mb-2">
              How To Use zkProf
            </h1>
            <p className="text-sm text-muted-foreground">
              Create encrypted profile photos with zero-knowledge proofs
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <Card className="bg-muted/20 border-border p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-styrene font-black text-secondary mb-2">
                    1. Connect Your Wallet
                  </h3>
                  <p className="text-sm text-foreground">
                    Connect your Phantom or other Solana wallet to get started. Your wallet serves as your identity and enables secure transactions.
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
                  <h3 className="text-lg font-styrene font-black text-secondary mb-2">
                    2. Take Your Photo
                  </h3>
                  <p className="text-sm text-foreground mb-2">
                    Position your face within the guide and click "Take a Photo". Your photo is captured with a timestamp and optionally your name for identification.
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
                  <h3 className="text-lg font-styrene font-black text-secondary mb-2">
                    3. Encrypt & Mint
                  </h3>
                  <p className="text-sm text-foreground mb-2">
                    Click "Encrypt & Mint" to encrypt your photo using AES-256-GCM encryption and create a ZK-SNARK proof. The encrypted data and cryptographic commitment are stored on-chain.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Cost: $0.01 USD (paid in SOL) for testing purposes.
                  </p>
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
                  <h3 className="text-lg font-styrene font-black text-secondary mb-2">
                    4. Use Your zkPFP
                  </h3>
                  <p className="text-sm text-foreground">
                    Your encrypted profile photo (zkPFP) can now be used on Arubaito and other platforms. You control who can decrypt and view your photo using zero-knowledge proofs and NDAs.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* What is ZK-SNARK? */}
          <Card className="bg-secondary/10 border-secondary/30 p-6 mt-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-styrene font-black text-secondary mb-2">
                  What is a ZK-SNARK?
                </h3>
                <p className="text-sm text-foreground mb-2">
                  ZK-SNARK stands for "Zero-Knowledge Succinct Non-Interactive Argument of Knowledge". It's a cryptographic proof that allows you to prove you know something (like an encryption key) without revealing what that something is.
                </p>
                <p className="text-sm text-foreground">
                  In zkProf, ZK-SNARKs prove you created and encrypted a photo without revealing the photo itself or the encryption key. This enables privacy-preserving identity verification.
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
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-center px-8 py-6 mt-8">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">zkProf by</span>
          <a href="https://arubaito.app" target="_blank" rel="noopener noreferrer">
            <img src={aruaitoLogo} alt="Arubaito" className="h-4" />
          </a>
        </div>
        <a href="https://github.com/tenshijinn/arubaito" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Github size={16} />
          <span>View on GitHub</span>
        </a>
      </div>
    </div>
  );
};

export default HowToUse;
