import { supabase } from './supabase';

export interface PaystackPaymentData {
  email: string;
  amount: number;
  reference?: string;
  channels?: string[];
  metadata?: Record<string, any>;
}

export function toKobo(amount: number): number {
  return Math.round(amount * 100);
}

export function fromKobo(amount: number): number {
  return amount / 100;
}

export function generateReference(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export async function initializePayment(data: PaystackPaymentData) {
  try {
    const { data: result, error } = await supabase.functions.invoke('paystack-initialize', {
      body: { ...data, amount: toKobo(data.amount) },
    });
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
}

export async function verifyPayment(reference: string) {
  try {
    const { data: result, error } = await supabase.functions.invoke('paystack-verify', {
      body: { reference },
    });
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}

export async function createDedicatedAccount(userId: string, email: string) {
  try {
    const { data: result, error } = await supabase.functions.invoke('paystack-create-dva', {
      body: { userId, email },
    });
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('DVA creation error:', error);
    throw error;
  }
}

export async function chargeSavedCard(
  authorizationCode: string,
  email: string,
  amount: number,
  reference?: string
) {
  try {
    const { data: result, error } = await supabase.functions.invoke('paystack-charge', {
      body: {
        authorization_code: authorizationCode,
        email,
        amount: toKobo(amount),
        reference: reference || generateReference(),
      },
    });
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Card charge error:', error);
    throw error;
  }
}
