import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

// Helius mainnet RPC endpoint - required to avoid public endpoint rate limits
const HELIUS_RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=c7382c22-ce31-4a55-a0d1-c3f3d51e2091';

export const SolanaWalletProvider: FC<Props> = ({ children }) => {
  const endpoint = useMemo(() => {
    console.log('🔗 Solana RPC: Using Helius mainnet endpoint');
    return HELIUS_RPC_ENDPOINT;
  }, []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
