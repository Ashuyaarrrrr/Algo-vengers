/**
 * RetailerReceivePage.tsx — Retailer: receive a batch, complete the chain
 * ═════════════════════════════════════════════════════════════════════════
 * Role: Retailer (RETAILER_ROLE on-chain)
 * Action: transferOwnership is not called here (retailer is the END of chain).
 * Instead, the retailer can VIEW the full provenance of any batch they hold.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { hasRole } from '@/lib/blockchain';
import { getBatchProvenance } from '@/lib/blockchain';
import { WalletConnect, ProvenanceTimeline } from '@/components/WalletConnect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, ShieldCheck, AlertTriangle, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function RetailerReceivePage() {
  const wallet = useWallet();

  const [collections, setCollections] = useState<any[]>([]);
  const [collectionId, setCollectionId] = useState('');
  const [manualBatchId, setManualBatchId] = useState('');
  const [provenance, setProvenance]     = useState<any | null>(null);
  const [loading, setLoading]           = useState(false);
  const [hasRetailRole, setHasRetailRole] = useState<boolean | null>(null);

  useEffect(() => { fetchCollections(); }, []);

  useEffect(() => {
    if (!wallet.account) { setHasRetailRole(null); return; }
    hasRole('RETAILER', wallet.account).then(setHasRetailRole);
  }, [wallet.account]);

  const fetchCollections = async () => {
    const { data } = await supabase
      .from('collections')
      .select('id, batch_id, species, quantity, unit')
      .not('batch_id', 'is', null)
      .order('created_at', { ascending: false });
    setCollections(data || []);
  };

  const handleFetchProvenance = async () => {
    // Use manual entry first, then dropdown
    const col = collections.find((c) => c.id === collectionId);
    const batchId = manualBatchId.trim() || col?.batch_id;

    if (!batchId) {
      return toast.error('Enter a batch ID or select a batch from the dropdown');
    }

    setLoading(true);
    setProvenance(null);
    try {
      const prov = await getBatchProvenance(batchId);
      setProvenance(prov);
      toast.success('Provenance loaded from blockchain ✅');
    } catch (err: any) {
      toast.error(`Failed to fetch provenance: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-1">
        <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
          <ShoppingBag className="h-5 w-5 text-purple-700 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Retailer — Batch Verification</h1>
          <p className="text-muted-foreground">View the full blockchain provenance of any batch you hold.</p>
        </div>
      </div>

      {/* Wallet status */}
      {!wallet.isConnected && (
        <div className="my-4 p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Connect MetaMask to verify your RETAILER_ROLE and view on-chain data.
          <div className="ml-auto"><WalletConnect /></div>
        </div>
      )}
      {wallet.isConnected && hasRetailRole === false && (
        <div className="my-4 flex items-center gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Your wallet (<span className="font-mono">{wallet.account?.slice(0, 8)}…</span>) lacks{' '}
          <strong>RETAILER_ROLE</strong>. The admin must grant it before you can appear in transfer records.
        </div>
      )}
      {wallet.isConnected && hasRetailRole === true && (
        <div className="my-4 flex items-center gap-2 p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          RETAILER_ROLE verified for <span className="font-mono">{wallet.account?.slice(0, 8)}…</span>
        </div>
      )}

      {/* Lookup card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Lookup Batch Provenance
          </CardTitle>
          <CardDescription>
            Select a batch from the dropdown or paste an on-chain batch ID (bytes32 hex).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Dropdown */}
            <div className="space-y-1">
              <Label>Select Batch from Database</Label>
              <Select value={collectionId} onValueChange={(v) => { setCollectionId(v); setManualBatchId(''); }}>
                <SelectTrigger><SelectValue placeholder="Choose a batch…" /></SelectTrigger>
                <SelectContent>
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      <span className="font-mono text-xs">{col.batch_id?.slice(0, 14)}…</span>
                      {col.species && <span className="text-muted-foreground ml-2 text-xs">— {col.species}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />OR paste a batch ID directly
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Manual entry */}
            <div className="space-y-1">
              <Label>On-Chain Batch ID (bytes32)</Label>
              <Input
                placeholder="0xabc123…"
                value={manualBatchId}
                onChange={(e) => { setManualBatchId(e.target.value); setCollectionId(''); }}
                className="font-mono text-sm"
              />
            </div>

            <Button onClick={handleFetchProvenance} disabled={loading} className="w-full">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading from blockchain…</>
              ) : (
                <><Search className="h-4 w-4 mr-2" /> Fetch Provenance</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Provenance result */}
      {provenance && (
        <ProvenanceTimeline
          batchId={provenance.batchId}
          herbName={provenance.herbName}
          collector={provenance.collector}
          isSustainable={provenance.isSustainable}
          hasPassedLatestQualityTest={provenance.hasPassedLatestQualityTest}
          processingSteps={provenance.processingSteps ?? []}
          qualityTests={provenance.qualityTests ?? []}
          transfers={provenance.transfers ?? []}
        />
      )}

      {/* Instruction card when no result yet */}
      {!provenance && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Select a batch above to view its complete blockchain provenance journey —
              from farm to the current holder.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
