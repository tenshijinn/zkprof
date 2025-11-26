import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Wallet } from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import zkProfLogo from "@/assets/zkprof-logo.png";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentPage?: "take-photo" | "zkpfps" | "how-to-use";
  walletBalance?: number | null;
  solPrice?: number | null;
}

export function Header({ currentPage = "take-photo", walletBalance, solPrice }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { connected } = useWallet();

  return (
    <>
      {/* Header */}
      <div className="w-full flex justify-between items-center px-8 py-6">
        <Link to="/">
          <img src={zkProfLogo} alt="zkProf" className="h-8" />
        </Link>
        
        {/* Desktop Navigation Menu */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className={`text-sm transition-colors ${
              currentPage === "take-photo" ? "text-[#ed565a]" : "text-foreground hover:text-[#ed565a]"
            }`}
          >
            Take Photo
          </Link>
          <Link 
            to="/zkpfps" 
            className={`text-sm transition-colors ${
              currentPage === "zkpfps" ? "text-[#ed565a]" : "text-foreground hover:text-[#ed565a]"
            }`}
          >
            zkPFPs
          </Link>
          <Link 
            to="/how-to-use" 
            className={`text-sm transition-colors ${
              currentPage === "how-to-use" ? "text-[#ed565a]" : "text-foreground hover:text-[#ed565a]"
            }`}
          >
            How To Use
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
        
        {/* Desktop Wallet Balance */}
        <div className="hidden md:block">
          {connected && walletBalance !== null && solPrice !== null ? (
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
          ) : (
            <WalletMultiButton className="!h-10 !rounded-xl !font-styrene !font-black !text-sm !bg-secondary !text-[#181818] !border-2 !border-secondary hover:!bg-transparent hover:!text-[#ed565a] hover:!border-[#ed565a]" />
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="flex flex-col px-8 py-4 space-y-4">
            <Link 
              to="/" 
              className={`text-sm transition-colors ${
                currentPage === "take-photo" ? "text-[#ed565a]" : "text-foreground hover:text-[#ed565a]"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Take Photo
            </Link>
            <Link 
              to="/zkpfps" 
              className={`text-sm transition-colors ${
                currentPage === "zkpfps" ? "text-[#ed565a]" : "text-foreground hover:text-[#ed565a]"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              zkPFPs
            </Link>
            <Link 
              to="/how-to-use" 
              className={`text-sm transition-colors ${
                currentPage === "how-to-use" ? "text-[#ed565a]" : "text-foreground hover:text-[#ed565a]"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              How To Use
            </Link>
            
            {/* Mobile Wallet */}
            <div className="pt-2">
              {connected && walletBalance !== null && solPrice !== null ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border border-border rounded-xl w-fit">
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
              ) : (
                <WalletMultiButton className="!h-10 !rounded-xl !font-styrene !font-black !text-sm !bg-secondary !text-[#181818] !border-2 !border-secondary hover:!bg-transparent hover:!text-[#ed565a] hover:!border-[#ed565a]" />
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
