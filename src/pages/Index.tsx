import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Github, Wallet, Trash2, ExternalLink, ChevronDown } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import aruaitoLogo from "@/assets/arubaito-logo.png";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import { createBurnInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createMemoInstruction } from "@solana/spl-memo";
import { encryptImage } from "@/lib/crypto";
import { serializeProof } from "@/lib/zkproof";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ZKProofVerifier } from "@/components/ZKProofVerifier";
import faceGuide from "@/assets/pfp-guide.png";
import zcashLogo from "@/assets/zcash-logo.png";
import solanaLogo from "@/assets/solana-logo.png";
import zkProfLogo from "@/assets/zkprof-logo.png";
import { Card } from "@/components/ui/card";
type AppState = "idle" | "photo-taken" | "encrypting" | "minting" | "success";
const RECIPIENT_ADDRESS = "8DuKPJAqMEa84VTcDfqF967CUG98Tf6DdtfyJFviSKL6";
const PAYMENT_AMOUNT_USD = 5.0; // $5.00 in SOL

const fetchSolPrice = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.functions.invoke("get-sol-price");

    if (error) {
      console.error("Failed to fetch SOL price:", error);
      throw new Error("Unable to fetch SOL price. Please try again.");
    }

    if (!data || typeof data.price !== "number") {
      throw new Error("Invalid price data received");
    }

    return data.price;
  } catch (error) {
    console.error("Failed to fetch SOL price:", error);
    throw new Error("Unable to fetch SOL price. Please try again.");
  }
};

