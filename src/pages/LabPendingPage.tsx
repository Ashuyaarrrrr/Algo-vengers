import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { recordQualityTest, UI_ROLE_TO_CONTRACT_ROLE, hasRole } from '@/lib/blockchain';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Clock, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';

export default function LabPendingPage() {
  const wallet = useWallet();
  const [pending, setPending]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionId, setCollectionId] = useState('');
  const [testType, setTestType]         = useState('');
  const [status, setStatus]             = useState('pending');
  const [moistureContent, setMoistureContent] = useState('');
  const [pesticideLevel, setPesticideLevel]   = useState('');
  const [dnaAuth, setDnaAuth]           = useState('true');
  const [submitting, setSubmitting]     = useState(false);
  const [lastTxHash, setLastTxHash]     = useState<string | null>(null);
  const [hasLabRole, setHasLabRole]     = useState<boolean | null>(null);

  useEffect(() => { fetchPendingTests(); fetchCollections(); }, []);

  useEffect(() => {
    if (!wallet.account) { setHasLabRole(null); return; }
    hasRole(UI_ROLE_TO_CONTRACT_ROLE['lab'], wallet.account).then(setHasLabRole);
  }, [wallet.account]);

  const fetchCollections = async () => {
    const { data, error } = await supabase
      .from('collections').select('id, batch_id').order('created_at', { ascending: false });
    if (!error) setCollections(data || []);
  };

  const fetchPendingTests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*, collections(batch_id)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPending(data || []);
    } catch (err: any) {
      toast.error('Failed to load pending tests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId || !testType) {
      toast.error('Please select both a Batch ID and a Test Type');
      return;
    }
    setSubmitting(true);
    setLastTxHash(null);
    try {
      // ── Step 1: Save to Supabase ──────────────────────────────
      const { error: insertError } = await supabase.from('lab_tests').insert({
        collection_id: collectionId,
        test_type:     testType,
        status,
        result: status === 'pending' ? 'Awaiting analysis'
              : status === 'pass'    ? 'Passed all checks'
              :                        'Failed quality checks',
      });
      if (insertError) throw insertError;
      toast.success('Lab test saved to database');

      // ── Step 2: Blockchain write (if wallet connected + role) ──
      if (wallet.isConnected && wallet.isCorrectNetwork && hasLabRole) {
        // Find the on-chain batchId for this collection
        const col = collections.find((c) => c.id === collectionId);
        const onChainBatchId = col?.batch_id;

        if (onChainBatchId && onChainBatchId.startsWith('0x')) {
          try {
            const moisture  = moistureContent ? Math.round(parseFloat(moistureContent) * 100) : 0;
            const pesticide = pesticideLevel   ? Math.round(parseFloat(pesticideLevel))   : 0;
            const passed    = status === 'pass';

            const { txHash } = await recordQualityTest({
              batchId:         onChainBatchId,
              moistureContent: moisture,
              pesticideLevel:  pesticide,
              dnaAuthenticated: dnaAuth === 'true',
              passed,
              remarks:  `Test type: ${testType}`,
              ipfsHash: '',
            });
            setLastTxHash(txHash);
            toast.success(`On-chain! TX: ${txHash.slice(0, 10)}…`);
          } catch (bcErr: any) {
            toast.warning(`DB saved`);
          }
        } else {
          toast.info('DB saved');
        }
      }

      setCollectionId('');
      setTestType('');
      await fetchPendingTests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-6 animate-fade-in max-w-4xl">

{/* Upload form */}
      <div className="mb-8">
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Lab Report
            </CardTitle>
            <CardDescription>
              Submit a quality test result. Results are saved to the database and optionally recorded on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Batch ID */}
              <div className="space-y-2">
                <Label htmlFor="batchId">Batch ID</Label>
                <Select value={collectionId} onValueChange={setCollectionId} required>
                  <SelectTrigger id="batchId"><SelectValue placeholder="Select Batch ID" /></SelectTrigger>
                  <SelectContent>
                    {collections.map((col) => (
                      <SelectItem key={col.id} value={col.id}>{col.batch_id || col.id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Test Type */}
              <div className="space-y-2">
                <Label htmlFor="testType">Test Type</Label>
                <Select value={testType} onValueChange={setTestType} required>
                  <SelectTrigger id="testType"><SelectValue placeholder="Select Test Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNA Barcoding">DNA Barcoding</SelectItem>
                    <SelectItem value="Heavy Metals">Heavy Metals</SelectItem>
                    <SelectItem value="Pesticide Residue">Pesticide Residue</SelectItem>
                    <SelectItem value="Moisture Content">Moisture Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Result Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Result Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Extra blockchain fields (shown when wallet connected) */}
              {wallet.isConnected && hasLabRole && (
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                  <p className="col-span-3 text-xs font-medium text-emerald-700">On-chain parameters</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Moisture %</Label>
                    <Input type="number" min="0" max="100" step="0.01" placeholder="12.5"
                      value={moistureContent} onChange={(e) => setMoistureContent(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pesticide (ppb)</Label>
                    <Input type="number" min="0" placeholder="0"
                      value={pesticideLevel} onChange={(e) => setPesticideLevel(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">DNA Auth</Label>
                    <Select value={dnaAuth} onValueChange={setDnaAuth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* PDF upload (visual only) */}
              <div className="space-y-2">
                <Label htmlFor="reportFile">Upload Report (PDF)</Label>
                <Input id="reportFile" type="file" accept=".pdf"
                  className="cursor-pointer file:cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:-ml-2 file:text-sm file:font-medium" />
              </div>

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                ) : (
                  <>
                    Submit Report
                  {wallet.isConnected && hasLabRole && <BlockchainBadge txHash={lastTxHash || ''} status="confirmed" />}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Pending list */}
      <h1 className="text-2xl font-bold mb-1">Pending Tests</h1>
      <p className="text-muted-foreground mb-4">{pending.length} tests awaiting results.</p>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
      ) : pending.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No pending tests 🎉</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {pending.map((test) => (
            <Card key={test.id} className="border-amber-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{test.test_type}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {test.collections?.batch_id || 'Unknown Batch'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submitted: {new Date(test.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
