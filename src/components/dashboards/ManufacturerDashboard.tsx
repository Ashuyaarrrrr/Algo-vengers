import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';
import { StatCard } from '@/components/StatCard';
import {
  Package, QrCode, FlaskConical, AlertTriangle,
  Loader2, RefreshCw, ExternalLink, CalendarIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// ── types ─────────────────────────────────────────────────
interface Ingredient {
  herb_name: string;
  percentage: number;
}

interface Formulation {
  id: string;
  product_name: string;
  dosage: string;
  formulation_ingredients: Ingredient[];
}

interface QRRecord {
  qr_url: string;
}

interface Product {
  id: string;
  product_code: string;
  mfg_date: string;
  exp_date: string;
  created_at: string;
  formulations: Formulation | null;
  qr_codes: QRRecord[];
}

interface Stats {
  products: number;
  formulations: number;
  qrCodes: number;
}

export default function ManufacturerDashboard() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ products: 0, formulations: 0, qrCodes: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── fetch all product data with joins ─────────────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch products with nested formulations, ingredients, and QR codes
      const { data: productData, error: productErr } = await supabase
        .from('products')
        .select(`
          id,
          product_code,
          mfg_date,
          exp_date,
          created_at,
          formulations (
            id,
            product_name,
            dosage,
            formulation_ingredients ( herb_name, percentage )
          ),
          qr_codes ( qr_url )
        `)
        .order('created_at', { ascending: false });

      if (productErr) throw productErr;

      const rows = (productData || []) as unknown as Product[];
      setProducts(rows);

      // Fetch counts for stat cards in parallel
      const [
        { count: productCount },
        { count: formulationCount },
        { count: qrCount },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('formulations').select('*', { count: 'exact', head: true }),
        supabase.from('qr_codes').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        products: productCount ?? rows.length,
        formulations: formulationCount ?? 0,
        qrCodes: qrCount ?? 0,
      });
    } catch (err: any) {
      console.error('[ManufacturerDashboard] fetch error:', err);
      toast.error('Failed to load dashboard: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── initial load ─────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── real-time subscription on products table ──────────────
  useEffect(() => {
    const channel = supabase
      .channel('manufacturer-dashboard-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('[ManufacturerDashboard] realtime event:', payload.eventType);
          // Re-fetch on any insert/update/delete to keep data fresh
          fetchData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // ── helpers ───────────────────────────────────────────────
  const isExpired = (expDate: string) => new Date(expDate) < new Date();
  const isExpiringSoon = (expDate: string) => {
    const diff = new Date(expDate).getTime() - Date.now();
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000; // within 90 days
  };

  // ── render ─────────────────────────────────────────────────
  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manufacturer Console</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {user?.email ?? 'Manufacturer'} · Live product traceability overview
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="gap-1.5"
        >
          {refreshing
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Products"
          value={loading ? '…' : stats.products}
          icon={Package}
          trend={stats.products > 0 ? `${stats.products} registered` : undefined}
        />
        <StatCard
          label="QR Codes"
          value={loading ? '…' : stats.qrCodes}
          icon={QrCode}
          trend={stats.qrCodes > 0 ? 'All scannable' : undefined}
        />
        <StatCard
          label="Formulations"
          value={loading ? '…' : stats.formulations}
          icon={FlaskConical}
        />
        <StatCard
          label="Recalls"
          value="0"
          icon={AlertTriangle}
        />
      </div>

      {/* ── Products List ── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Products</CardTitle>
          <Link to="/manufacturer/formulate">
            <Button size="sm" className="gap-1.5">
              <Package className="h-3.5 w-3.5" /> New Product
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-sm">Loading products…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-25" />
              <p className="font-medium">No products yet</p>
              <p className="text-sm mt-1">Create your first formulation to get started.</p>
              <Link to="/manufacturer/formulate">
                <Button variant="outline" size="sm" className="mt-4">
                  Open Formulation Builder
                </Button>
              </Link>
            </div>
          ) : (
            products.map((prod) => {
              const form = prod.formulations;
              const qrUrl = prod.qr_codes?.[0]?.qr_url;
              const ingredients = form?.formulation_ingredients ?? [];
              const expired = isExpired(prod.exp_date);
              const expiringSoon = !expired && isExpiringSoon(prod.exp_date);

              return (
                <div
                  key={prod.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border bg-muted/20 transition-colors hover:bg-muted/40 ${
                    expired ? 'border-destructive/30' : expiringSoon ? 'border-warning/40' : ''
                  }`}
                >
                  {/* QR Code Preview */}
                  <div className="rounded-lg bg-white border p-2 shadow-sm shrink-0">
                    {qrUrl ? (
                      <QRCodeSVG value={qrUrl} size={80} level="H" />
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center bg-muted rounded opacity-40">
                        <QrCode className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name + code + status */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold truncate">
                        {form?.product_name ?? 'Unnamed Product'}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono shrink-0">
                        {prod.product_code}
                      </Badge>
                      {expired && (
                        <Badge variant="destructive" className="text-xs shrink-0">Expired</Badge>
                      )}
                      {expiringSoon && (
                        <Badge variant="secondary" className="text-xs bg-warning/20 text-warning-foreground shrink-0">
                          Expiring Soon
                        </Badge>
                      )}
                      {!expired && !expiringSoon && (
                        <Badge variant="secondary" className="text-xs bg-success/15 text-success shrink-0">
                          Active
                        </Badge>
                      )}
                    </div>

                    {/* Dosage */}
                    {form?.dosage && (
                      <p className="text-sm text-muted-foreground">{form.dosage}</p>
                    )}

                    {/* Ingredient badges */}
                    {ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ingredients.map((ing, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {ing.herb_name} {ing.percentage}%
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex flex-wrap gap-x-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        Mfg: {prod.mfg_date}
                      </span>
                      <span className={`flex items-center gap-1 ${expired ? 'text-destructive' : expiringSoon ? 'text-warning' : ''}`}>
                        <CalendarIcon className="h-3 w-3" />
                        Exp: {prod.exp_date}
                      </span>
                    </div>
                  </div>

                  {/* QR link */}
                  {qrUrl && (
                    <div className="shrink-0 self-center">
                      <Link to="/manufacturer/qr-codes">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <ExternalLink className="h-3 w-3" />
                          QR
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/manufacturer/formulate">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-lg bg-amber-100 p-3">
                <FlaskConical className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="font-semibold text-sm">Formulation Builder</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create new products &amp; generate QR codes
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/manufacturer/qr-codes">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">QR Code Management</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download &amp; print all product QR codes
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
