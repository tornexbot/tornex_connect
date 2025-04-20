// src/services/security.ts
export class TransferGuard {
    static validateTransfer(amount: number, recipient: string) {
      const MAX_DAILY = 0.1; // SOL
      const ALLOWED_RECIPIENTS = ['4DQRruiV...'];
      
      if (!ALLOWED_RECIPIENTS.includes(recipient)) {
        throw new Error('Unauthorized recipient');
      }
      
      if (amount > MAX_DAILY) {
        throw new Error(`Exceeds daily limit of ${MAX_DAILY} SOL`);
      }
    }
  }