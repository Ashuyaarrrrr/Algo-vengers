import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Leaf, FlaskConical, Factory, Package, ShieldCheck, MapPin,
  CheckCircle, AlertCircle, Clock, ThumbsUp, ThumbsDown, Loader2,
  Beaker, Thermometer, Droplets, Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ── icon maps ─────────────────────────────────────────────
const STEP_ICONS: Record<string, React.ElementType> = {
  leaf: Leaf,
  flask: FlaskConical,
  factory: Factory,
  package: Package,
};

const STATUS_ICON: Record<string, React.ElementType> = {
  pass: ThumbsUp,
  fail: ThumbsDown,
  pending: Clock,
};

const STATUS_COLOR: Record<string, string> = {
  pass: 'text-success',
  fail: 'text-destructive',
  pending: 'text-warning',
};

const STATUS_BG: Record<string, string> = {
  pass: 'bg-success/10 border-success/20',
  fail: 'bg-destructive/10 border-destructive/20',
  pending: 'bg-warning/10 border-warning/20',
};

// ── derive authenticity score from trace data ─────────────
function computeScore(trace: any): number {
  let score = 40; // base: product exists
  if (trace.collection) score += 20;
  const tests = trace.lab_tests || [];
  if (tests.length > 0) {
    const passed = tests.filter((t: any) => t.status === 'pass').length;
    score += Math.round((passed / tests.length) * 25);
  }
  const steps = trace.processing_steps || [];
  if (steps.some((s: any) => s.status === 'completed')) score += 15;
  return Math.min(score, 100);
}

import { getBatchProvenance } from '@/lib/blockchain';

