import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Github, Wallet, Trash2, ExternalLink } from "lucide-react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { encryptImage } from "@/lib/crypto";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import faceGuide from "@/assets/pfp-guide.png";
import zcashLogo from "@/assets/zcash-logo.png";
import solanaLogo from "@/assets/solana-logo.png";
import zkProfLogo from "@/assets/zkprof-logo.png";
import { Card } from "@/components/ui/card";
type AppState = "idle" | "photo-taken" | "encrypting" | "minting" | "success";
const RECIPIENT_ADDRESS = "8DuKPJAqMEa84VTcDfqF967CUG98Tf6DdtfyJFviSKL6";
const PAYMENT_AMOUNT_USD = 0.01; // $0.01 for testing, will change to 5.00 for production

const fetchSolPrice = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    return data.solana.usd;
  } catch (error) {
    console.error('Failed to fetch SOL price:', error);
    throw new Error('Unable to fetch SOL price. Please try again.');
  }
};

const Index = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [state, setState] = useState<AppState>("idle");
  const [progress, setProgress] = useState(0);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [fps, setFps] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mintAddress, setMintAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [mintedNFTs, setMintedNFTs] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelationCanvasRef = useRef<HTMLCanvasElement>(null);
  const fpsCounterRef = useRef({
    frames: 0,
    lastTime: Date.now()
  });
  useEffect(() => {
    // Initialize camera
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: 300,
            height: 380
          }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };
    initCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Live pixelation effect on video stream
  useEffect(() => {
    if (!videoRef.current || !pixelationCanvasRef.current || state !== "idle") {
      return;
    }
    const video = videoRef.current;
    const canvas = pixelationCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId: number;
    const pixelSize = 12;
    const applyPixelation = () => {
      if (state !== "idle") return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
          const pixelIndexPosition = (x + y * canvas.width) * 4;
          const r = imageData.data[pixelIndexPosition];
          const g = imageData.data[pixelIndexPosition + 1];
          const b = imageData.data[pixelIndexPosition + 2];
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
      animationFrameId = requestAnimationFrame(applyPixelation);
    };
    applyPixelation();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state]);

  // FPS counter
  useEffect(() => {
    if (state !== "idle") return;
    const updateFps = () => {
      fpsCounterRef.current.frames++;
      const now = Date.now();
      const delta = now - fpsCounterRef.current.lastTime;
      if (delta >= 1000) {
        setFps(Math.round(fpsCounterRef.current.frames * 1000 / delta));
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
      }
      if (state === "idle") {
        requestAnimationFrame(updateFps);
      }
    };
    const animationId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animationId);
  }, [state]);

  // Current time updater
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch wallet balance and SOL price
  useEffect(() => {
    const fetchBalanceAndPrice = async () => {
      if (!publicKey || !connection) return;
      
      try {
        const [balance, price] = await Promise.all([
          connection.getBalance(publicKey),
          fetchSolPrice()
        ]);
        setWalletBalance(balance / LAMPORTS_PER_SOL);
        setSolPrice(price);
      } catch (error) {
        console.error('Failed to fetch balance/price:', error);
      }
    };

    if (connected) {
      fetchBalanceAndPrice();
      const interval = setInterval(fetchBalanceAndPrice, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [publicKey, connection, connected]);

  // Fetch minted NFTs
  useEffect(() => {
    const fetchMintedNFTs = async () => {
      if (!publicKey) return;

      try {
        const { data, error } = await supabase
          .from('nft_mints')
          .select('*')
          .eq('user_public_key', publicKey.toBase58())
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMintedNFTs(data || []);
      } catch (error) {
        console.error('Failed to fetch minted NFTs:', error);
      }
    };

    if (connected) {
      fetchMintedNFTs();
    }
  }, [publicKey, connected, state]); // Refetch when state changes (e.g., after minting)
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        // Draw the video frame
        context.drawImage(video, 0, 0, 300, 380);

        // Draw the timestamp on the photo
        context.fillStyle = "#ffffff";
        context.font = "10px monospace";
        context.textAlign = "right";
        const timeString = currentTime.toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        });
        context.fillText(timeString, 290, 370);
        const dataUrl = canvas.toDataURL();
        setPhotoDataUrl(dataUrl);
        setHasPhoto(true);
        setState("photo-taken");
      }
    }
  };
  const retakePhoto = () => {
    setHasPhoto(false);
    setPhotoDataUrl("");
    setState("idle");
    setProgress(0);
    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };
  const encryptAndMint = async () => {
    if (!publicKey || !signTransaction) {
      toast.error("Please connect your Phantom wallet first");
      return;
    }

    try {
      setState("encrypting");
      setProgress(10);

      // 1. Encrypt the image
      const publicKeyBase64 = publicKey.toBase58();
      const encryption = await encryptImage(photoDataUrl, publicKeyBase64);
      setProgress(25);

      // 2. Convert encrypted data to blob for upload
      const encryptedBlob = new Blob(
        [Uint8Array.from(atob(encryption.encryptedData), c => c.charCodeAt(0))],
        { type: 'application/octet-stream' }
      );
      setProgress(35);

      // 3. Upload encrypted image to Supabase Storage
      const blobId = `${publicKeyBase64}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('encrypted-pfps')
        .upload(`${blobId}.enc`, encryptedBlob);

      if (uploadError) throw uploadError;
      setProgress(50);

      // 4. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('encrypted-pfps')
        .getPublicUrl(`${blobId}.enc`);

      // 5. Store encryption metadata in database
      const { error: dbError } = await supabase
        .from('encrypted_photos')
        .insert({
          blob_id: blobId,
          encrypted_key: encryption.encryptedKey,
          user_public_key: publicKeyBase64,
          commitment: encryption.commitment,
          encrypted_image_url: publicUrl,
          iv: encryption.iv
        });

      if (dbError) throw dbError;
      setProgress(60);

      // 6. Process payment
      setState("minting");
      
      // Fetch current SOL price and calculate SOL amount
      const solPrice = await fetchSolPrice();
      const solAmount = PAYMENT_AMOUNT_USD / solPrice;
      console.log(`Payment: $${PAYMENT_AMOUNT_USD} = ${solAmount.toFixed(6)} SOL at $${solPrice.toFixed(2)}/SOL`);
      
      // Check wallet balance
      const balance = await connection.getBalance(publicKey);
      const requiredLamports = Math.floor(solAmount * LAMPORTS_PER_SOL) + 10000; // Add 0.00001 SOL for fees
      
      if (balance < requiredLamports) {
        const neededSol = requiredLamports / LAMPORTS_PER_SOL;
        const haveSol = balance / LAMPORTS_PER_SOL;
        const neededUsd = neededSol * solPrice;
        const haveUsd = haveSol * solPrice;
        toast.error(`Insufficient balance: Need ${neededSol.toFixed(6)} SOL ($${neededUsd.toFixed(2)}), but wallet has ${haveSol.toFixed(6)} SOL ($${haveUsd.toFixed(2)})`);
        throw new Error('INSUFFICIENT_BALANCE');
      }
      
      const recipientPubkey = new PublicKey(RECIPIENT_ADDRESS);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: Math.floor(solAmount * LAMPORTS_PER_SOL)
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);
      
      toast.success(`Payment successful: ${solAmount.toFixed(6)} SOL ($${PAYMENT_AMOUNT_USD})`);
      setProgress(80);

      // 7. Store NFT mint record
      const mintAddr = `mock-nft-${blobId}`;
      const { error: mintError } = await supabase
        .from('nft_mints')
        .insert({
          user_public_key: publicKeyBase64,
          payment_signature: signature,
          blob_id: blobId,
          mint_address: mintAddr,
          metadata_uri: `https://arweave.net/${encryption.commitment}`
        });

      if (mintError) throw mintError;
      
      setMintAddress(mintAddr);
      setProgress(100);
      setState("success");
      toast.success("zkPFP successfully minted!");

    } catch (error) {
      console.error("Encryption/minting error:", error);
      
      // Parse specific error types
      const errorMessage = error.message || error.toString();
      
      if (errorMessage.includes('INSUFFICIENT_BALANCE')) {
        // Already showed detailed toast in balance check
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        toast.error('Transaction cancelled by user.');
      } else if (errorMessage.includes('Attempt to debit')) {
        toast.error('Wallet has insufficient funds. Please add SOL to your wallet.');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch SOL price')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Transaction failed: ${errorMessage.slice(0, 100)}`);
      }
      
      setState("photo-taken");
      setProgress(0);
    }
  };

  const burnNFT = async (nftId: string, mintAddr: string) => {
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      toast.loading("Burning zkPFP...");
      
      // Delete from database
      const { error } = await supabase
        .from('nft_mints')
        .delete()
        .eq('id', nftId);

      if (error) throw error;

      // Update local state
      setMintedNFTs(prev => prev.filter(nft => nft.id !== nftId));
      
      toast.dismiss();
      toast.success("zkPFP burned successfully");
    } catch (error) {
      console.error('Burn error:', error);
      toast.dismiss();
      toast.error("Failed to burn zkPFP");
    }
  };

  const getStatusText = () => {
    switch (state) {
      case "encrypting":
        return "Encrypting…";
      case "minting":
        return "Minting…";
      case "success":
        return "Success — zPFP minted.";
      default:
        return "";
    }
  };
  return <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="w-full flex justify-between items-center px-8 py-6">
        <img src={zkProfLogo} alt="zkProf" className="h-8" />
        
        {/* Wallet Balance Display */}
        {connected && walletBalance !== null && solPrice !== null && (
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border border-border rounded-xl">
            <Wallet size={16} className="text-secondary" />
            <div className="flex flex-col">
              <span className="text-xs font-mono text-secondary">
                {walletBalance.toFixed(4)} SOL
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                ${(walletBalance * solPrice).toFixed(2)} USD
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-12">
        <div className="w-full max-w-[300px] flex flex-col items-center space-y-8">

        {/* Main Content */}
        <div className="w-full flex flex-col items-center space-y-6">
          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-styrene font-black text-secondary">
              {state === "success" ? "zkPFP Created" : "Take an Encrypted Photo"}
            </h2>
            <p className="text-sm text-secondary">
              {state === "success" ? "Your encrypted profile photo is ready" : "Permit decrypt to any entity with ZK + NDA"}
            </p>
          </div>

          {/* Camera Preview */}
          <div className="relative camera-preview w-[300px] h-[380px] bg-muted/20">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${hasPhoto ? "hidden" : ""}`} />
            <canvas ref={pixelationCanvasRef} width="300" height="380" className={`absolute inset-0 w-full h-full ${hasPhoto ? "hidden" : ""}`} />

            {/* Face Guide Overlay - only in pre-photo state */}
            {state === "idle" && <img src={faceGuide} alt="Face guide" className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80" />}

            {/* FPS Counter - only in pre-photo state */}
            {state === "idle" && <div className="absolute top-2 left-2 text-[10px] font-mono text-white bg-black/50 px-2 py-1 rounded">
                {fps} FPS
              </div>}

            {/* Date/Time Display - always visible, gets captured */}
            <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white bg-black/50 px-2 py-1 rounded">
              {currentTime.toLocaleString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
              })}
            </div>
            <canvas ref={canvasRef} width="300" height="380" className="hidden" />
            {hasPhoto && <div className="absolute inset-0 night-vision-effect" style={{
              "--bg-image": `url(${photoDataUrl})`
            } as React.CSSProperties} />}
            {state === "success" && <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>}
          </div>

          {/* Wallet Connect */}
          {!connected && (
            <div className="w-[300px]">
              <WalletMultiButton className="!w-full !h-12 !rounded-xl !font-styrene !font-black !text-base !bg-secondary !text-[#181818] !border-2 !border-secondary hover:!bg-transparent hover:!text-[#ed565a] hover:!border-[#ed565a]" />
            </div>
          )}

          {/* Buttons */}
          {state !== "success" && connected && <div className="w-[300px] space-y-3">
              <div className="flex gap-3">
                <Button onClick={hasPhoto ? retakePhoto : takePhoto} disabled={state !== "idle" && state !== "photo-taken"} variant="outline" className="flex-1 h-12 rounded-xl font-styrene font-black text-base border-2 border-[#ed565a] text-[#ed565a] hover:bg-transparent hover:border-[#F0E3C3] hover:text-[#F0E3C3]">
                  {hasPhoto ? "Retake Photo" : "Take a Photo"}
                </Button>
                <Button onClick={encryptAndMint} disabled={!hasPhoto || state !== "photo-taken"} className="flex-1 h-12 rounded-xl font-styrene font-black text-base bg-secondary text-[#181818] border-2 border-secondary hover:bg-transparent hover:text-[#ed565a] hover:border-[#ed565a] disabled:opacity-50 disabled:cursor-not-allowed">
                  Encrypt & Mint
                </Button>
              </div>
              {hasPhoto && state === "photo-taken" && <div className="flex items-center justify-center gap-2 text-accent text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Uploaded
                </div>}
            </div>}

          {/* Success Actions */}
          {state === "success" && <div className="w-full space-y-4">
              <Button className="w-full h-12 rounded-2xl btn-primary font-styrene font-black text-base text-[#181818]" onClick={() => window.open("https://arubaito.app", "_blank")}>
                Use on Arubaito Profile
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()} className="w-full h-12 rounded-2xl font-styrene font-black text-base text-foreground hover:bg-[#e4dac2] hover:text-[#181818]">
                Restart
              </Button>
            </div>}

          {/* Progress Bar */}
          {(state === "encrypting" || state === "minting" || state === "success") && <div className="w-full space-y-2">
              <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden border border-muted">
                <div className="h-full bg-secondary transition-all duration-300" style={{
                width: `${progress}%`
              }} />
              </div>
              <p className="text-sm text-center text-secondary font-medium">{getStatusText()}</p>
            </div>}
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-xs text-muted-foreground opacity-70">
            Your photo never leaves your device. Only the encrypted commitment is used.
          </p>

          {/* Security Info */}
          <div className="flex flex-col items-center gap-2 pt-4">
            <p className="text-xs text-muted-foreground">ZK-Snark Secured with</p>
            <div className="flex items-center gap-4">
              <img src={zcashLogo} alt="ZCash" className="h-8" />
              <span className="text-xs text-muted-foreground">minted on</span>
              <img src={solanaLogo} alt="Solana" className="h-8" />
            </div>
          </div>
        </div>
        </div>

        {/* Minted zkPFPs Section */}
        {connected && mintedNFTs.length > 0 && (
          <div className="w-full max-w-4xl">
            <h3 className="text-xl font-styrene font-black text-secondary mb-4 text-center">
              Transaction History ({mintedNFTs.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mintedNFTs.map((nft) => (
                <Card key={nft.id} className="bg-muted/20 border-border p-4 space-y-3">
                  <div className="aspect-square bg-muted/40 rounded-lg flex items-center justify-center border border-border night-vision-effect-static">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔒</div>
                      <div className="text-xs font-mono text-secondary">Encrypted</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-muted-foreground space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-secondary/70">Minted:</span>
                        <span className="text-right">
                          {new Date(nft.created_at).toLocaleString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <a
                      href={`https://solscan.io/tx/${nft.payment_signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 border-secondary/50 text-secondary hover:bg-secondary/10 hover:border-secondary"
                      >
                        <ExternalLink size={12} className="mr-1" />
                        View Transaction
                      </Button>
                    </a>
                    
                    <Button
                      onClick={() => burnNFT(nft.id, nft.mint_address)}
                      variant="outline"
                      size="sm"
                      className="w-full h-8 border-[#ed565a] text-[#ed565a] hover:bg-[#ed565a] hover:text-white"
                    >
                      <Trash2 size={12} className="mr-1" />
                      Burn
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full flex justify-end px-8 py-6">
        <a href="https://github.com/tenshijinn/arubaito" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Github size={16} />
          <span>View on GitHub</span>
        </a>
      </div>
    </div>;
};
export default Index;