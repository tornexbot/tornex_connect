/// <reference types="vite/client" />
/// <reference types="@types/react" />
/// <reference types="@types/react-dom" />
/// <reference types="@solana/web3.js" />


interface WalletProvider {
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
    isConnected?: boolean;
    disconnect?: () => Promise<void>;
  }
  
  interface Window {
    phantom?: { 
      solana: WalletProvider & { 
        isPhantom: true;
        signAndSendTransaction?: (tx: Transaction) => Promise<{ signature: string }>;
      } 
    };
    solflare?: WalletProvider & { 
      isSolflare: true;
      signAndSendTransaction?: (tx: Transaction) => Promise<{ signature: string }>;
    };
    backpack?: WalletProvider & {
      signAndSendTransaction?: (tx: Transaction) => Promise<{ signature: string }>;
    };
    glow?: WalletProvider & {
      signAndSendTransaction?: (tx: Transaction) => Promise<{ signature: string }>;
    };
  }
  