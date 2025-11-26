import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NavLink } from "@/components/NavLink";
import { ArrowLeft } from "lucide-react";

const HowToUse = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <NavLink to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to zkProf
        </NavLink>

        <h1 className="font-styrene text-4xl mb-2">How zkProf Works</h1>
        <p className="text-muted-foreground mb-12">Create encrypted profile photos in 3 simple steps</p>

        <div className="space-y-8">
          {/* Step 1 */}
          <Card className="p-8 border-border bg-card">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-styrene text-2xl text-primary">1</span>
              </div>
              <div>
                <h2 className="font-styrene text-2xl mb-3">Take Your Photo</h2>
                <p className="text-foreground/80 leading-relaxed">
                  Connect your Solana wallet and capture your profile photo using your device camera. 
                  Optionally add your name to personalize your zkPFP. The photo is processed entirely in your browser.
                </p>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="p-8 border-border bg-card">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-styrene text-2xl text-primary">2</span>
              </div>
              <div>
                <h2 className="font-styrene text-2xl mb-3">ZK-SNARK Encryption</h2>
                <p className="text-foreground/80 leading-relaxed">
                  Your photo is encrypted using AES-256-GCM with a ZK-SNARK proof generated in your browser. 
                  This cryptographically proves you own the encryption key without revealing it. 
                  The encrypted data is stored securely with your wallet as the only access key.
                </p>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="p-8 border-border bg-card">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-styrene text-2xl text-primary">3</span>
              </div>
              <div>
                <h2 className="font-styrene text-2xl mb-3">Mint on Solana</h2>
                <p className="text-foreground/80 leading-relaxed">
                  A cryptographic commitment is written to the Solana blockchain as immutable proof. 
                  Your zkPFP is now permanently secured and can be used on Arubaito and other platforms. 
                  Only you can decrypt and view the original photo using your wallet.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <NavLink to="/">
            <Button size="lg" className="font-styrene">
              Start Creating Your zkPFP
            </Button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default HowToUse;
