import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type AppState = "idle" | "photo-taken" | "encrypting" | "minting" | "success";

const Index = () => {
  const [state, setState] = useState<AppState>("idle");
  const [progress, setProgress] = useState(0);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Initialize camera
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 300, height: 380 },
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

  const applyScrambleEffect = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Define eye region (middle horizontal band - approximately 35-55% of height)
    const eyeRegionStart = height * 0.35;
    const eyeRegionEnd = height * 0.55;
    
    // Apply heavy pixelation/scramble effect everywhere except eye region
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        // Check if we're in the eye region
        const isInEyeRegion = y >= eyeRegionStart && y <= eyeRegionEnd;
        
        if (!isInEyeRegion) {
          // Calculate distance-based blur intensity
          const distanceFromEyeRegion = y < eyeRegionStart 
            ? (eyeRegionStart - y) / eyeRegionStart 
            : (y - eyeRegionEnd) / (height - eyeRegionEnd);
          
          // Heavy pixelation outside eye region (16-32px blocks)
          const blockSize = Math.floor(16 + distanceFromEyeRegion * 16);
          
          // Only process if we're at a block boundary
          if (x % blockSize === 0 && y % blockSize === 0) {
            // Get average color of block
            let r = 0, g = 0, b = 0, count = 0;
            
            for (let by = 0; by < blockSize && y + by < height; by++) {
              for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                const i = ((y + by) * width + (x + bx)) * 4;
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
              }
            }
            
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);
            
            // Fill block with averaged color + heavy noise
            const noiseLevel = 40 + (distanceFromEyeRegion * 60);
            for (let by = 0; by < blockSize && y + by < height; by++) {
              for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                const i = ((y + by) * width + (x + bx)) * 4;
                const noise = (Math.random() - 0.5) * noiseLevel;
                data[i] = Math.max(0, Math.min(255, r + noise));
                data[i + 1] = Math.max(0, Math.min(255, g + noise));
                data[i + 2] = Math.max(0, Math.min(255, b + noise));
              }
            }
          }
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        // Apply scrambling effect
        applyScrambleEffect(ctx, canvas.width, canvas.height);
        setHasPhoto(true);
        setState("photo-taken");
      }
    }
  };

  const encryptAndMint = async () => {
    setState("encrypting");
    setProgress(0);

    // Simulate encryption phase
    for (let i = 0; i <= 50; i += 2) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      setProgress(i);
    }

    setState("minting");

    // Simulate minting phase
    for (let i = 50; i <= 100; i += 2) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      setProgress(i);
    }

    setState("success");
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[500px] flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="self-start">
          <h1 className="text-2xl font-medium tracking-tight">zPFP</h1>
        </div>

        {/* Main Content */}
        <div className="w-full flex flex-col items-center space-y-6">
          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-semibold text-secondary">
              {state === "success" ? "zPFP Created" : "Take an Encrypted Photo"}
            </h2>
            <p className="text-sm text-secondary">
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
              className={`w-full h-full object-cover ${
                hasPhoto ? "hidden" : ""
              }`}
            />
            <canvas
              ref={canvasRef}
              className={`w-full h-full object-cover ${
                hasPhoto ? "" : "hidden"
              }`}
            />
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          {state !== "success" && (
            <div className="w-full space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={takePhoto}
                  disabled={state !== "idle" && state !== "photo-taken"}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-medium text-base border-2 border-muted hover:bg-muted/10"
                >
                  Take a Photo
                </Button>
                <Button
                  onClick={encryptAndMint}
                  disabled={!hasPhoto || state !== "photo-taken"}
                  className="flex-1 h-12 rounded-xl btn-secondary font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Encrypt & Mint
                </Button>
              </div>
              {hasPhoto && state === "photo-taken" && (
                <div className="flex items-center justify-center gap-2 text-accent text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Uploaded
                </div>
              )}
            </div>
          )}

          {/* Success Actions */}
          {state === "success" && (
            <div className="w-full space-y-4">
              <Button className="w-full h-12 rounded-2xl btn-primary font-medium text-base">
                Use on Arubaito Profile
              </Button>
              <Button
                variant="ghost"
                className="w-full h-12 rounded-2xl font-medium text-base text-muted-foreground hover:text-foreground"
                onClick={() => window.location.reload()}
              >
                Done
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {(state === "encrypting" || state === "minting" || state === "success") && (
            <div className="w-full space-y-2">
              <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden border border-muted">
                <div 
                  className="h-full bg-secondary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-center text-secondary font-medium">
                {getStatusText()}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground opacity-70">
            Your photo never leaves your device. Only the encrypted commitment
            is used.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
