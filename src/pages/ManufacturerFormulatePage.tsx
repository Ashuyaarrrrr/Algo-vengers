import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';
import { recordFormulation, UI_ROLE_TO_CONTRACT_ROLE, hasRole } from '@/lib/blockchain';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Package, Plus, Trash2, Check, Loader2, FlaskConical, CalendarIcon, Leaf, Link2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Herb {
  name: string;
  percentage: number;
}

interface CreatedProduct {
  productCode: string;
  productName: string;
  dosage: string;
  mfgDate: string;
  expDate: string;
  ingredients: Herb[];
}

export default function ManufacturerFormulatePage() {
  const user   = useAuthStore((s) => s.user);
  const wallet = useWallet();

  // Form state
  const [productName, setProductName] = useState('');
  const [dosage, setDosage] = useState('');
  const [mfgDate, setMfgDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });
  const [herbs, setHerbs] = useState<Herb[]>([{ name: '', percentage: 0 }]);

  // Batch linking
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  const [submitting, setSubmitting]                   = useState(false);
  const [created, setCreated]                         = useState<CreatedProduct | null>(null);
  const [bcTxHash, setBcTxHash]                       = useState<string | null>(null);
  const [hasManufRole, setHasManufRole]               = useState<boolean | null>(null);

  useEffect(() => {
    if (!wallet.account) { setHasManufRole(null); return; }
    hasRole(UI_ROLE_TO_CONTRACT_ROLE['manufacturer'], wallet.account).then(setHasManufRole);
  }, [wallet.account]);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setCollectionsLoading(true);
    try {
      // Select all columns the FarmerCollectPage actually inserts.
      // NOTE: batch_id may be null if no trigger auto-generates it.
      // We use 'date' (not 'collected_at') — that is the actual column name.
      const { data, error } = await supabase
        .from('collections')
        .select('id, batch_id, species, quantity, unit, date, quality, location_name, latitude, longitude, collector_id')
        .order('created_at', { ascending: false });

      console.log('[ManufacturerFormulate] collections fetch →', { data, error });

      if (error) {
        console.error('[ManufacturerFormulate] RLS/query error:', error.message, error.details, error.hint);
        toast.error(`Failed to load batches: ${error.message}`);
      } else {
        setCollections(data || []);
        if (!data || data.length === 0) {
          console.warn('[ManufacturerFormulate] collections is empty — check RLS SELECT policy for authenticated users');
        }
      }
    } finally {
      setCollectionsLoading(false);
    }
  };

  // ── helpers ──────────────────────────────────────────────
  const totalPct = herbs.reduce((s, h) => s + Number(h.percentage), 0);

  const updateHerb = (i: number, field: keyof Herb, value: string | number) => {
    const next = [...herbs];
    (next[i] as any)[field] = value;
    setHerbs(next);
  };

  const removeHerb = (i: number) => setHerbs(herbs.filter((_, j) => j !== i));

  const generateProductCode = (name: string) => {
    const prefix = name.slice(0, 4).toUpperCase().replace(/\s/g, '');
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${rand}`;
  };

  // ── submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!productName.trim()) return toast.error('Product name is required');
    if (!dosage.trim()) return toast.error('Dosage is required');
    if (!selectedCollectionId) return toast.error('Please link a source batch');
    if (herbs.some((h) => !h.name.trim())) return toast.error('All herbs must have a name');
    if (totalPct !== 100) return toast.error(`Herb percentages must total 100% (currently ${totalPct}%)`);
    if (!mfgDate || !expDate) return toast.error('Both dates are required');
    if (expDate <= mfgDate) return toast.error('Expiry date must be after manufacture date');

    setSubmitting(true);
    try {
      // ── Step 1: Fetch the full trace chain from the selected collection ──
      // 1a. Collection details (full row)
      const { data: collection, error: colErr } = await supabase
        .from('collections')
        .select('*')
        .eq('id', selectedCollectionId)
        .single();

      if (colErr) {
        console.error('[ManufacturerFormulate] collection fetch error:', colErr);
        throw colErr;
      }
      console.log('[ManufacturerFormulate] selected collection:', collection);

      // 1b. Lab tests for this collection
      const { data: labTests } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('collection_id', selectedCollectionId);

      // 1c. Processing steps for this collection
      const { data: processingSteps } = await supabase
        .from('processing_steps')
        .select('*')
        .eq('collection_id', selectedCollectionId)
        .order('started_at', { ascending: true });

      // ── Step 2: Insert formulation ──
      const { data: formulation, error: fErr } = await supabase
        .from('formulations')
        .insert({
          product_name: productName.trim(),
          dosage: dosage.trim(),
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (fErr) throw fErr;

      // ── Step 3: Insert ingredients ──
      const { error: ingErr } = await supabase.from('formulation_ingredients').insert(
        herbs.map((h) => ({
          formulation_id: formulation.id,
          herb_name: h.name.trim(),
          percentage: Number(h.percentage),
        }))
      );
      if (ingErr) throw ingErr;

      // ── Step 4: Generate product code & insert product ──
      const productCode = generateProductCode(productName);
      const { data: product, error: pErr } = await supabase
        .from('products')
        .insert({
          formulation_id: formulation.id,
          product_code: productCode,
          mfg_date: mfgDate,
          exp_date: expDate,
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      // ── Step 5: Build full trace JSON ──
      const qrUrl = `${window.location.origin}/verify/${productCode}`;

      const traceData = {
        generated_at: new Date().toISOString(),
        product: {
          id: product.id,
          product_code: productCode,
          mfg_date: mfgDate,
          exp_date: expDate,
        },
        formulation: {
          id: formulation.id,
          product_name: productName.trim(),
          dosage: dosage.trim(),
          ingredients: herbs.map((h) => ({
            herb_name: h.name.trim(),
            percentage: h.percentage,
          })),
        },
        collection: collection
          ? {
              id: collection.id,
              // batch_id may be null if no DB trigger generates it
              batch_id: collection.batch_id || `COL-${collection.id.slice(0, 8).toUpperCase()}`,
              species: collection.species,
              quantity: collection.quantity,
              unit: collection.unit,
              collector_id: collection.collector_id,
              // column is 'date', not 'collected_at'
              collected_at: collection.date || collection.created_at,
              // column is 'location_name', not 'location'
              location: collection.location_name || `${collection.latitude ?? ''}, ${collection.longitude ?? ''}`.trim() || 'Unknown',
              quality: collection.quality,
            }
          : null,
        lab_tests: (labTests || []).map((t: any) => ({
          id: t.id,
          test_type: t.test_type,
          result: t.result,
          status: t.status,
          tested_at: t.created_at,
        })),
        processing_steps: (processingSteps || []).map((s: any) => ({
          id: s.id,
          stage: s.stage,
          temperature: s.temperature,
          humidity: s.humidity,
          facility_id: s.facility_id,
          status: s.status,
          started_at: s.started_at,
          ended_at: s.ended_at,
        })),
        journey: buildJourney(collection, labTests || [], processingSteps || [], {
          productName: productName.trim(),
          mfgDate,
        }),
      };

      // ── Step 6: Save QR record ──
      const { error: qrErr } = await supabase.from('qr_codes').insert({
        product_id: product.id,
        qr_url: qrUrl,
        qr_data: traceData,
      });
      if (qrErr) throw qrErr;

      // ── Step 7: Blockchain formulation record ─────────────────────────────────
      if (wallet.isConnected && wallet.isCorrectNetwork && hasManufRole) {
        try {
          const { formulationId, txHash } = await recordFormulation({
            productName: productName.trim(),
            dosage: dosage.trim(),
            herbNames: herbs.map((h) => h.name.trim()),
            percentages: herbs.map((h) => Math.round(Number(h.percentage))),
            ipfsHash: '',
          });
          setBcTxHash(txHash);
          // Persist the on-chain formulationId to Supabase
          await supabase.from('formulations').update({ blockchain_id: formulationId }).eq('id', formulation.id);
          toast.success(`Formulation on-chain! TX: ${txHash.slice(0, 10)}…`);
        } catch (bcErr: any) {
          toast.warning(`QR created but blockchain write failed: ${bcErr.message}`);
        }
      }

      setCreated({
        productCode,
        productName,
        dosage,
        mfgDate,
        expDate,
        ingredients: herbs,
      });
      toast.success(`Product "${productName}" created! Code: ${productCode}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  // ── build journey timeline for consumer verify page ───────
  function buildJourney(
    collection: any,
    labTests: any[],
    processingSteps: any[],
    product: { productName: string; mfgDate: string }
  ) {
    const steps = [];

    if (collection) {
      steps.push({
        title: 'Harvested',
        // Use 'date' column (actual column name in collections table)
        date: collection.collected_at?.split('T')[0] || '',
        location: collection.location_name ||
          (collection.latitude ? `${Number(collection.latitude).toFixed(4)}°, ${Number(collection.longitude).toFixed(4)}°` : 'Unknown location'),
        actor: 'Farmer',
        org: '',
        details: `${collection.species || 'Herb'} · ${collection.quantity} ${collection.unit || 'kg'} · Quality: ${collection.quality || 'N/A'}`,
        icon: 'leaf',
        verified: true,
      });
    }

    if (labTests.length > 0) {
      const passed = labTests.filter((t) => t.status === 'pass').length;
      steps.push({
        title: 'Lab Tested',
        date: labTests[0]?.created_at?.split('T')[0] || '',
        location: 'Laboratory',
        actor: 'Lab Technician',
        org: '',
        details: `${passed}/${labTests.length} tests passed · ${labTests.map((t) => t.test_type).join(', ')}`,
        icon: 'flask',
        verified: labTests.every((t) => t.status === 'pass'),
      });
    }

    if (processingSteps.length > 0) {
      const completed = processingSteps.filter((s) => s.status === 'completed');
      steps.push({
        title: 'Processed',
        date: processingSteps[0]?.started_at?.split('T')[0] || '',
        location: processingSteps[0]?.facility_id || 'Processing Facility',
        actor: 'Processor',
        org: '',
        details: processingSteps.map((s) => s.stage).join(' → '),
        icon: 'factory',
        verified: completed.length > 0,
      });
    }

    steps.push({
      title: 'Manufactured',
      date: product.mfgDate,
      location: 'Manufacturing Facility',
      actor: 'Manufacturer',
      org: '',
      details: product.productName,
      icon: 'package',
      verified: true,
    });

    return steps;
  }

  // ── success state ─────────────────────────────────────────
  if (created) {
    return (
      <div className="container max-w-lg py-12 text-center animate-fade-in">
        <div className="rounded-full bg-emerald-100 w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <Check className="h-10 w-10 text-emerald-600" />
        </div>
        {bcTxHash && (
          <div className="flex justify-center mb-3">
            <BlockchainBadge txHash={bcTxHash} status="confirmed" />
          </div>
        )}
        <h2 className="text-2xl font-bold">Formulation Created!</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Product registered and QR code generated with full traceability.
        </p>

        <Card className="text-left mb-6">
          <CardContent className="p-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product Name</span>
              <span className="font-semibold">{created.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product Code</span>
              <span className="font-mono font-semibold text-primary">{created.productCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dosage</span>
              <span>{created.dosage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mfg Date</span>
              <span>{created.mfgDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exp Date</span>
              <span>{created.expDate}</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-muted-foreground mb-1">Ingredients</p>
              <div className="flex flex-wrap gap-1">
                {created.ingredients.map((h, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {h.name} {h.percentage}%
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => {
              setCreated(null);
              setProductName('');
              setDosage('');
              setSelectedCollectionId('');
              setHerbs([{ name: '', percentage: 0 }]);
            }}
          >
            New Formulation
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/manufacturer/qr-codes')}>
            View QR Codes
          </Button>
        </div>
      </div>
    );
  }

  // ── form ──────────────────────────────────────────────────
  return (
    <div className="container max-w-xl py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-1">
        <div className="rounded-lg bg-amber-100 p-2">
          <FlaskConical className="h-5 w-5 text-amber-700" />
        </div>
        <h1 className="text-2xl font-bold">Formulation Builder</h1>
      </div>
      <p className="text-muted-foreground mb-5">
        Create a product formulation, link it to a source batch, and generate a full-traceability QR code.
      </p>

      {/* Blockchain role status */}
      {wallet.isConnected && hasManufRole === false && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Your wallet lacks <strong>MANUFACTURER_ROLE</strong>. Formulation will be saved to DB only.
        </div>
      )}
      {wallet.isConnected && hasManufRole === true && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          MANUFACTURER_ROLE active · Formulation will be recorded on-chain.
        </div>
      )}

      <div className="space-y-4">
        {/* Source Batch Linking */}
        <Card className="border-primary/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5">
                <Link2 className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold text-sm uppercase tracking-wide">
                Link Source Batch
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Select the herb collection batch this product is derived from.
              All existing lab tests and processing steps for that batch will be included in the QR trace data.
            </p>
            {collectionsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading batches…
              </div>
            ) : collections.length === 0 ? (
              <p className="text-sm text-destructive">
                No batches found. Farmers must submit collections first.
              </p>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="batch-select">Source Batch *</Label>
                <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                  <SelectTrigger id="batch-select">
                    <SelectValue placeholder="Select a batch…" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {/* batch_id may be null — fall back to short UUID */}
                        <span className="font-mono">
                          {col.batch_id || `COL-${col.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        {col.species && (
                          <span className="text-muted-foreground ml-2 text-xs">— {col.species}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCollectionId && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-success">
                    <Leaf className="h-3 w-3" />
                    {(() => {
                      const col = collections.find((c) => c.id === selectedCollectionId);
                      if (!col) return '';
                      const batchLabel = col.batch_id || `COL-${col.id.slice(0, 8).toUpperCase()}`;
                      return `${batchLabel} — ${col.species || ''} ${col.quantity ? `(${col.quantity} ${col.unit || 'kg'})` : ''}`;
                    })()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Product Details
            </h2>
            <div className="space-y-1">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                placeholder="e.g. AshwaVital Capsules"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                placeholder="e.g. 500mg x 60 capsules"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="mfg-date">Manufacture Date *</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mfg-date"
                    type="date"
                    className="pl-9"
                    value={mfgDate}
                    onChange={(e) => setMfgDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="exp-date">Expiry Date *</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="exp-date"
                    type="date"
                    className="pl-9"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Herb Composition */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Herb Composition
              </h2>
              <Badge
                variant={totalPct === 100 ? 'default' : 'destructive'}
                className={totalPct === 100 ? 'bg-success text-success-foreground' : ''}
              >
                Total: {totalPct}%
              </Badge>
            </div>

            <div className="space-y-2">
              {herbs.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={h.name}
                    onChange={(e) => updateHerb(i, 'name', e.target.value)}
                    placeholder="Herb name"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={h.percentage}
                    onChange={(e) => updateHerb(i, 'percentage', Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground w-4">%</span>
                  {herbs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => removeHerb(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setHerbs([...herbs, { name: '', percentage: 0 }])}
            >
              <Plus className="h-3 w-3" /> Add Herb
            </Button>

            {totalPct !== 100 && herbs.some((h) => h.name) && (
              <p className="text-xs text-destructive">
                Percentages must add up to 100%.{' '}
                {100 - totalPct > 0 ? `${100 - totalPct}% remaining.` : `${totalPct - 100}% over.`}
              </p>
            )}
          </CardContent>
        </Card>

        <Button
          className="w-full h-11 text-base gap-2"
          onClick={handleSubmit}
          disabled={submitting || collectionsLoading}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating Product & QR…
            </>
          ) : (
            <>
              <Package className="h-4 w-4" /> Create Formulation & Generate QR
              {wallet.isConnected && hasManufRole && (
                <span className="text-xs opacity-80">+ On-Chain</span>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
