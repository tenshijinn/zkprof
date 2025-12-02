import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { supabase } from "@/integrations/supabase/client";
import { Shield, FileText, Scale, Globe } from "lucide-react";
import arubaitoLogo from "@/assets/arubaito-logo.png";

const NDA = () => {
  const { walletBalance, solPrice } = useWalletBalance();
  const [ndaContent, setNdaContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNdaTemplate = async () => {
      const { data, error } = await supabase
        .from("nda_templates")
        .select("template_content")
        .eq("is_default", true)
        .single();

      if (data && !error) {
        // Show template with placeholder indicators
        const displayContent = data.template_content
          .replace(/\{\{timestamp\}\}/g, "[Signing Date/Time]")
          .replace(/\{\{owner_wallet\}\}/g, "[zkPFP Owner Wallet]")
          .replace(/\{\{viewer_wallet\}\}/g, "[Your Wallet Address]")
          .replace(/\{\{platform_name\}\}/g, "[Platform Name]")
          .replace(/\{\{nda_hash\}\}/g, "[Document Hash]");
        setNdaContent(displayContent);
      }
      setLoading(false);
    };

    fetchNdaTemplate();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header currentPage="nda" walletBalance={walletBalance} solPrice={solPrice} />

      <div className="flex-1 px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-styrene font-black text-secondary">
              NDA Terms & Compliance
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Review the Non-Disclosure Agreement that viewers must sign before accessing your zkPFP.
              This agreement is legally binding and compliant with international electronic signature laws.
            </p>
          </div>

          {/* Compliance Badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
              <Shield className="h-4 w-4 text-primary" />
              ESIGN Act (USA)
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
              <Scale className="h-4 w-4 text-primary" />
              UETA Compliant
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
              <Globe className="h-4 w-4 text-primary" />
              eIDAS (EU)
            </Badge>
          </div>

          {/* NDA Content */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Non-Disclosure Agreement Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg overflow-auto max-h-[600px]">
                    {ndaContent}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Points */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Key Points for Viewers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-secondary">What Viewers Agree To:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Keep the viewed image confidential</li>
                    <li>• Not screenshot, copy, or share the image</li>
                    <li>• 60-minute viewing window only</li>
                    <li>• Wallet signature serves as legal signature</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-secondary">Audit Trail Recorded:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Wallet address of signer</li>
                    <li>• Timestamp of signing</li>
                    <li>• IP address and browser info</li>
                    <li>• On-chain Solana memo proof</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Notice */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong className="text-secondary">Legal Notice:</strong> This NDA template is provided for informational purposes.
                The agreement becomes legally binding when a viewer signs it using their Solana wallet.
                All signatures are recorded on the Solana blockchain for immutable proof of agreement.
                zkProf retains signing records for a minimum of 7 years in compliance with electronic signature regulations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-4 border-t border-border/30">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            zkProf NDA — ESIGN, UETA, and eIDAS Compliant
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">by</span>
            <a href="https://arubaito.app" target="_blank" rel="noopener noreferrer">
              <img src={arubaitoLogo} alt="Arubaito" className="h-4" />
            </a>
          </div>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  );
};

export default NDA;
