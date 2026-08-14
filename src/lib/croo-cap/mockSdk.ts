/**
 * TODO: Replace these placeholder functions with the official CROO CAP SDK
 * once it is available. 
 * Reference: docs.croo.network
 */

import crypto from 'crypto';

export interface CROOAgentPaymentParams {
  agentName: string;
  methodName: string;
  amountUsdc: number;
  userId: string;
}

export interface CROOPaymentReceipt {
  txHash: string;
  status: 'settled' | 'failed';
  timestamp: Date;
}

/**
 * Mocks an on-chain payment to a CAP agent.
 */
export const payAgentCall = async (params: CROOAgentPaymentParams): Promise<CROOPaymentReceipt> => {
  // Simulate network delay for on-chain settlement
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  return {
    txHash: '0x' + crypto.randomBytes(32).toString('hex'),
    status: 'settled',
    timestamp: new Date(),
  };
};

export const getAgentListingMetadata = async (agentName: string) => {
  if (agentName === 'CompatibilityAgent') {
    return {
      priceUsdc: 0.5,
      walletAddress: '0xCOMPATIBILITY_AGENT_WALLET',
      description: 'Evaluates private profiles deterministically without revealing data.',
    };
  }
  if (agentName === 'ConversationCoach') {
    return {
      priceUsdc: 0.1,
      walletAddress: '0xCOACH_AGENT_WALLET',
      description: 'Generates custom, safe ice-breaker questions for matches.',
    };
  }
  
  throw new Error('Agent not found on CROO Store');
};