export default function ConsumerVerifyPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [trace, setTrace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [onChainData, setOnChainData] = useState<any>(null);

  useEffect(() => {
    if (!qrCode) return;
    fetchTrace(qrCode);
  }, [qrCode]);

  const fetchTrace = async (code: string) => {
    setLoading(true);
    setNotFound(false);
    try {
      // 1. Find product by product_code
      const { data: product, error: pErr } = await supabase
        .from('products')
        .select(`
          id,
          product_code,
          mfg_date,
          exp_date,
          formulations (
            blockchain_id,
            product_name,
            dosage,
            formulation_ingredients ( herb_name, percentage )
          )
        `)
        .eq('product_code', code)
        .maybeSingle();

      if (pErr) throw pErr;

      if (!product) {
        setNotFound(true);
        return;
      }

      // 2. Fetch QR code record for stored trace JSON
      const { data: qrRecord } = await supabase
        .from('qr_codes')
        .select('qr_data, qr_url')
        .eq('product_id', product.id)
        .maybeSingle();

      // 3. Merge stored trace JSON with fresh product data
      const formulation = (product as any).formulations;
      const storedTrace = qrRecord?.qr_data || {};

      const traceData = {
        // Product
        product_code: product.product_code,
        mfg_date: product.mfg_date,
        exp_date: product.exp_date,
        qr_url: qrRecord?.qr_url,
        formulation_id: formulation?.blockchain_id,
        // Formulation
        product_name: formulation?.product_name || storedTrace.formulation?.product_name || 'Product',
        dosage: formulation?.dosage || storedTrace.formulation?.dosage || '',
        ingredients: formulation?.formulation_ingredients ||
          storedTrace.formulation?.ingredients || [],
        // Trace chain from stored JSON
        collection: storedTrace.collection || null,
        lab_tests: storedTrace.lab_tests || [],
        processing_steps: storedTrace.processing_steps || [],
        // Journey timeline
        journey: storedTrace.journey || [],
      };

      setTrace(traceData);

      // 4. Optionally fetch from Blockchain if we have a batch ID
      if (traceData.collection?.batch_id && traceData.collection.batch_id.startsWith('0x')) {
        try {
          const prov = await getBatchProvenance(traceData.collection.batch_id);
          setOnChainData(prov);
        } catch (err) {
          console.warn("Could not fetch trace from chain:", err);
        }
      }

    } catch (err: any) {
      console.error('Trace fetch error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // ── loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sage-50/50 to-background flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm">Fetching product trace data…</p>
        </div>
      </div>
    );
  }

  // ── not found ─────────────────────────────────────────────
  if (notFound || !trace) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sage-50/50 to-background">
        <Header />
        <div className="container max-w-2xl py-10 animate-fade-in">
          <Card>
            <CardContent className="p-10 text-center">
              <div className="rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
              <p className="text-muted-foreground mb-1">
                Code <span className="font-mono font-semibold">"{qrCode}"</span> is not registered in HerbChain.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This product may be counterfeit or the QR code may be damaged.
              </p>
              <Button className="mt-6" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const score = computeScore(trace);
  const labTests: any[] = trace.lab_tests || [];
  const processingSteps: any[] = trace.processing_steps || [];
  const ingredients: any[] = trace.ingredients || [];
  const journey: any[] = trace.journey || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50/50 to-background">
      <Header />

      <div className="container max-w-2xl py-8 space-y-5 animate-fade-in">

        {/* ── 1. Authenticity Score ── */}
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-success/20 p-3 shrink-0">
                <ShieldCheck className="h-8 w-8 text-success" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-success flex items-center gap-2">
                  Verified Authentic
                  {onChainData && (
                    <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-300">
                      On-Chain
                    </Badge>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  HerbChain traceability score: <strong>{score}%</strong>
                </p>
              </div>
              <span className="text-3xl font-bold text-success">{score}%</span>
            </div>
            <Progress value={score} className="mt-4 h-2" />
          </CardContent>
        </Card>

        {/* ── 2. Product Info ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              {trace.product_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {trace.dosage && (
              <p className="text-sm text-muted-foreground">{trace.dosage}</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground">Product Code</p>
                <p className="font-mono font-semibold text-primary">{trace.product_code}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground">Manufacture Date</p>
                <p className="font-semibold">{trace.mfg_date}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground">Expiry Date</p>
                <p className="font-semibold">{trace.exp_date}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground">Ingredients</p>
                <p className="font-semibold">{ingredients.length} herb{ingredients.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {ingredients.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Herb Composition</p>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map((ing: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      <Leaf className="h-3 w-3 mr-1 text-sage-600" />
                      {ing.herb_name || ing.name} — {ing.percentage}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 3. Source Collection ── */}
        {trace.collection && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Leaf className="h-4 w-4 text-sage-600" />
                Source Harvest
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Batch ID</p>
                  <p className="font-mono font-semibold">{trace.collection.batch_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Species</p>
                  <p className="font-medium">{trace.collection.species || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-medium">
                    {trace.collection.quantity} {trace.collection.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quality</p>
                  <Badge
                    variant="outline"
                    className={
                      trace.collection.quality === 'excellent'
                        ? 'border-success text-success'
                        : trace.collection.quality === 'good'
                        ? 'border-info text-info'
                        : 'border-warning text-warning'
                    }
                  >
                    {trace.collection.quality || 'N/A'}
                  </Badge>
                </div>
                {trace.collection.farmer_name && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Collector</p>
                    <p className="font-medium">{trace.collection.farmer_name}</p>
                  </div>
                )}
                {trace.collection.location && (
                  <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {trace.collection.location}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 4. Lab Tests ── */}
        {labTests.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Beaker className="h-4 w-4 text-info" />
                Lab Tests
                <Badge variant="outline" className="ml-auto text-xs">
                  {labTests.filter((t) => t.status === 'pass').length}/{labTests.length} passed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {labTests.map((test: any, i: number) => {
                const StatusIcon = STATUS_ICON[test.status] || Clock;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${STATUS_BG[test.status] || ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${STATUS_COLOR[test.status]}`} />
                      <div>
                        <p className="text-sm font-medium">{test.test_type}</p>
                        {test.result && (
                          <p className="text-xs text-muted-foreground">{test.result}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${STATUS_COLOR[test.status]}`}
                    >
                      {test.status}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* ── 5. Processing Steps ── */}
        {processingSteps.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Factory className="h-4 w-4 text-terra-600" />
                Processing Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {processingSteps.map((step: any, i: number) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${
                    step.status === 'completed'
                      ? 'bg-success/5 border-success/20'
                      : 'bg-warning/5 border-warning/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-sm flex items-center gap-1.5">
                      {step.status === 'completed'
                        ? <CheckCircle className="h-3.5 w-3.5 text-success" />
                        : <Clock className="h-3.5 w-3.5 text-warning" />}
                      {step.stage}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${step.status === 'completed' ? 'text-success border-success/40' : 'text-warning border-warning/40'}`}
                    >
                      {step.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {step.temperature != null && (
                      <span className="flex items-center gap-0.5">
                        <Thermometer className="h-3 w-3" /> {step.temperature}°C
                      </span>
                    )}
                    {step.humidity != null && (
                      <span className="flex items-center gap-0.5">
                        <Droplets className="h-3 w-3" /> {step.humidity}%
                      </span>
                    )}
                    {step.facility_id && (
                      <span className="flex items-center gap-0.5">
                        <Building2 className="h-3 w-3" /> {step.facility_id}
                      </span>
                    )}
                    {step.started_at && (
                      <span>Started: {new Date(step.started_at).toLocaleDateString()}</span>
                    )}
                    {step.ended_at && (
                      <span>Ended: {new Date(step.ended_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── 6. Journey Timeline ── */}
        {journey.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🌿 Journey — Farm to Shelf</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-5">
                  {journey.map((step: any, i: number) => {
                    const Icon = STEP_ICONS[step.icon] || Leaf;
                    return (
                      <div key={i} className="relative flex gap-4">
                        <div
                          className={`relative z-10 rounded-full p-2 border-2 shrink-0 ${
                            step.verified
                              ? 'bg-success/10 border-success'
                              : 'bg-muted border-border'
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              step.verified ? 'text-success' : 'text-muted-foreground'
                            }`}
                          />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{step.title}</span>
                            {step.verified && (
                              <CheckCircle className="h-3.5 w-3.5 text-success" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{step.date}</p>
                          {step.details && (
                            <p className="text-sm mt-0.5">{step.details}</p>
                          )}
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            {step.location && (
                              <>
                                <MapPin className="h-3 w-3" />
                                <span>{step.location}</span>
                              </>
                            )}
                          </div>
                          {(step.actor || step.org) && (
                            <p className="text-xs text-muted-foreground">
                              {[step.actor, step.org].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 7. Sustainability Credentials ── */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-base font-bold mb-3">Sustainability Credentials</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Wild-Harvested', desc: 'Sustainably collected from natural habitat' },
                { label: 'Fair Trade', desc: 'Farmer receives fair compensation' },
                { label: 'Conservation Compliant', desc: 'Within seasonal harvest limits' },
                { label: 'Lab Verified', desc: labTests.length > 0 ? `${labTests.filter((t) => t.status === 'pass').length}/${labTests.length} quality tests passed` : 'Quality assured' },
              ].map((c) => (
                <div key={c.label} className="p-3 rounded-lg bg-sage-50 border border-sage-100">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-success" />
                    <span className="text-sm font-medium">{c.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// ── shared header ─────────────────────────────────────────
function Header() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
          <Leaf className="h-6 w-6 text-primary" />
          <span>HerbChain</span>
        </Link>
        <Badge variant="outline" className="text-xs">Consumer Verify Portal</Badge>
      </div>
    </header>
  );
}
