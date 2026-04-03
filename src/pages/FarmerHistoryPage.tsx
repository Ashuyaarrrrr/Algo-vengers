import { DEMO_COLLECTIONS } from '@/lib/demo-data';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function FarmerHistoryPage() {
  const [search, setSearch] = useState('');
  const filtered = DEMO_COLLECTIONS.filter(c =>
    c.species.toLowerCase().includes(search.toLowerCase()) ||
    c.batchId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">Collection History</h1>
      <p className="text-muted-foreground mb-4">All your recorded harvests.</p>
      <Input placeholder="Search by species or batch ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm mb-4" />
      <div className="space-y-3">
        {filtered.map((col) => (
          <Card key={col.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{col.species.split('(')[0].trim()}</span>
                  <Badge variant="outline" className="text-xs font-mono-data">{col.batchId}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{col.quantity} {col.unit} · {col.date} · {col.weather}</p>
                <p className="text-xs font-mono-data text-muted-foreground">📍 {col.lat.toFixed(4)}, {col.lng.toFixed(4)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={col.quality === 'excellent' ? 'bg-success text-success-foreground' : ''}>{col.quality}</Badge>
                <BlockchainBadge txHash={col.txHash} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
