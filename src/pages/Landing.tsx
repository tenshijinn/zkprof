import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import zkprofTop from "@/assets/zkprof-decrypt-3.png";
import zkprofEncrypt from "@/assets/zkprof-encrypt-4.png";
import zkprofLogoIndex from "@/assets/zkprof-logo-index.png";
import arubaitoLogo from "@/assets/arubaito-logo-new.png";
import zypherpunkWinner from "@/assets/zypherpunk-winner.png";
import zcashLogoFull from "@/assets/zcash-logo-full.svg";
import solanaLogo from "@/assets/solana-logo.png";
const Landing = () => {
  const [mouseX, setMouseX] = useState(50); // percentage across screen
  const [imageRevealX, setImageRevealX] = useState(50); // percentage across image
  const imageContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position as percentage of screen width for the line
      const screenPercentage = e.clientX / window.innerWidth * 100;
      setMouseX(screenPercentage);

      // Calculate reveal position relative to image container
      if (imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right) {
          const imagePercentage = (e.clientX - rect.left) / rect.width * 100;
          setImageRevealX(Math.max(0, Math.min(100, imagePercentage)));
        }
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  return <div className="min-h-screen text-foreground flex flex-col md:flex-row md:items-end md:justify-center relative p-0 overflow-hidden" style={{
    backgroundColor: "#faf1e1"
  }}>
      {/* Vertical line that follows mouse */}
      <div className="fixed top-0 bottom-0 w-[2px] bg-primary z-20 pointer-events-none" style={{
      left: `${mouseX}%`,
      transform: "translateX(-50%)"
    }}>
        {/* ZK-Encrypted text - positioned lower on mobile to avoid overlap */}
        <span className="absolute top-[60%] md:top-6 left-4 text-primary font-styrene font-black text-sm tracking-widest whitespace-nowrap" style={{
        writingMode: "vertical-rl",
        textOrientation: "mixed"
      }}>
          ZK-ENCRYPTED
        </span>
      </div>

      {/* Content - centered above image on mobile, right side on desktop */}
      <div className="relative z-10 p-6 pt-16 md:pt-6 md:absolute md:right-8 md:bottom-24 space-y-6 max-w-md">
        <h1 className="text-2xl md:text-4xl font-styrene font-black leading-tight text-black">
          Dox Yourself Privately with <span className="text-primary">Zero Knowledge</span> Profile Picture.
        </h1>

        <Link to="/take-photo">
          <Button className="h-12 px-6 rounded-2xl btn-primary font-styrene font-black text-base text-[#181818] hover:bg-primary/90">
            Take a zK Picture
          </Button>
        </Link>
      </div>

      {/* Center: Parallax Image - centered on mobile, bottom on desktop */}
      <div ref={imageContainerRef} className="relative aspect-square w-[80%] md:w-full max-w-[600px] overflow-hidden rounded-3xl md:rounded-t-3xl md:rounded-b-none my-auto md:my-0 md:mt-auto mx-auto">
        {/* Bottom layer - encrypted version (always visible) */}
        <img src={zkprofEncrypt} alt="Encrypted profile" className="absolute inset-0 w-full h-full object-cover" />

        {/* Top layer - normal version (revealed by mouse) */}
        <div className="absolute inset-0 transition-none" style={{
        clipPath: `polygon(0 0, ${imageRevealX}% 0, ${imageRevealX}% 100%, 0 100%)`
      }}>
          <img src={zkprofTop} alt="Normal profile" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Top left branding */}
      <div className="absolute top-4 left-4 z-10">
        <img src={zkprofLogoIndex} alt="zkProf" className="h-7 object-contain" />
      </div>

      {/* Bottom badges - horizontal row on mobile, stacked on desktop */}
      <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-auto md:bottom-6 z-10 flex flex-row md:flex-col gap-1.5 md:gap-2">
        {/* Solana x402 badge */}
        <div className="flex items-center gap-1.5 md:gap-3 bg-transparent rounded-lg md:rounded-xl px-2 py-1.5 md:px-4 md:py-3 border-2 md:border-[3px] border-[#181818]">
          <img src={solanaLogo} alt="Solana" className="h-4 w-4 md:h-6 md:w-6 object-contain" />
          <span className="font-styrene text-[8px] md:text-sm text-black/80 whitespace-nowrap">Solana x402</span>
        </div>
        
        {/* ZK-Snark Secured badge */}
        <div className="flex items-center gap-1.5 md:gap-3 bg-transparent rounded-lg md:rounded-xl px-2 py-1.5 md:px-4 md:py-3 border-2 md:border-[3px] border-[#181818]">
          <img src={zcashLogoFull} alt="ZCash" className="h-4 w-4 md:h-6 md:w-6 object-contain" />
          <span className="font-styrene text-[8px] md:text-sm text-black/80 whitespace-nowrap">ZK-Snark Secured</span>
        </div>
        
        {/* Zypherpunk Hackathon Winner badge */}
        <div className="flex items-center gap-1.5 md:gap-3 bg-transparent rounded-lg md:rounded-xl px-2 py-1.5 md:px-4 md:py-3 border-2 md:border-[3px] border-[#181818]">
          <img alt="Zypherpunk" className="h-4 w-4 md:h-7 md:w-7 object-contain" src="/lovable-uploads/10e1c4ce-7c44-404b-9643-edcbbc6597ea.png" />
          <div className="hidden md:flex flex-col">
            <span className="font-styrene font-black text-xs text-black/90 tracking-wide">ZYPHERPUNK</span>
            <span className="font-styrene text-[10px] text-black/70 leading-tight">Hackathon Winner</span>
            <span className="font-styrene text-[9px] text-black/50 leading-tight">Network School | Tachyon</span>
          </div>
        </div>
      </div>
      
      {/* By Arubaito - bottom right */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-1.5">
        <span className="font-styrene text-xs text-black/70 leading-none">by</span>
        <a href="https://arubaito.app" target="_blank" rel="noopener noreferrer">
          <img src={arubaitoLogo} alt="Arubaito" className="h-5 object-contain hover:opacity-80 transition-opacity" />
        </a>
      </div>
    </div>;
};
export default Landing;