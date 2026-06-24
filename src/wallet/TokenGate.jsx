'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import useGameStore from '@/store/gameStore';

export default function TokenGate({ children }) {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { hasAccess, setWalletStatus } = useGameStore();

  useEffect(() => {
    setMounted(true);
    if (!connected) {
      setWalletStatus(false, false, null);
    }
    // We no longer automatically set hasAccess = true here,
    // so the TokenGate UI remains visible until the user clicks "Enter Game".
  }, [connected, publicKey]);

  const handleEnterGame = () => {
    if (connected && publicKey) {
      // DUMMY MODE: Because the $MONARA token is not released yet, we grant access immediately upon click.
      setWalletStatus(true, true, publicKey.toString());
    }
  };

  async function checkTokenBalance(address) {
    /* 
    --- ORIGINAL CODE FOR TOKEN GATING ---
    (Use this code when the $MONARA token is released)

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: address })
      });
      const data = await response.json();
      
      if (data.success && data.hasAccess) {
        setWalletStatus(true, true, address);
      } else {
        setWalletStatus(true, false, address);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to verify token.');
      setWalletStatus(true, false, address);
    } finally {
      setLoading(false);
    }
    */
  }

  if (hasAccess) {
    return children;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-deep)] text-[var(--ash-white)] p-4 text-center">
      <h1 className="text-6xl font-serif text-[var(--ink-gold)] mb-4 tracking-wider">EASTCRAFT MONARA</h1>
      <p className="text-xl mb-12 font-mono opacity-80">Sign to Fight. Climb the Monara.</p>
      
      <div className="bg-[var(--bg-panel)] p-10 rounded-xl border-4 border-[var(--ink-red)] shadow-[0_0_50px_rgba(200,51,74,0.3)] flex flex-col items-center max-w-lg">
        <h2 className="text-3xl mb-4 font-serif">Access Locked</h2>
        <p className="mb-8 opacity-90">
          This game is only accessible to $MONARA token holders.
          Connect your Solana wallet (Phantom) to verify token ownership.
        </p>
        
        {mounted && !connected && (
          <WalletMultiButton className="!bg-[#C8334A] hover:!bg-red-700 transition-colors !rounded-sm !font-mono !text-lg !px-8 !h-14" />
        )}

        {mounted && connected && (
          <div className="flex flex-col items-center">
            <p className="text-[#4CAF82] font-mono mb-4">Wallet Connected: {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}</p>
            <button 
              onClick={handleEnterGame}
              className="bg-[#D4A853] hover:bg-yellow-600 text-black transition-colors rounded-sm font-mono text-lg px-8 h-14"
            >
              ENTER GAME (DUMMY MODE)
            </button>
          </div>
        )}
        
        <div className="h-12 mt-6">
          {loading && <p className="text-[var(--ink-gold)] animate-pulse">Verifying balance via Helius RPC...</p>}
          {error && <p className="text-[var(--gesture-bad)]">{error}</p>}
          {!loading && !hasAccess && connected && (
            <p className="text-[var(--gesture-bad)] font-bold">
              Insufficient $MONARA balance to access the game.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
