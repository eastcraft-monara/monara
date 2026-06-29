import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export function useTokenBalance() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!publicKey) {
      setBalance(0);
      return;
    }
    const fetchBalance = async () => {
      try {
        const tokenCa = process.env.NEXT_PUBLIC_TOKEN_CA;
        if (!tokenCa) return;
        const mintPubkey = new PublicKey(tokenCa);
        const playerAta = await getAssociatedTokenAddress(mintPubkey, publicKey);
        const info = await connection.getTokenAccountBalance(playerAta);
        setBalance(info.value.uiAmount || 0);
      } catch (err) {
        setBalance(0);
      }
    };
    fetchBalance();
  }, [publicKey, connection]);

  return balance;
}
