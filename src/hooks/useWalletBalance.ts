import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";

export function useWalletBalance() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalanceAndPrice = async () => {
      if (!publicKey || !connection) return;

      try {
        const [balance, priceData] = await Promise.all([
          connection.getBalance(publicKey),
          supabase.functions.invoke("get-sol-price"),
        ]);
        
        setWalletBalance(balance / LAMPORTS_PER_SOL);
        
        if (priceData.data && typeof priceData.data.price === "number") {
          setSolPrice(priceData.data.price);
        }
      } catch (error) {
        console.error("Failed to fetch balance/price:", error);
      }
    };

    if (connected) {
      fetchBalanceAndPrice();
      const interval = setInterval(fetchBalanceAndPrice, 30000);
      return () => clearInterval(interval);
    }
  }, [publicKey, connection, connected]);

  return { walletBalance, solPrice };
}
