import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { publicKey } = body;

    if (!publicKey) {
      return NextResponse.json({ error: 'Public key is required' }, { status: 400 });
    }

    const heliusRpcUrl = process.env.HELIUS_RPC_URL;
    const tokenCa = process.env.TOKEN_CA;
    const threshold = parseInt(process.env.TOKEN_THRESHOLD || '1000', 10);

    if (!heliusRpcUrl || !tokenCa) {
      console.warn('Helius RPC URL or Token CA is not configured. Bypassing check for development.');
      return NextResponse.json({ 
        success: true, 
        balance: 9999, 
        hasAccess: true, 
        threshold: threshold,
        note: 'Bypassed due to missing config'
      });
    }

    // Connect to Helius RPC
    const connection = new Connection(heliusRpcUrl);
    const ownerPubkey = new PublicKey(publicKey);
    const mintPubkey = new PublicKey(tokenCa);

    // Get token accounts
    const response = await connection.getParsedTokenAccountsByOwner(ownerPubkey, {
      mint: mintPubkey
    });

    let balance = 0;
    if (response.value.length > 0) {
      const accountInfo = response.value[0].account.data.parsed.info;
      balance = accountInfo.tokenAmount.uiAmount;
    }

    const hasAccess = balance >= threshold;

    return NextResponse.json({
      success: true,
      balance,
      hasAccess,
      threshold
    });

  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
