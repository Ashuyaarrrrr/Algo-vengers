import { useState, useEffect, useCallback } from 'react';
import { StatCard } from '@/components/StatCard';
import { Globe, Activity, Server, Wifi, RefreshCw, Box, Users, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { WalletConnect } from '@/components/WalletConnect';
import {
  getNetworkInfo,
  getTotalBatches,
  grantRole,
} from '@/lib/blockchain';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';

interface NetworkInfo {
  blockNumber: number;
  chainId: number;
  isConnected: boolean;
  timestamp: number;
}

export default function AdminNetworkPage() {
  const wallet = useWallet();
  const [netInfo, setNetInfo]     = useState<NetworkInfo | null>(null);
  const [totalBatches, setTotalBatches] = useState<number | null>(null);
  const [totalUsers, setTotalUsers]     = useState<number | null>(null);
  const [loading, setLoading]           = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Role granting state
  const [grantAddress, setGrantAddress]   = useState('');
  const [grantRoleName, setGrantRoleName] = useState('COLLECTOR');
  const [grantLoading, setGrantLoading]   = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [info, { count }] = await Promise.all([
        getNetworkInfo(),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);
      setNetInfo(info as NetworkInfo);
      setTotalUsers(count ?? 0);

      if (info.isConnected) {
        try {
          const total = await getTotalBatches();
          setTotalBatches(Number(total));
        } catch {
          setTotalBatches(0);
        }
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Network fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleGrantRole = async () => {
    if (!grantAddress.trim()) { toast.error('Enter a wallet address'); return; }
    if (!wallet.isConnected)  { toast.error('Connect admin wallet first'); return; }
    setGrantLoading(true);
    try {
      await grantRole(grantRoleName, grantAddress.trim());
      toast.success(`${grantRoleName} granted to ${grantAddress.slice(0, 8)}…`);
      setGrantAddress('');
    } catch (err: any) {
      toast.error(err.reason ?? err.message ?? 'Failed to grant role');
    } finally {
      setGrantLoading(false);
    }
  };

  const chainStatus = netInfo?.isConnected ? 'Online' : 'Offline';

  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Network Health</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hardhat Localhost · Chain 31337
            {lastRefreshed && ` · Updated ${lastRefreshed.toLocaleTimeString()}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Live stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Chain Status"
          value={loading ? '…' : chainStatus}
          icon={Globe}
        />
        <StatCard
          label="Block Height"
          value={loading ? '…' : (netInfo?.blockNumber?.toLocaleString() ?? '—')}
          icon={Server}
        />
        <StatCard
          label="Total Batches"
          value={loading ? '…' : (totalBatches?.toString() ?? '—')}
          icon={Box}
        />
        <StatCard
          label="Registered Users"
          value={loading ? '…' : (totalUsers?.toString() ?? '—')}
          icon={Users}
        />
      </div>

      {/* Connection panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" /> Blockchain Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">RPC Endpoint</p>
              <p className="font-mono font-medium">http://127.0.0.1:8545</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Chain ID</p>
              <p className="font-mono font-medium">{netInfo?.chainId ?? '—'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${netInfo?.isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="font-medium">{netInfo?.isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>

          {!netInfo?.isConnected && (
            <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
              ⚠️ Cannot reach the Hardhat node. Run <code className="font-mono bg-amber-100 px-1 rounded">npx hardhat node</code> in the blockchain directory.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin: Role Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Role Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!wallet.isConnected ? (
            <div className="text-sm text-muted-foreground flex items-center gap-3">
              Connect your admin MetaMask wallet to grant/revoke roles.
              <WalletConnect />
            </div>
          ) : !wallet.isCorrectNetwork ? (
            <div className="text-sm text-amber-700">
              Please switch to Hardhat Localhost network.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Grant a blockchain role to a wallet address. Only the contract admin can do this.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="0x... wallet address"
                  value={grantAddress}
                  onChange={(e) => setGrantAddress(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border rounded-md font-mono bg-background"
                />
                <select
                  value={grantRoleName}
                  onChange={(e) => setGrantRoleName(e.target.value)}
                  className="px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="COLLECTOR">COLLECTOR (Farmer)</option>
                  <option value="PROCESSOR">PROCESSOR</option>
                  <option value="LAB">LAB</option>
                  <option value="MANUFACTURER">MANUFACTURER</option>
                  <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                  <option value="RETAILER">RETAILER</option>
                </select>
                <Button onClick={handleGrantRole} disabled={grantLoading} className="whitespace-nowrap">
                  {grantLoading ? 'Granting…' : 'Grant Role'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Connected as: <span className="font-mono">{wallet.account}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Node list (cosmetic + chain info) */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Hardhat Nodes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Hardhat Node 0 (Deployer/Admin)', role: 'Admin',     local: true  },
              { name: 'Hardhat Node 1 (Farmer)',         role: 'Collector', local: true  },
              { name: 'Hardhat Node 2 (Lab)',            role: 'Lab',       local: true  },
              { name: 'Hardhat Node 3 (Processor)',      role: 'Processor', local: true  },
              { name: 'Hardhat Node 4 (Manufacturer)',   role: 'Manufacturer', local: true },
            ].map((node) => (
              <div key={node.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${netInfo?.isConnected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div>
                    <span className="font-medium text-sm">{node.name}</span>
                    <p className="text-xs text-muted-foreground">
                      Role: {node.role} · Localhost · Block #{netInfo?.blockNumber ?? '?'}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={netInfo?.isConnected ? 'default' : 'secondary'}
                  className={netInfo?.isConnected ? 'bg-emerald-600 text-white' : ''}
                >
                  {netInfo?.isConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
