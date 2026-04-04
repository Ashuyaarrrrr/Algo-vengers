/// <reference types="vite/client" />

/**
 * MetaMask / EIP-1193 provider type declaration.
 * This prevents `window.ethereum` from being typed as `any` everywhere.
 */
interface EthereumProvider {
  /** Send a JSON-RPC request to the wallet. */
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  /** Subscribe to wallet events (accountsChanged, chainChanged, etc.) */
  on(event: string, handler: (...args: any[]) => void): void;
  /** Unsubscribe from wallet events. */
  removeListener(event: string, handler: (...args: any[]) => void): void;
  /** Whether this is MetaMask. */
  isMetaMask?: boolean;
}

interface Window {
  ethereum?: EthereumProvider;
}
