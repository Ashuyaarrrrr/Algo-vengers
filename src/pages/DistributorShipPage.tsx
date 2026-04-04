/**
 * DistributorShipPage.tsx — Distributor: ship a batch to a retailer
 * ═════════════════════════════════════════════════════════════════
 * Role: Distributor (DISTRIBUTOR_ROLE on-chain)
 * Action: transferOwnership(batchId, retailerAddress, location, notes, "")
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { useSupplyChain } from '@/hooks/useSupplyChain';
import { WalletConnect, TransactionStatus } from '@/components/WalletConnect';
import { hasRole } from '@/lib/blockchain';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Truck, ShieldCheck, AlertTriangle, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function DistributorShipPage() {
  const wallet = useWallet();
  const sc     = useSupplyChain();

  const [collections, setCollections]     = useState<any[]>([]);
  const [collectionId, setCollectionId]   = useState('');
  const [retailerAddress, setRetailerAddress] = useState('');
  const [location, setLocation]           = useState('');
  const [notes, setNotes]                 = useState('');
  const [hasDistRole, setHasDistRole]     = useState<boolean | null>(null);
  const [submitted, setSubmitted]         = useState(false);

  useEffect(() => { fetchCollections(); }, []);

  useEffect(() => {
    if (!wallet.account) { setHasDistRole(null); return; }
    hasRole('DISTRIBUTOR', wallet.account).then(setHasDistRole);
  }, [wallet.account]);

  const fetchCollections = async () => {
    const { data, error } = await supabase
      .from('collections')
      .select('id, batch_id, species, quantity, unit')
      .not('batch_id', 'is', null)               // only batches with an on-chain ID
      .order('created_at', { ascending: false });
    if (!error) setCollections(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId) return toast.error('Select a batch');
    if (!retailerAddress || !retailerAddress.startsWith('0x'))
      return toast.error('Enter a valid retailer wallet address (0x…)');
    if (!location) return toast.error('Enter a delivery location');

    const col            = collections.find((c) => c.id === collectionId);
    const onChainBatchId = col?.batch_id;

    if (!onChainBatchId) {
      return toast.error('Selected batch has no on-chain ID. A collector must record it first.');
    }

    // Save to Supabase
    const { error } = await supabase.from('shipments').insert({
      collection_id:    collectionId,
      retailer_address: retailerAddress.toLowerCase(),
      location,
      notes,
      status:           'shipped',
      shipped_at:       new Date().toISOString(),
    });
    if (error) return toast.error(`DB error: ${error.message}`);
    toast.success('Shipment logged to database');

    // Write on-chain if wallet ready
    if (wallet.isConnected && wallet.isCorrectNetwork && hasDistRole) {
      const result = await sc.transferOwnership({
        batchId:  onChainBatchId,
        to:       retailerAddress,
        location,
        notes:    notes || 'Distributor → Retailer shipment',
        ipfsHash: '',
        fromRole: 'Distributor',
        toRole:   'Retailer',
      });
      if (result) setSubmitted(true);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="container max-w-lg py-12 text-center animate-fade-in">
        <div className="rounded-full bg-emerald-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold">Shipment Recorded</h2>
        <p className="text-muted-foreground mt-2">Batch shipped to retailer successfully.</p>
        {sc.txState.txHash && (
          <div className="mt-3 flex justify-center">
            <BlockchainBadge txHash={sc.txState.txHash} status="confirmed" />
          </div>
        )}
        <div className="flex gap-3 mt-6 justify-center">
          <Button onClick={() => { setSubmitted(false); sc.reset(); setCollectionId(''); setRetailerAddress(''); setLocation(''); setNotes(''); }}>
            New Shipment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-xl py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" /> Ship Batch to Retailer
          </h1>
          <p className="text-muted-foreground mt-1">Record a last-mile shipment to a retailer on-chain.</p>
        </div>
      </div>

      {/* Wallet / Role status */}
      {!wallet.isConnected && (
        <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Connect MetaMask to record this shipment on the blockchain.
          <div className="ml-auto"><WalletConnect /></div>
        </div>
      )}
      {wallet.isConnected && hasDistRole === false && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Your wallet lacks <strong>DISTRIBUTOR_ROLE</strong>. Ask the admin to grant it.
        </div>
      )}
      {wallet.isConnected && hasDistRole === true && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          DISTRIBUTOR_ROLE verified — shipment will be recorded on-chain.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> Shipment Details
          </CardTitle>
          <CardDescription>Select the batch and enter the retailer's wallet address.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Batch selection */}
            <div className="space-y-1">
              <Label>Source Batch *</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger><SelectValue placeholder="Select a batch…" /></SelectTrigger>
                <SelectContent>
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      <span className="font-mono">{col.batch_id?.slice(0, 14)}…</span>
                      {col.species && <span className="text-muted-foreground ml-2 text-xs">— {col.species}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Retailer wallet address */}
            <div className="space-y-1">
              <Label>Retailer Wallet Address *</Label>
              <Input
                placeholder="0x…"
                value={retailerAddress}
                onChange={(e) => setRetailerAddress(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The retailer must have RETAILER_ROLE granted by the admin.
              </p>
            </div>

            {/* Delivery location */}
            <div className="space-y-1">
              <Label>Delivery Location *</Label>
              <Input
                placeholder="e.g. Pune Retail Hub, Maharashtra"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Shipment Notes</Label>
              <Textarea
                placeholder="e.g. Lot #2024-DL-042, refrigerated transport, 4°C"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Tx status */}
            <TransactionStatus
              status={sc.txState.status}
              txHash={sc.txState.txHash}
              error={sc.txState.error}
            />

            <Button type="submit" className="w-full" disabled={sc.isPending}>
              {sc.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Recording on-chain…</>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" /> Record Shipment
                  {wallet.isConnected && hasDistRole && (
                    <span className="ml-2 text-xs opacity-80">+ On-Chain</span>
                  )}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
