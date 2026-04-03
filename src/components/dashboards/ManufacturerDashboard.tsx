import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { StatCard } from '@/components/StatCard';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Package, QrCode, FlaskConical, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';

export default function ManufacturerDashboard() {
  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Manufacturer Console</h1>
        <p className="text-muted-foreground">Vedic Wellness Pvt. Ltd. · Lakshmi Devi</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Products" value={DEMO_PRODUCTS.length} icon={Package} />
        <StatCard label="QR Codes" value="120" icon={QrCode} trend="+30 this week" />
        <StatCard label="Formulations" value="3" icon={FlaskConical} />
        <StatCard label="Recalls" value="0" icon={AlertTriangle} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Products</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {DEMO_PRODUCTS.map((prod) => (
            <div key={prod.id} className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="rounded-lg bg-card border p-2">
                <QRCodeSVG value={`${window.location.origin}/verify/${prod.qrCode}`} size={80} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{prod.name}</span>
                  <Badge variant="outline" className="text-xs font-mono-data">{prod.batchId}</Badge>
                  <BlockchainBadge txHash={prod.txHash} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{prod.dosage}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {prod.herbs.map((h) => (
                    <Badge key={h.name} variant="secondary" className="text-xs">{h.name} {h.ratio}%</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Mfg: {prod.mfgDate} · Exp: {prod.expDate}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