const Index = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [state, setState] = useState<AppState>("idle");
  const [progress, setProgress] = useState(0);
  const [zkProgress, setZKProgress] = useState(0);
  const [zkProgressMessage, setZKProgressMessage] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [fps, setFps] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mintAddress, setMintAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [mintedNFTs, setMintedNFTs] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [isNameOpen, setIsNameOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelationCanvasRef = useRef<HTMLCanvasElement>(null);
  const fpsCounterRef = useRef({
    frames: 0,
    lastTime: Date.now(),
  });
  useEffect(() => {
    // Initialize camera
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: 300,
            height: 380,
          },
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
        stream.getTracks().forEach((track) => track.stop());
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
        setFps(Math.round((fpsCounterRef.current.frames * 1000) / delta));
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
        const [balance, price] = await Promise.all([connection.getBalance(publicKey), fetchSolPrice()]);
        setWalletBalance(balance / LAMPORTS_PER_SOL);
        setSolPrice(price);
      } catch (error) {
        console.error("Failed to fetch balance/price:", error);
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
          .from("nft_mints")
          .select("*")
          .eq("user_public_key", publicKey.toBase58())
          .order("created_at", { ascending: false });

        if (error) throw error;
        setMintedNFTs(data || []);
      } catch (error) {
        console.error("Failed to fetch minted NFTs:", error);
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

        // Draw the user name on top right if provided
        if (userName.trim()) {
          context.fillStyle = "#ffffff";
          context.font = "bold 14px monospace";
          context.textAlign = "right";
          context.fillText(userName.trim(), 290, 20);
        }

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
          hour12: false,
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
      setZKProgress(0);
      setZKProgressMessage("");

      // 1. Encrypt the image
      const publicKeyBase58 = publicKey.toBase58();
      const encryption = await encryptImage(photoDataUrl, publicKeyBase58, (message, progress) => {
        setZKProgressMessage(message);
        setZKProgress(progress);
      });
      setProgress(25);

      // 2. Convert encrypted data to blob for upload
      const encryptedBlob = new Blob([Uint8Array.from(atob(encryption.encryptedData), (c) => c.charCodeAt(0))], {
        type: "application/octet-stream",
      });
      setProgress(35);

      // 3. Upload encrypted image to Supabase Storage
      const blobId = `${publicKeyBase58}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("encrypted-pfps")
        .upload(`${blobId}.enc`, encryptedBlob);

      if (uploadError) throw uploadError;
      setProgress(50);

      // 4. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("encrypted-pfps").getPublicUrl(`${blobId}.enc`);

      // 5. Store encryption metadata in database
      const { error: dbError } = await supabase.from("encrypted_photos").insert({
        blob_id: blobId,
        encrypted_key: encryption.encryptedKey,
        user_public_key: publicKeyBase58,
        commitment: encryption.commitment,
        encrypted_image_url: publicUrl,
        iv: encryption.iv,
        zk_proof: encryption.zkProof ? serializeProof(encryption.zkProof.proof) : null,
        zk_public_signals: encryption.zkProof ? encryption.zkProof.publicSignals : null,
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
        toast.error(
          `Insufficient balance: Need ${neededSol.toFixed(6)} SOL ($${neededUsd.toFixed(2)}), but wallet has ${haveSol.toFixed(6)} SOL ($${haveUsd.toFixed(2)})`,
        );
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const recipientPubkey = new PublicKey(RECIPIENT_ADDRESS);

      // Create memo content for on-chain proof
      const timestamp = Date.now();
      const memoContent = `zkpfp:${encryption.commitment}:${timestamp}`;

      const transaction = new Transaction().add(
        // Payment transfer
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: Math.floor(solAmount * LAMPORTS_PER_SOL),
        }),
        // On-chain memo proof of zkPFP creation
        createMemoInstruction(memoContent, [publicKey]),
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);

      toast.success(`Payment successful: ${solAmount.toFixed(6)} SOL ($${PAYMENT_AMOUNT_USD})`);
      setProgress(80);

      // 7. Create NFT record with on-chain proof reference
      const mintAddr = `zkpfp-${blobId}`;
      const metadataUri = `zkpfp:commitment:${encryption.commitment}:tx:${signature}`;

      const { error: mintError } = await supabase.from("nft_mints").insert({
        user_public_key: publicKeyBase58,
        payment_signature: signature,
        blob_id: blobId,
        mint_address: mintAddr,
        metadata_uri: metadataUri,
        zk_proof: encryption.zkProof ? serializeProof(encryption.zkProof.proof) : null,
        zk_public_signals: encryption.zkProof ? encryption.zkProof.publicSignals : null,
      });

      if (mintError) throw mintError;

      setMintAddress(signature); // Store the actual on-chain transaction signature
      setProgress(100);
      setState("success");
      toast.dismiss();
      toast.success("zkPFP created with on-chain proof!");
    } catch (error) {
      console.error("Encryption/minting error:", error);

      // Parse specific error types
      const errorMessage = error.message || error.toString();

      if (errorMessage.includes("INSUFFICIENT_BALANCE")) {
        // Already showed detailed toast in balance check
      } else if (errorMessage.includes("User rejected") || errorMessage.includes("user rejected")) {
        toast.error("Transaction cancelled by user.");
      } else if (errorMessage.includes("Attempt to debit")) {
        toast.error("Wallet has insufficient funds. Please add SOL to your wallet.");
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch SOL price")) {
        toast.error("Network error. Please check your connection and try again.");
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
      // Check if this is a zkpfp record (not a real on-chain NFT yet)
      const isZkpfpRecord = mintAddr.startsWith("zkpfp-") || mintAddr.startsWith("mock-nft-");

      if (isZkpfpRecord) {
        // For zkPFP records, just delete from database
        toast.loading("Removing zkPFP record...");

        const { error } = await supabase.from("nft_mints").delete().eq("id", nftId);

        if (error) throw error;

        setMintedNFTs((prev) => prev.filter((nft) => nft.id !== nftId));

        toast.dismiss();
        toast.success("zkPFP record removed");
        return;
      }

      // For real NFTs (when implemented), burn on-chain
      toast.loading("Burning NFT on Solana...");

      if (!signTransaction) {
        toast.error("Wallet does not support transaction signing");
        return;
      }

      const mintPubkey = new PublicKey(mintAddr);

      // Get the associated token account for this NFT
      const { getAssociatedTokenAddress } = await import("@solana/spl-token");
      const tokenAccount = await getAssociatedTokenAddress(mintPubkey, publicKey);

      // Create burn instruction (burns 1 token, which is the NFT)
      const burnIx = createBurnInstruction(tokenAccount, mintPubkey, publicKey, 1, [], TOKEN_PROGRAM_ID);

      // Create and send transaction
      const transaction = new Transaction().add(burnIx);
      transaction.feePayer = publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());

      toast.loading("Confirming burn transaction...");
      await connection.confirmTransaction(signature, "confirmed");

      console.log("NFT burned on-chain. Signature:", signature);

      // Delete from database after successful on-chain burn
      toast.loading("Updating database...");
      const { error } = await supabase.from("nft_mints").delete().eq("id", nftId);

      if (error) throw error;

      setMintedNFTs((prev) => prev.filter((nft) => nft.id !== nftId));

      toast.dismiss();
      toast.success("zkPFP burned successfully on-chain!");
    } catch (error) {
      console.error("Burn error:", error);
      toast.dismiss();

      const errorMessage = error.message || error.toString();
      if (errorMessage.includes("User rejected") || errorMessage.includes("user rejected")) {
        toast.error("Burn cancelled by user.");
      } else {
        toast.error(`Failed to burn zkPFP: ${errorMessage.slice(0, 100)}`);
      }
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
  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Header currentPage="take-photo" walletBalance={walletBalance} solPrice={solPrice} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start md:justify-center px-4 pt-4 md:pt-0 gap-4 md:gap-12">
        <div className="w-full max-w-[300px] flex flex-col items-center space-y-4 md:space-y-8">
          {/* Main Content */}
          <div className="w-full flex flex-col items-center space-y-3 md:space-y-6">
            {/* Title */}
            <div className="text-center space-y-0.5 md:space-y-1">
              <h2 className="text-lg md:text-2xl font-styrene font-black text-secondary">
                {state === "success" ? "zkPFP Created" : "Take an Encrypted Photo"}
              </h2>
              <p className="text-xs md:text-sm text-secondary">
                {state === "success"
                  ? "Your encrypted profile photo is ready"
                  : "Permit decrypt to any entity with ZK + NDA"}
              </p>
            </div>

            {/* Camera Preview */}
            <div className="relative camera-preview w-[300px] h-[380px] bg-muted/20">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${hasPhoto ? "hidden" : ""}`}
              />
              <canvas
                ref={pixelationCanvasRef}
                width="300"
                height="380"
                className={`absolute inset-0 w-full h-full ${hasPhoto ? "hidden" : ""}`}
              />

              {/* Face Guide Overlay - only in pre-photo state */}
              {state === "idle" && (
                <img
                  src={faceGuide}
                  alt="Face guide"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
                />
              )}

              {/* FPS Counter - only in pre-photo state */}
              {state === "idle" && (
                <div className="absolute top-2 left-2 text-[10px] font-mono text-white bg-black/50 px-2 py-1 rounded">
                  {fps} FPS
                </div>
              )}

              {/* User Name Overlay - only visible during idle state */}
              {userName.trim() && state === "idle" && (
                <div className="absolute top-2 right-2 text-white font-bold text-sm bg-black/50 px-2 py-1 rounded font-mono">
                  {userName.trim()}
                </div>
              )}

              {/* Date/Time Display - always visible, gets captured */}
              <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white bg-black/50 px-2 py-1 rounded">
                {currentTime.toLocaleString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </div>
              <canvas ref={canvasRef} width="300" height="380" className="hidden" />
              {hasPhoto && (
                <div
                  className="absolute inset-0 night-vision-effect"
                  style={
                    {
                      "--bg-image": `url(${photoDataUrl})`,
                    } as React.CSSProperties
                  }
                />
              )}
              {state === "success" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-primary-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Your Name - Collapsible (Only in idle state, before photo taken) */}
            {state === "idle" && !hasPhoto && (
              <Collapsible open={isNameOpen} onOpenChange={setIsNameOpen} className="w-[300px]">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className={`h-3 w-3 transition-transform ${isNameOpen ? "rotate-180" : ""}`} />
                    Add Your Name
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    maxLength={30}
                    className="w-full text-sm"
                  />
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Wallet Connect */}
            {!connected && (
              <div className="w-[300px]">
                <WalletMultiButton className="!w-full !h-12 !rounded-xl !font-styrene !font-black !text-base !bg-secondary !text-[#181818] !border-2 !border-secondary hover:!bg-transparent hover:!text-[#ed565a] hover:!border-[#ed565a]" />
              </div>
            )}

            {/* Buttons */}
            {state !== "success" && connected && (
              <div className="w-[300px] space-y-3">
                <div className="flex gap-3">
                  <Button
                    onClick={hasPhoto ? retakePhoto : takePhoto}
                    disabled={state !== "idle" && state !== "photo-taken"}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-styrene font-black text-base border-2 border-[#ed565a] text-[#ed565a] hover:bg-transparent hover:border-[#F0E3C3] hover:text-[#F0E3C3]"
                  >
                    {hasPhoto ? "Retake Photo" : "Take a Photo"}
                  </Button>
                  <Button
                    onClick={encryptAndMint}
                    disabled={!hasPhoto || state !== "photo-taken"}
                    className="flex-1 h-12 rounded-xl font-styrene font-black text-base bg-secondary text-[#181818] border-2 border-secondary hover:bg-transparent hover:text-[#ed565a] hover:border-[#ed565a] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Encrypt & Mint
                  </Button>
                </div>
                {hasPhoto && state === "photo-taken" && (
                  <div className="flex items-center justify-center gap-2 text-accent text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                    Uploaded
                  </div>
                )}
              </div>
            )}

            {/* Success Actions */}
            {state === "success" && (
              <div className="w-full space-y-4">
                <Link to="/zkpfps" className="w-full block">
                  <Button className="w-full h-12 rounded-2xl btn-primary font-styrene font-black text-base text-[#181818]">
                    See zkPFP Verification
                  </Button>
                </Link>
                {mintAddress && (
                  <a
                    href={`https://explorer.solana.com/tx/${mintAddress}?cluster=${import.meta.env.VITE_SOLANA_RPC_ENDPOINT?.includes("devnet") ? "devnet" : "mainnet"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block"
                  >
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-2xl font-styrene font-black text-base border-2 border-[#ed565a] text-[#ed565a] hover:bg-transparent hover:border-[#F0E3C3] hover:text-[#F0E3C3]"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View On-Chain Proof
                    </Button>
                  </a>
                )}
                <Button
                  variant="ghost"
                  onClick={() => window.location.reload()}
                  className="w-full h-12 rounded-2xl font-styrene font-black text-base text-foreground hover:bg-[#e4dac2] hover:text-[#181818]"
                >
                  Restart
                </Button>
              </div>
            )}

            {/* Progress Bar */}
            {(state === "encrypting" || state === "minting" || state === "success") && (
              <div className="w-full space-y-2">
                {/* ZK-SNARK Progress Indicator */}
                {state === "encrypting" && zkProgressMessage && (
                  <div className="w-full space-y-2 mb-4 p-3 bg-[#3a3a3a]/50 rounded-lg border border-[#3a3a3a]">
                    <div className="flex items-center gap-2 mb-1">
                      <svg
                        className="w-4 h-4 text-secondary animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span className="text-xs font-mono text-secondary font-bold">ZK-SNARK Proof Generation</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary transition-all duration-300"
                        style={{
                          width: `${zkProgress}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{zkProgressMessage}</p>
                  </div>
                )}

                {/* Main Progress Bar */}
                <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden border border-muted">
                  <div
                    className="h-full bg-secondary transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-center text-secondary font-medium">{getStatusText()}</p>
              </div>
            )}
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
      </div>

      {/* Footer - Hidden on mobile */}
      <div className="hidden md:flex w-full justify-between items-center px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">zkProf by</span>
          <a href="https://arubaito.app" target="_blank" rel="noopener noreferrer">
            <img src={aruaitoLogo} alt="Arubaito" className="h-4" />
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
export default Index;
