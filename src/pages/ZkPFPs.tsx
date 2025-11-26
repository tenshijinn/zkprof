import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Card } from "@/components/ui/card";
import { Trash2, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ZKProofVerifier } from "@/components/ZKProofVerifier";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import aruaitoLogo from "@/assets/arubaito-logo.jpeg";

const ZkPFPs = () => {
  const { publicKey, connected } = useWallet();
  const [mintedNFTs, setMintedNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMintedNFTs = async () => {
      if (!publicKey) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("nft_mints")
          .select("*")
          .eq("user_public_key", publicKey.toBase58())
          .order("created_at", { ascending: false });

        if (error) throw error;
        setMintedNFTs(data || []);
      } catch (error) {
        console.error("Failed to fetch minted NFTs:", error);
        toast.error("Failed to load zkPFPs");
      } finally {
        setLoading(false);
      }
    };

    fetchMintedNFTs();
  }, [publicKey, connected]);

  const burnNFT = async (nftId: string) => {
    try {
      toast.loading("Removing zkPFP...");
      
      const { error } = await supabase
        .from("nft_mints")
        .delete()
        .eq("id", nftId);

      if (error) throw error;

      setMintedNFTs((prev) => prev.filter((nft) => nft.id !== nftId));
      
      toast.dismiss();
      toast.success("zkPFP removed successfully");
    } catch (error) {
      console.error("Burn error:", error);
      toast.dismiss();
      toast.error("Failed to remove zkPFP");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage="zkpfps" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-styrene font-black text-secondary mb-2">
              Your zkPFPs
            </h1>
            <p className="text-sm text-muted-foreground">
              View and manage your encrypted profile photos
            </p>
          </div>

          {!connected ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6">
                Connect your wallet to view your zkPFPs
              </p>
              <WalletMultiButton className="!h-12 !rounded-xl !font-styrene !font-black !text-base !bg-secondary !text-[#181818] !border-2 !border-secondary hover:!bg-transparent hover:!text-[#ed565a] hover:!border-[#ed565a]" />
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : mintedNFTs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6">
                You haven't created any zkPFPs yet
              </p>
              <Link to="/">
                <Button
                  className="h-12 rounded-xl font-styrene font-black text-base bg-secondary text-[#181818] border-2 border-secondary hover:bg-transparent hover:text-[#ed565a] hover:border-[#ed565a]"
                >
                  Create Your First zkPFP
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mintedNFTs.map((nft) => (
                <Card
                  key={nft.id}
                  className="bg-muted/20 border-border overflow-hidden"
                >
                  <div className="aspect-square bg-muted/40 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-xs text-muted-foreground mb-2">
                        Encrypted Photo
                      </div>
                      <div className="text-2xl">🔒</div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="text-xs text-muted-foreground">
                      {new Date(nft.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    
                    {nft.zk_proof && nft.zk_public_signals && (
                      <ZKProofVerifier
                        proofData={nft.zk_proof}
                        publicSignals={nft.zk_public_signals}
                        commitment={nft.metadata_uri}
                      />
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() =>
                          window.open(
                            `https://explorer.solana.com/tx/${nft.payment_signature}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => burnNFT(nft.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Burn
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full flex justify-between items-center px-8 py-6 mt-auto">
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

export default ZkPFPs;
