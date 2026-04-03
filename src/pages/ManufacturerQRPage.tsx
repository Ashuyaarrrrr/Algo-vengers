import { DEMO_PRODUCTS } from '@/lib/demo-data';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ManufacturerQRPage() {
  return (
    <div className="container py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">QR Code Management</h1>
      <p className="text-muted-foreground mb-6">Generate and manage product QR codes.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_PRODUCTS.map((prod) => (
          <Card key={prod.id}>
            <CardContent className="p-6 text-center">
              <div className="bg-card border rounded-lg inline-block p-4 mb-4">
                <QRCodeSVG value={`${window.location.origin}/verify/${prod.qrCode}`} size={160} />
              </div>
              <h3 className="font-semibold">{prod.name}</h3>
              <p className="text-xs font-mono-data text-muted-foreground mt-1">{prod.qrCode}</p>
              <Badge variant="outline" className="mt-2 text-xs">{prod.batchId}</Badge>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1"><Download className="h-3 w-3 mr-1" /> Download</Button>
                <Button variant="outline" size="sm" className="flex-1"><Printer className="h-3 w-3 mr-1" /> Print</Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed flex items-center justify-center min-h-[280px]">
          <CardContent className="text-center text-muted-foreground">
            <p className="text-sm">Generate new QR codes from the Formulation Builder</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
