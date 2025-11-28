import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-7xl w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Parallax Image */}
          <div className="relative aspect-square max-w-[500px] mx-auto">
            {/* Bottom layer - encrypted version (always visible) */}
            <div className="absolute inset-0">
              <img 
                src={zkprofEncrypt} 
                alt="Encrypted profile" 
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
            
            {/* Top layer - normal version (revealed by mouse) */}
            <div 
              className="absolute inset-0"
              style={{
                clipPath: `polygon(0 0, ${revealAmount}% 0, ${revealAmount}% 100%, 0 100%)`
              }}
            >
              <img 
                src={zkprofTop} 
                alt="Normal profile" 
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-styrene font-black leading-tight">
              Dox Yourself Privately with{" "}
              <span className="text-primary">Zero Knowledge</span>{" "}
              Profile Picture.
            </h1>
            
            <Link to="/take-photo">
              <Button className="h-14 px-8 rounded-2xl btn-primary font-styrene font-black text-lg text-[#181818] hover:bg-primary/90">
                Take a zK Picture
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 flex justify-between items-center border-t border-border">
        <div className="flex items-center gap-6">
          <a 
            href="https://github.com/tenshijinn/arubaito" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="font-consolas">View on GitHub</span>
          </a>
          <span className="text-muted-foreground text-sm font-consolas">
            ZK-Snark Secured with{" "}
            <img src="/src/assets/zcash-logo.png" alt="ZCash" className="inline h-4 mx-1" />
            ZCash, minted on{" "}
            <img src="/src/assets/solana-logo.png" alt="Solana" className="inline h-4 mx-1" />
            Solana
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm font-consolas text-muted-foreground">
          <span>zkProf by</span>
          <img src="/src/assets/arubaito-logo.png" alt="Arubaito" className="h-5" />
        </div>
      </footer>
    </div>
  );
};

export default Landing;
