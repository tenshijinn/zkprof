import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import zkprofTop from "@/assets/zkprof-decrypt-3.png";
import zkprofEncrypt from "@/assets/zkprof-encrypt-4.png";
import zkprofLogo from "@/assets/zkprof-logo.png";
import arubaitoLogo from "@/assets/arubaito-logo.png";
import zcashLogoFull from "@/assets/zcash-logo-full.svg";
import solanaLogo from "@/assets/solana-logo.png";

const Landing = () => {
  const [mouseX, setMouseX] = useState(50); // percentage across screen
  const [imageRevealX, setImageRevealX] = useState(50); // percentage across image
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position as percentage of screen width for the line
      const screenPercentage = (e.clientX / window.innerWidth) * 100;
      setMouseX(screenPercentage);

      // Calculate reveal position relative to image container
      if (imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right) {
          const imagePercentage = ((e.clientX - rect.left) / rect.width) * 100;
          setImageRevealX(Math.max(0, Math.min(100, imagePercentage)));
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen text-foreground flex flex-col md:flex-row md:items-end md:justify-center relative p-0 overflow-hidden" style={{ backgroundColor: '#faf1e1' }}>
      
      {/* Vertical line that follows mouse */}
      <div 
        className="fixed top-0 bottom-0 w-[2px] bg-primary z-20 pointer-events-none"
        style={{ left: `${mouseX}%`, transform: 'translateX(-50%)' }}
      >
        {/* ZK-Encrypted text at top, rotated */}
        <span 
          className="absolute top-6 left-4 text-primary font-styrene font-black text-sm tracking-widest whitespace-nowrap"
          style={{ 
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}
        >
          ZK-ENCRYPTED
        </span>
      </div>

      {/* Content - at top on mobile, right side on desktop */}
      <div className="relative z-10 p-6 md:absolute md:right-8 md:bottom-24 space-y-6 max-w-md">
        <h1 className="text-3xl md:text-4xl font-styrene font-black leading-tight text-black">
          Dox Yourself Privately with{" "}
          <span className="text-primary">Zero Knowledge</span>{" "}
          Profile Picture.
        </h1>
        
        <Link to="/take-photo">
          <Button className="h-12 px-6 rounded-2xl btn-primary font-styrene font-black text-base text-[#181818] hover:bg-primary/90">
            Take a zK Picture
          </Button>
        </Link>
      </div>

      {/* Center: Parallax Image - Fixed to bottom, no spacing */}
      <div 
        ref={imageContainerRef}
        className="relative aspect-square w-full max-w-[600px] overflow-hidden rounded-t-3xl mt-auto"
      >
        {/* Bottom layer - encrypted version (always visible) */}
        <img 
          src={zkprofEncrypt} 
          alt="Encrypted profile" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Top layer - normal version (revealed by mouse) */}
        <div 
          className="absolute inset-0 transition-none"
          style={{
            clipPath: `polygon(0 0, ${imageRevealX}% 0, ${imageRevealX}% 100%, 0 100%)`
          }}
        >
          <img 
            src={zkprofTop} 
            alt="Normal profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Top left branding */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <img src={zkprofLogo} alt="zkProf" className="h-6" />
        <span className="font-styrene text-sm text-black/70">by</span>
        <a href="https://arubaito.app" target="_blank" rel="noopener noreferrer">
          <img src={arubaitoLogo} alt="Arubaito" className="h-5 hover:opacity-80 transition-opacity" />
        </a>
      </div>

      {/* Footer branding */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 text-xs text-black/70">
        <span className="font-styrene">ZK-Snark Secured with</span>
        <img src={zcashLogoFull} alt="ZCash" className="h-4" />
        <span className="font-styrene">using</span>
        <img src={solanaLogo} alt="Solana" className="h-4" />
      </div>
    </div>
  );
};

export default Landing;
