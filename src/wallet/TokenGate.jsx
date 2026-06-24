'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import useGameStore from '@/store/gameStore';

export default function TokenGate({ children }) {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { hasAccess, setWalletStatus } = useGameStore();

  useEffect(() => {
    if (connected && publicKey) {
      checkTokenBalance(publicKey.toString());
    } else {
      setWalletStatus(false, false, null);
    }
  }, [connected, publicKey]);

  async function checkTokenBalance(address) {
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
      setError('Gagal memverifikasi token.');
      setWalletStatus(true, false, address);
    } finally {
      setLoading(false);
    }
  }

  if (hasAccess) {
    return children;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-deep)] text-[var(--ash-white)] p-4 text-center">
      <h1 className="text-6xl font-serif text-[var(--ink-gold)] mb-4 tracking-wider">EASTCRAFT MONARA</h1>
      <p className="text-xl mb-12 font-mono opacity-80">Sign to Fight. Climb the Monara.</p>
      
      <div className="bg-[var(--bg-panel)] p-10 rounded-xl border-4 border-[var(--ink-red)] shadow-[0_0_50px_rgba(200,51,74,0.3)] flex flex-col items-center max-w-lg">
        <h2 className="text-3xl mb-4 font-serif">Akses Terkunci</h2>
        <p className="mb-8 opacity-90">
          Permainan ini hanya dapat diakses oleh pemegang token $MONARA. 
          Hubungkan wallet Solana Anda (Phantom) untuk memverifikasi kepemilikan token.
        </p>
        
        <WalletMultiButton className="!bg-[#C8334A] hover:!bg-red-700 transition-colors !rounded-sm !font-mono !text-lg !px-8 !h-14" />
        
        <div className="h-12 mt-6">
          {loading && <p className="text-[var(--ink-gold)] animate-pulse">Memverifikasi saldo di Helius RPC...</p>}
          {error && <p className="text-[var(--gesture-bad)]">{error}</p>}
          {!loading && !hasAccess && connected && (
            <p className="text-[var(--gesture-bad)] font-bold">
              Saldo $MONARA Anda tidak mencukupi untuk masuk ke permainan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
