import { DEMO_PROCESSING } from '@/lib/demo-data';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ProcessorBatchesPage() {
  return (
    <div className="container py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">Batch Tracking</h1>
      <p className="text-muted-foreground mb-4">{DEMO_PROCESSING.length} processing steps.</p>
      <div className="space-y-3">
        {DEMO_PROCESSING.map((step) => (
          <Card key={step.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{step.stage}</span>
                  <Badge variant="outline" className="text-xs font-mono-data">{step.batchId}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={step.status === 'completed' ? 'default' : 'secondary'}
                    className={step.status === 'completed' ? 'bg-success text-success-foreground' : ''}>
                    {step.status}
                  </Badge>
                  <BlockchainBadge txHash={step.txHash} />
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{step.startDate}{step.endDate ? ` → ${step.endDate}` : ''}</span>
                {step.temperature && <span>🌡 {step.temperature}°C</span>}
                {step.humidity && <span>💧 {step.humidity}%</span>}
                <span className="font-mono-data">{step.facilityId}</span>
              </div>
              <Progress value={step.status === 'completed' ? 100 : 60} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
