import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProtectedImageRevealProps {
  imageDataUrl: string;
  walletAddress: string;
  viewingTimeSeconds?: number;
}

export const ProtectedImageReveal = ({
  imageDataUrl,
  walletAddress,
  viewingTimeSeconds = 30,
}: ProtectedImageRevealProps) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [timeRemaining, setTimeRemaining] = useState(viewingTimeSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Screenshot prevention effects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect PrintScreen key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        document.body.style.opacity = '0';
        setTimeout(() => {
          document.body.style.opacity = '1';
        }, 100);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsExpired(true);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Detect dev tools opening
    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        setIsExpired(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    const devToolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(devToolsInterval);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isExpired) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExpired]);

  // Mouse tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isExpired) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePos({ x, y });
  };

  // Touch tracking for mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || isExpired) return;

    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    setMousePos({ x, y });
  };

  const extendViewing = () => {
    setTimeRemaining(viewingTimeSeconds);
    setIsExpired(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Timer Display */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-border">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-mono text-foreground">
          {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
        </span>
      </div>

      {/* Security Warning */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-destructive/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-destructive/50">
        {isExpired ? <EyeOff className="h-4 w-4 text-destructive" /> : <Eye className="h-4 w-4 text-destructive" />}
        <span className="text-xs text-destructive font-semibold">
          {isExpired ? 'Viewing Expired' : 'Protected View'}
        </span>
      </div>

      {/* Protected Image Container */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-lg border-2 border-border select-none",
          isExpired && "cursor-not-allowed"
        )}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
        }}
      >
        {/* Base Image with Heavy Blur */}
        <img
          src={imageDataUrl}
          alt="Encrypted Profile"
          className={cn(
            "w-full h-auto transition-all duration-300",
            isExpired ? "blur-[60px]" : "blur-[40px]"
          )}
          draggable={false}
          style={{ pointerEvents: 'none' }}
        />

        {/* Reveal Circle - only visible when not expired */}
        {!isExpired && (
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              maskImage: `radial-gradient(circle 80px at ${mousePos.x}% ${mousePos.y}%, black 100%, transparent 100%)`,
              WebkitMaskImage: `radial-gradient(circle 80px at ${mousePos.x}% ${mousePos.y}%, black 100%, transparent 100%)`,
            }}
          >
            <img
              src={imageDataUrl}
              alt="Encrypted Profile Reveal"
              className="w-full h-auto"
              draggable={false}
              style={{ pointerEvents: 'none' }}
            />
          </div>
        )}

        {/* Watermark Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-30">
            <div className="text-xs font-mono break-all px-8">
              {walletAddress}
            </div>
          </div>
        </div>

        {/* Scanline Effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.03) 2px, rgba(0, 0, 0, 0.03) 4px)',
            animation: 'scanline 8s linear infinite',
          }}
        />
      </div>

      {/* Extend Viewing Button */}
      {isExpired && (
        <button
          onClick={extendViewing}
          className="mt-6 px-6 py-3 bg-secondary text-primary-foreground rounded-lg font-styrene font-black hover:bg-secondary/80 transition-colors"
        >
          Extend Viewing ({viewingTimeSeconds}s)
        </button>
      )}

      {/* Instructions */}
      <p className="mt-4 text-xs text-muted-foreground text-center max-w-md">
        Move your mouse/finger to reveal the image. This view is protected against screenshots.
      </p>

      <style>{`
        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  );
};
