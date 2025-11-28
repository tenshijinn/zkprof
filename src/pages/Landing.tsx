import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import zkprofTop from "@/assets/zkprof-top.png";
import zkprofEncrypt from "@/assets/zkprof-encrypt.png";

const Landing = () => {
  const [revealAmount, setRevealAmount] = useState(50); // 0-100, controls clip-path reveal

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate reveal based on horizontal mouse position
      const percentage = (e.clientX / window.innerWidth) * 100;
      setRevealAmount(percentage);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-end justify-center relative p-0">
      {/* Center: Parallax Image - Fixed to bottom, no spacing */}
      <div className="relative aspect-square w-full max-w-[600px] overflow-hidden rounded-t-3xl">
        {/* Bottom layer - encrypted version (always visible) */}
        <img 
          src={zkprofEncrypt} 
          alt="Encrypted profile" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Top layer - normal version (revealed by mouse) */}
        <div 
          className="absolute inset-0 transition-all duration-150 ease-out"
          style={{
            clipPath: `polygon(0 0, ${revealAmount}% 0, ${revealAmount}% 100%, 0 100%)`
          }}
        >
          <img 
            src={zkprofTop} 
            alt="Normal profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content - positioned to the right of the image */}
      <div className="absolute right-8 bottom-24 space-y-6 max-w-md">
        <h1 className="text-3xl md:text-4xl font-styrene font-black leading-tight">
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
    </div>
  );
};

export default Landing;
