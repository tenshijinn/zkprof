import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type AppState = "idle" | "photo-taken" | "encrypting" | "minting" | "success";

const Index = () => {
  const [state, setState] = useState<AppState>("idle");
  const [progress, setProgress] = useState(0);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !hasPhoto) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
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
        setHasPhoto(true);
        setState("photo-taken");
      }
    }
  };

  const retakePhoto = () => {
    setHasPhoto(false);
    setState("idle");
    setIsHovering(false);
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
          <div 
            ref={containerRef}
            className="relative camera-preview w-[300px] h-[380px] bg-muted/20"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
          >
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
            {hasPhoto && (
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-75"
                style={{
                  maskImage: isHovering
                    ? `radial-gradient(circle 80px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, transparent 60px, black 80px)`
                    : 'none',
                  WebkitMaskImage: isHovering
                    ? `radial-gradient(circle 80px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, transparent 60px, black 80px)`
                    : 'none',
                }}
              >
                <div className="absolute inset-0 opacity-30 noise-texture" />
              </div>
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
            <div className="w-[300px] space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={hasPhoto ? retakePhoto : takePhoto}
                  disabled={state !== "idle" && state !== "photo-taken"}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-medium text-base border-2 border-muted hover:bg-muted/10"
                >
                  {hasPhoto ? "Retake Photo" : "Take a Photo"}
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
