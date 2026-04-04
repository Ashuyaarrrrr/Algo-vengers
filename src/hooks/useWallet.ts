/**
 * useWallet.ts — React hook for MetaMask wallet state management
 * Tracks: connected account, chain ID, connection status
 */
import { useState, useEffect, useCallback } from "react";
import {
  connectWallet,
  getConnectedAccount,
  getChainId,
  isCorrectNetwork,
  switchToHardhatNetwork,
} from "@/lib/blockchain";
import { toast } from "sonner";

export interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const refresh = useCallback(async () => {
    const acc = await getConnectedAccount();
    const cid = await getChainId();
    setAccount(acc);
    setChainId(cid);
  }, []);

  useEffect(() => {
    refresh();

    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setAccount(accounts[0] ?? null);
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { signer } = await connectWallet();
      const addr = await signer.getAddress();
      setAccount(addr);
      const cid = await getChainId();
      setChainId(cid);
      toast.success(`Wallet connected: ${addr.slice(0, 6)}...${addr.slice(-4)}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    try {
      await switchToHardhatNetwork();
      const cid = await getChainId();
      setChainId(cid);
      toast.success("Switched to Hardhat network");
    } catch (err: any) {
      toast.error(err.message || "Failed to switch network");
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    toast.info("Wallet disconnected");
  }, []);

  return {
    account,
    chainId,
    isConnected: !!account,
    isCorrectNetwork: chainId === 31337,
    isConnecting,
    connect,
    switchNetwork,
    disconnect,
  };
}
