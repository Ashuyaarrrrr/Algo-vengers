import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download, Printer, Loader2, QrCode, Package, RefreshCw,
  CalendarIcon, FlaskConical, Check
} from 'lucide-react';
import { toast } from 'sonner';

interface QRRecord {
  id: string;
  qr_url: string;
  qr_data: any;
  created_at: string;
  products: {
    id: string;
    product_code: string;
    mfg_date: string;
    exp_date: string;
    formulations: {
      product_name: string;
      dosage: string;
      formulation_ingredients: { herb_name: string; percentage: number }[];
    } | null;
  } | null;
}

export default function ManufacturerQRPage() {
  const [qrRecords, setQrRecords] = useState<QRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQRCodes = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          id,
          qr_url,
          qr_data,
          created_at,
          products (
            id,
            product_code,
            mfg_date,
            exp_date,
            formulations (
              id,
              product_name,
              dosage,
              formulation_ingredients ( herb_name, percentage, quantity )
            )
          )
        `)
        .order('created_at', { ascending: false });

      console.log('[ManufacturerQR] qr_codes fetch:', { data, error });
      if (error) throw error;
      setQrRecords((data as any) || []);
    } catch (err: any) {
      toast.error('Failed to load QR codes: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQRCodes();
  }, []);

  // ── download QR as PNG ────────────────────────────────────
  const downloadQR = (productCode: string) => {
    const canvas = document.getElementById(`qr-canvas-${productCode}`) as HTMLCanvasElement;
    if (!canvas) return toast.error('QR canvas not found');
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `HerbChain-QR-${productCode}.png`;
    a.click();
    toast.success('QR code downloaded!');
  };

  // ── print QR ──────────────────────────────────────────────
  const printQR = (record: QRRecord) => {
    const productCode = record.products?.product_code || '';
    const productName = record.products?.formulations?.product_name || '';
    const dosage = record.products?.formulations?.dosage || '';
    const mfgDate = record.products?.mfg_date || '';
    const expDate = record.products?.exp_date || '';

    const canvas = document.getElementById(`qr-canvas-${productCode}`) as HTMLCanvasElement;
    const qrDataUrl = canvas?.toDataURL('image/png') || '';

    const win = window.open('', '_blank');
    if (!win) return toast.error('Popup blocked — please allow popups');

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR – ${productCode}</title>
          <style>
            body { font-family: sans-serif; display:flex; flex-direction:column; align-items:center; padding:32px; }
            img  { width:220px; height:220px; margin-bottom:16px; }
            h2   { font-size:18px; margin:4px 0; }
            p    { font-size:12px; color:#555; margin:2px 0; }
            code { font-size:11px; font-family:monospace; background:#f1f1f1; padding:2px 6px; border-radius:4px; }
          </style>
        </head>
        <body>
          <img src="${qrDataUrl}" />
          <h2>${productName}</h2>
          <p>${dosage}</p>
          <code>${productCode}</code>
          <p style="margin-top:8px">Mfg: ${mfgDate} &nbsp;|&nbsp; Exp: ${expDate}</p>
          <p style="font-size:10px;color:#999;margin-top:16px">Scan to verify authenticity · HerbChain</p>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // ── render ────────────────────────────────────────────────
  return (
    <div className="container py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2">
            <QrCode className="h-5 w-5 text-amber-700" />
          </div>
          <h1 className="text-2xl font-bold">QR Code Management</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchQRCodes(true)}
          disabled={refreshing}
          className="gap-1"
        >
          {refreshing
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <RefreshCw className="h-3 w-3" />}
          Refresh
        </Button>
      </div>
      <p className="text-muted-foreground mb-6">
        {qrRecords.length} product QR code{qrRecords.length !== 1 ? 's' : ''} generated.
        Scan to verify full traceability.
      </p>

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading QR codes…</p>
        </div>
      ) : qrRecords.length === 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-dashed flex items-center justify-center min-h-[300px]">
            <CardContent className="text-center text-muted-foreground p-6">
              <QrCode className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No QR codes yet</p>
              <p className="text-xs mt-1">
                Create a product from the Formulation Builder to generate your first QR code.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => (window.location.href = '/manufacturer/formulate')}
              >
                <Package className="h-3 w-3 mr-1" /> Go to Formulation Builder
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrRecords.map((record) => {
            const prod = record.products;
            const form = prod?.formulations;
            const code = prod?.product_code || '';
            const name = form?.product_name || 'Unknown Product';
            const dosage = form?.dosage || '';
            // Prefer live DB ingredients; fall back to stored qr_data JSON
            const dbIngredients = form?.formulation_ingredients || [];
            const jsonIngredients = record.qr_data?.formulation?.ingredients || [];
            const ingredients = dbIngredients.length > 0 ? dbIngredients : jsonIngredients;

            console.log(`[ManufacturerQR] ${code} — DB ings: ${dbIngredients.length}, JSON ings: ${jsonIngredients.length}, final: ${ingredients.length}`);

            return (
              <Card
                key={record.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-0 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight truncate">{name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{dosage}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Check className="h-3 w-3 mr-1 text-success" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 pt-3">
                  {/* QR Code — hidden canvas for download + visible SVG */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="bg-white border rounded-xl p-3 shadow-sm">
                      <QRCodeSVG
                        value={record.qr_url}
                        size={160}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    {/* Hidden canvas for download */}
                    <div className="hidden">
                      <QRCodeCanvas
                        id={`qr-canvas-${code}`}
                        value={record.qr_url}
                        size={400}
                        level="H"
                      />
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground mt-2 text-center break-all">
                      {record.qr_url}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="space-y-1.5 text-xs border-t pt-3 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Package className="h-3 w-3" /> Code
                      </span>
                      <span className="font-mono font-medium">{code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> Mfg / Exp
                      </span>
                      <span>{prod?.mfg_date} – {prod?.exp_date}</span>
                    </div>
                    {ingredients.length > 0 && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                          <FlaskConical className="h-3 w-3" /> Herbs
                        </span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {ingredients.map((ing, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {ing.herb_name} {ing.percentage}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => downloadQR(code)}
                    >
                      <Download className="h-3 w-3" /> Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => printQR(record)}
                    >
                      <Printer className="h-3 w-3" /> Print
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add more CTA */}
          <Card className="border-dashed flex items-center justify-center min-h-[300px] hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => (window.location.href = '/manufacturer/formulate')}
          >
            <CardContent className="text-center text-muted-foreground p-6">
              <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Package className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Create New Product</p>
              <p className="text-xs mt-1">Go to Formulation Builder</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
