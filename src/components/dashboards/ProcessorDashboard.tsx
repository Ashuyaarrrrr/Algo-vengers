import { DEMO_PROCESSING } from '@/lib/demo-data';
import { StatCard } from '@/components/StatCard';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Factory, Thermometer, Droplets, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ProcessorDashboard() {
  const active = DEMO_PROCESSING.filter(p => p.status === 'in-progress').length;
  const completed = DEMO_PROCESSING.filter(p => p.status === 'completed').length;

  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Processor Dashboard</h1>
        <p className="text-muted-foreground">HerbCraft Processing · Anand Menon</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Batches" value={active} icon={Factory} />
        <StatCard label="Completed" value={completed} icon={CheckCircle} />
        <StatCard label="Avg Temp" value="44°C" icon={Thermometer} />
        <StatCard label="Avg Humidity" value="27%" icon={Droplets} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Processing Steps</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {DEMO_PROCESSING.map((step) => (
            <div key={step.id} className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium">{step.stage}</span>
                  <span className="text-xs text-muted-foreground ml-2">· {step.batchId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={step.status === 'completed' ? 'default' : 'secondary'}
                    className={step.status === 'completed' ? 'bg-success text-success-foreground' : ''}>
                    {step.status}
                  </Badge>
                  <BlockchainBadge txHash={step.txHash} />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Started: {step.startDate}</span>
                {step.endDate && <span>Ended: {step.endDate}</span>}
                {step.temperature && <span>🌡 {step.temperature}°C</span>}
                {step.humidity && <span>💧 {step.humidity}%</span>}
                <span className="font-mono-data">{step.facilityId}</span>
              </div>
              <Progress value={step.status === 'completed' ? 100 : 60} className="mt-2 h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
