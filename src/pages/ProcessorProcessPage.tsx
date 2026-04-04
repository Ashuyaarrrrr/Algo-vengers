import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { addProcessingStep, UI_ROLE_TO_CONTRACT_ROLE, hasRole } from '@/lib/blockchain';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Factory, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';

// Maps UI stage labels → contract ProcessType enum values
const STAGE_TO_PROCESS_TYPE: Record<string, string> = {
  Drying:     'Drying',
  Grinding:   'Grinding',
  Storage:    'Storage',
  Extraction: 'Extraction',
  Sorting:    'Sorting',
  Packaging:  'Packaging',
};

export default function ProcessorProcessPage() {
  const wallet = useWallet();
  const [submitted, setSubmitted]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionId, setCollectionId] = useState('');
  const [stage, setStage]             = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity]       = useState('');
  const [facilityId, setFacilityId]   = useState('');
  const [conditions, setConditions]   = useState('');
  const [notes, setNotes]             = useState('');
  const [txHash, setTxHash]           = useState<string | null>(null);
  const [hasProcessorRole, setHasProcessorRole] = useState<boolean | null>(null);

  useEffect(() => { fetchCollections(); }, []);

  useEffect(() => {
    if (!wallet.account) { setHasProcessorRole(null); return; }
    hasRole(UI_ROLE_TO_CONTRACT_ROLE['processor'], wallet.account).then(setHasProcessorRole);
  }, [wallet.account]);

  const fetchCollections = async () => {
    const { data, error } = await supabase
      .from('collections').select('id, batch_id').order('created_at', { ascending: false });
    if (!error) setCollections(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId || !stage) {
      toast.error('Please select both a Batch ID and a Stage');
      return;
    }
    setSubmitting(true);
    setTxHash(null);
    try {
      // ── Step 1: Supabase ─────────────────────────────────────
      const { error } = await supabase.from('processing_steps').insert({
        collection_id: collectionId,
        stage,
        temperature: temperature ? parseFloat(temperature) : null,
        humidity:    humidity    ? parseFloat(humidity)    : null,
        facility_id: facilityId || null,
        status:      'in-progress',
        started_at:  new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Processing step saved to database');

      // ── Step 2: Blockchain ───────────────────────────────────
      if (wallet.isConnected && wallet.isCorrectNetwork && hasProcessorRole) {
        const col = collections.find((c) => c.id === collectionId);
        const onChainBatchId = col?.batch_id;

        if (onChainBatchId && onChainBatchId.startsWith('0x')) {
          try {
            const { txHash: hash } = await addProcessingStep({
              batchId:           onChainBatchId,
              processType:       STAGE_TO_PROCESS_TYPE[stage] || stage,
              storageConditions: conditions || `${stage} conditions`,
              notes:             notes || `Stage: ${stage}`,
              temperature:       temperature ? Math.round(parseFloat(temperature)) : 0,
              humidity:          humidity ? Math.round(parseFloat(humidity)) : 0,
              facilityId:        facilityId || 'FACILITY-01',
              ipfsHash:          '',
            });
            setTxHash(hash);
            toast.success(`On-chain! TX: ${hash.slice(0, 10)}…`);
          } catch (bcErr: any) {
            toast.warning(`DB saved but blockchain failed: ${bcErr.message}`);
          }
        } else {
          toast.info('No on-chain batch ID — DB only');
        }
      } // end if (wallet.isConnected...)

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to log step');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setTxHash(null);
    setCollectionId('');
    setStage('');
    setTemperature('');
    setHumidity('');
    setFacilityId('');
    setConditions('');
    setNotes('');
  };

  if (submitted) {
    return (
      <div className="container max-w-lg py-12 text-center animate-fade-in">
        <div className="rounded-full bg-emerald-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold">Processing Step Logged</h2>
        <p className="text-muted-foreground mt-2">Step is now tracked as in-progress.</p>
        {txHash && (
          <div className="mt-3 flex justify-center">
            <BlockchainBadge txHash={txHash} status="confirmed" />
          </div>
        )}
        <Button className="mt-6" onClick={handleReset}>Log Another</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-xl py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">New Processing Step</h1>
      <p className="text-muted-foreground mb-4">Log a processing stage for a batch.</p>

<Card>
        <CardContent className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="batchId">Batch ID</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger id="batchId"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.batch_id || col.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger id="stage"><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(STAGE_TO_PROCESS_TYPE).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input id="temperature" type="number" placeholder="45"
                  value={temperature} onChange={(e) => setTemperature(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input id="humidity" type="number" placeholder="15"
                  value={humidity} onChange={(e) => setHumidity(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilityId">Facility ID</Label>
              <Input id="facilityId" placeholder="e.g. FAC-HC-01"
                value={facilityId} onChange={(e) => setFacilityId(e.target.value)} />
            </div>

            {/* Extra on-chain fields */}
            {wallet.isConnected && hasProcessorRole && (
              <div className="space-y-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                <p className="text-xs font-medium text-emerald-700">On-chain parameters</p>
                <div className="space-y-2">
                  <Label className="text-xs">Storage Conditions</Label>
                  <Input placeholder="e.g. 40°C, 15% RH, sealed container"
                    value={conditions} onChange={(e) => setConditions(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Notes</Label>
                  <Input placeholder="Any additional processing notes"
                    value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Logging…</>
              ) : (
                <>
                  <Factory className="h-4 w-4 mr-2" /> Log Step
                  {wallet.isConnected && hasProcessorRole && (
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
