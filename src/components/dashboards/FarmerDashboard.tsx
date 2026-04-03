import { DEMO_COLLECTIONS } from '@/lib/demo-data';
import { StatCard } from '@/components/StatCard';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Leaf, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FarmerDashboard() {
  const totalKg = DEMO_COLLECTIONS.reduce((s, c) => s + c.quantity, 0);
  const synced = DEMO_COLLECTIONS.filter((c) => c.status === 'synced').length;

  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Farmer Dashboard</h1>
        <p className="text-muted-foreground">Kerala Ashwagandha Growers Collective</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Harvested" value={`${totalKg} kg`} icon={Leaf} trend="+12% this month" />
        <StatCard label="Collections" value={DEMO_COLLECTIONS.length} icon={MapPin} />
        <StatCard label="Synced" value={`${synced}/${DEMO_COLLECTIONS.length}`} icon={TrendingUp} />
        <StatCard label="Alerts" value="1" icon={AlertTriangle} className="border-warning/30" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEMO_COLLECTIONS.map((col) => (
              <div key={col.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{col.species.split('(')[0].trim()}</span>
                    <Badge variant="outline" className="text-xs">{col.batchId}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {col.quantity} {col.unit} · {col.date} · {col.weather}, {col.temperature}°C
                  </p>
                  <p className="text-xs font-mono-data text-muted-foreground">
                    📍 {col.lat.toFixed(4)}, {col.lng.toFixed(4)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={col.quality === 'excellent' ? 'default' : 'secondary'} className={col.quality === 'excellent' ? 'bg-success text-success-foreground' : ''}>
                    {col.quality}
                  </Badge>
                  <BlockchainBadge txHash={col.txHash} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Sustainability Alert</p>
            <p className="text-sm text-muted-foreground">
              Ashwagandha harvest in Thrissur district is at 78% of seasonal limit.
              Remaining quota: ~14 kg for this quarter.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
