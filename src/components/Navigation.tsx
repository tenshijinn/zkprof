import { NavLink } from "@/components/NavLink";
import { Github, Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import arubaitoLogo from "@/assets/arubaito-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavigationProps {
  walletBalance?: number | null;
  solPrice?: number | null;
  connected?: boolean;
}

const Navigation = ({ walletBalance, solPrice, connected }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const scrollToZKPFPs = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("zkpfps-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  const menuItems = (
    <>
      <NavLink
        to="/"
        className="text-foreground/60 hover:text-primary transition-colors font-mono text-sm"
        activeClassName="text-foreground"
        onClick={() => setIsOpen(false)}
      >
        Take Photo
      </NavLink>
      <NavLink
        to="/how-to-use"
        className="text-foreground/60 hover:text-primary transition-colors font-mono text-sm"
        activeClassName="text-foreground"
        onClick={() => setIsOpen(false)}
      >
        How To Use
      </NavLink>
      <a
        href="#zkpfps-section"
        onClick={scrollToZKPFPs}
        className="text-foreground/60 hover:text-primary transition-colors font-mono text-sm"
      >
        zkPFPs
      </a>
    </>
  );

  return (
    <nav className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <span className="text-foreground/80 font-mono text-sm whitespace-nowrap">zkProf by</span>
          <a href="https://arubaito.app" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img src={arubaitoLogo} alt="Arubaito" className="h-5" />
          </a>
        </div>

        {/* Center: Navigation (desktop only) */}
        {!isMobile && (
          <div className="flex items-center gap-12">
            {menuItems}
          </div>
        )}

        {/* Right: Wallet Balance + GitHub */}
        <div className="flex items-center gap-4">
          {/* Wallet Balance (desktop only) */}
          {!isMobile && connected && walletBalance !== null && solPrice !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 border border-border rounded-lg">
              <Wallet size={14} className="text-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-mono text-foreground">
                  {walletBalance.toFixed(4)} SOL
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  ${(walletBalance * solPrice).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* GitHub Link */}
          <a 
            href="https://github.com/tenshijinn/arubaito" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-foreground/60 hover:text-primary transition-colors"
          >
            <Github size={20} />
          </a>

          {/* Mobile Menu */}
          {isMobile && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-6 mt-8">
                  {menuItems}
                  
                  {/* Wallet Balance in mobile menu */}
                  {connected && walletBalance !== null && solPrice !== null && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 border border-border rounded-lg mt-4">
                      <Wallet size={14} className="text-primary" />
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-foreground">
                          {walletBalance.toFixed(4)} SOL
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ${(walletBalance * solPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
