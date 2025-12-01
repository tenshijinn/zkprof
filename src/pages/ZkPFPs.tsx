import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Card } from "@/components/ui/card";
import { Trash2, ExternalLink, Github, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ZKProofVerifier } from "@/components/ZKProofVerifier";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import aruaitoLogo from "@/assets/arubaito-logo.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProtectedImageReveal } from "@/components/ProtectedImageReveal";
import { decryptImage } from "@/lib/crypto";

const ZkPFPs = () => {
  const { publicKey, connected } = useWallet();
  const [mintedNFTs, setMintedNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  const [isDecryptModalOpen, setIsDecryptModalOpen] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

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

  const decryptAndViewNFT = async (nft: any) => {
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsDecrypting(true);
    setIsDecryptModalOpen(true);

    try {
      // Fetch encrypted photo data from database
      const { data: photoData, error: photoError } = await supabase
        .from("encrypted_photos")
        .select("encrypted_image_url, encrypted_key, iv")
        .eq("blob_id", nft.blob_id)
        .single();

      if (photoError || !photoData) {
        throw new Error("Failed to fetch encrypted photo data");
      }

      // Fetch the encrypted image blob from storage
      const { data: blobData, error: blobError } = await supabase.storage
        .from("encrypted-pfps")
        .download(`${nft.blob_id}.enc`);

      if (blobError || !blobData) {
        throw new Error("Failed to fetch encrypted image");
      }

      // Convert blob to base64
      const arrayBuffer = await blobData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const encryptedDataBase64 = btoa(binary);

      // Decrypt the image
      const decryptedDataUrl = await decryptImage(
        encryptedDataBase64,
        photoData.encrypted_key,
        photoData.iv,
        publicKey.toBase58()
      );

      setDecryptedImage(decryptedDataUrl);
      toast.success("Image decrypted successfully");
    } catch (error: any) {
      console.error("Decryption error:", error);
      toast.error(error.message || "Failed to decrypt image");
      setIsDecryptModalOpen(false);
    } finally {
      setIsDecrypting(false);
    }
  };

  const closeDecryptModal = () => {
    setIsDecryptModalOpen(false);
    setDecryptedImage(null);
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
                    
                    {/* ZK Transaction Details */}
                    <div className="space-y-1 text-xs">
                      <div className="text-muted-foreground">
                        <span className="font-semibold">Commitment:</span>
                        <div className="font-mono text-[10px] break-all">
                          {nft.metadata_uri.replace('https://arweave.net/', '').replace('zkpfp:commitment:', '')}
                        </div>
                      </div>
                      {nft.mint_address && (
                        <div className="text-muted-foreground">
                          <span className="font-semibold">Mint:</span>
                          <div className="font-mono text-[10px] break-all">
                            {nft.mint_address}
                          </div>
                        </div>
                      )}
                      <div className="text-muted-foreground">
                        <span className="font-semibold">Signature:</span>
                        <div className="font-mono text-[10px] break-all">
                          {nft.payment_signature}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => decryptAndViewNFT(nft)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Decrypt & Preview
                      </Button>
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

      {/* Decrypt Modal */}
      <Dialog open={isDecryptModalOpen} onOpenChange={closeDecryptModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-styrene font-black text-xl">
              Protected zkPFP Preview
            </DialogTitle>
          </DialogHeader>
          {isDecrypting ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-muted-foreground">Decrypting image...</p>
              </div>
            </div>
          ) : decryptedImage ? (
            <ProtectedImageReveal
              imageDataUrl={decryptedImage}
              walletAddress={publicKey?.toBase58() || ""}
              viewingTimeSeconds={30}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZkPFPs;
