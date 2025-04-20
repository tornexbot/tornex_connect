import { Transaction } from '@solana/web3.js';

// wallets.ts
export interface Wallet {
    name: string;
    icon: string;
    detect: () => boolean;
    connect: () => Promise<{
      publicKey: string;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
    }>;
    installUrl?: string;
  }
  
  export const SUPPORTED_WALLETS: Wallet[] = [
    {
      name: 'Phantom',
      icon: 'https://cdn.brandfetch.io/id_HKIytUb/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B',
      installUrl: 'https://phantom.app/',
      detect: () => !!window.phantom?.solana?.isPhantom,
      connect: async () => {
        const provider = window.phantom?.solana;
        if (!provider) throw new Error('Phantom not detected');
        const res = await provider.connect();
        return {
          publicKey: res.publicKey.toString(),
          signTransaction: (tx: Transaction) => provider.signTransaction(tx)
        };
      }
    },
    {
      name: 'Solflare',
      icon: 'https://cdn.brandfetch.io/idtkbbbh-o/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B',
      installUrl: 'https://solflare.com/',
      detect: () => !!window.solflare?.isSolflare,
      connect: async () => {
        const provider = window.solflare;
        if (!provider) throw new Error('Solflare not detected');
        const res = await provider.connect();
        return {
          publicKey: res.publicKey.toString(),
          signTransaction: (tx: Transaction) => provider.signTransaction(tx)
        };
      }
    },
    {
      name: 'Backpack',
      icon: 'https://cdn.brandfetch.io/idb1T6jQoI/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B',
      installUrl: 'https://backpack.app/',
      detect: () => !!window.backpack,
      connect: async () => {
        const provider = window.backpack;
        if (!provider) throw new Error('Backpack not detected');
        const res = await provider.connect();
        return {
          publicKey: res.publicKey.toString(),
          signTransaction: (tx: Transaction) => provider.signTransaction(tx)
        };
      }
    },
    {
      name: 'Glow',
      icon: 'https://cdn.brandfetch.io/id5E3atWdf/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B',
      installUrl: 'https://glow.app/',
      detect: () => !!window.glow,
      connect: async () => {
        const provider = window.glow;
        if (!provider) throw new Error('Glow not detected');
        const res = await provider.connect();
        return {
          publicKey: res.publicKey.toString(),
          signTransaction: (tx: Transaction) => provider.signTransaction(tx)
        };
      }
    }
  ];