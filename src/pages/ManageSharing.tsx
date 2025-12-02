import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, ExternalLink, Shield } from "lucide-react";
import { useWalletBalance } from "@/hooks/useWalletBalance";

interface Platform {
  id: string;
  platform_name: string;
  platform_domain: string;
  created_at: string;
}

interface NFT {
  id: string;
  blob_id: string;
  mint_address: string;
  created_at: string;
}

interface AccessGrant {
  platform_id: string;
  is_active: boolean;
}

const ManageSharing = () => {
  const { publicKey, signMessage } = useWallet();
  const { walletBalance, solPrice } = useWalletBalance();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [accessGrants, setAccessGrants] = useState<Record<string, AccessGrant[]>>({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (publicKey) {
      fetchData();
    }
  }, [publicKey]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all platforms
      const { data: platformsData, error: platformsError } = await supabase
        .from('platform_registrations')
        .select('*')
        .eq('is_active', true)
        .order('platform_name');

      if (platformsError) throw platformsError;
      setPlatforms(platformsData || []);

      // Fetch user's NFTs
      const { data: nftsData, error: nftsError } = await supabase
        .from('nft_mints')
        .select('*')
        .eq('user_public_key', publicKey!.toBase58())
        .order('created_at', { ascending: false });

      if (nftsError) throw nftsError;
      setNfts(nftsData || []);

      // Fetch access grants for user's NFTs
      const blobIds = nftsData?.map(nft => nft.blob_id) || [];
      if (blobIds.length > 0) {
        const { data: grantsData, error: grantsError } = await supabase
          .from('access_grants')
          .select('blob_id, platform_id, is_active')
          .in('blob_id', blobIds)
          .eq('owner_wallet', publicKey!.toBase58());

        if (grantsError) throw grantsError;

        // Group grants by blob_id
        const grantsByBlob: Record<string, AccessGrant[]> = {};
        grantsData?.forEach(grant => {
          if (!grantsByBlob[grant.blob_id]) {
            grantsByBlob[grant.blob_id] = [];
          }
          grantsByBlob[grant.blob_id].push({
            platform_id: grant.platform_id,
            is_active: grant.is_active
          });
        });
        setAccessGrants(grantsByBlob);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load sharing settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccess = async (blobId: string, platformId: string, currentlyActive: boolean) => {
    if (!publicKey || !signMessage) {
      toast.error('Please connect your wallet');
      return;
    }

    const toggleKey = `${blobId}-${platformId}`;
    setToggling(prev => ({ ...prev, [toggleKey]: true }));

    try {
      const action = currentlyActive ? 'Revoke' : 'Grant';
      const message = `${action} access to zkPFP ${blobId} for platform ${platformId}`;
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = btoa(String.fromCharCode(...signatureBytes));

      const endpoint = currentlyActive ? 'revoke-access' : 'grant-access';
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: {
          blob_id: blobId,
          platform_id: platformId,
          wallet_public_key: publicKey.toBase58(),
          signature
        }
      });

      if (error) throw error;

      toast.success(`Access ${currentlyActive ? 'revoked' : 'granted'} successfully`);
      await fetchData();
    } catch (error: any) {
      console.error('Error toggling access:', error);
      toast.error(error.message || `Failed to ${currentlyActive ? 'revoke' : 'grant'} access`);
    } finally {
      setToggling(prev => ({ ...prev, [toggleKey]: false }));
    }
  };

  const isAccessGranted = (blobId: string, platformId: string): boolean => {
    const grants = accessGrants[blobId] || [];
    const grant = grants.find(g => g.platform_id === platformId);
    return grant?.is_active || false;
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header currentPage="manage-sharing" walletBalance={walletBalance} solPrice={solPrice} />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Please connect your Solana wallet to manage zkPFP sharing settings
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage="manage-sharing" walletBalance={walletBalance} solPrice={solPrice} />
      <div className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-[800px]">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Manage zkPFP Sharing</h1>
            <p className="text-muted-foreground">
              Control which platforms can access your encrypted profile photos
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : nfts.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No zkPFPs Found</CardTitle>
                <CardDescription>
                  You haven't created any zkPFPs yet. Go to the Take Photo page to create your first encrypted profile photo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.href = '/take-photo'}>
                  Take a Photo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {nfts.map((nft) => (
                <Card key={nft.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      zkPFP #{nft.mint_address.slice(0, 8)}...
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(nft.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {platforms.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No platforms available yet. Check back later.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {platforms.map((platform) => {
                          const isGranted = isAccessGranted(nft.blob_id, platform.id);
                          const toggleKey = `${nft.blob_id}-${platform.id}`;
                          const isToggling = toggling[toggleKey];

                          return (
                            <div
                              key={platform.id}
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{platform.platform_name}</h3>
                                  <a
                                    href={`https://${platform.platform_domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                  >
                                    {platform.platform_domain}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {isGranted
                                    ? 'This platform can request access to your zkPFP'
                                    : 'This platform cannot access your zkPFP'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isToggling && <Loader2 className="w-4 h-4 animate-spin" />}
                                <Switch
                                  checked={isGranted}
                                  onCheckedChange={() =>
                                    toggleAccess(nft.blob_id, platform.id, isGranted)
                                  }
                                  disabled={isToggling}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageSharing;