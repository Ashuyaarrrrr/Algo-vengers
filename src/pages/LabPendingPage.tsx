import { DEMO_TESTS } from '@/lib/demo-data';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export default function LabPendingPage() {
  const pending = DEMO_TESTS.filter(t => t.status === 'pending');

  return (
    <div className="container py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">Pending Tests</h1>
      <p className="text-muted-foreground mb-4">{pending.length} tests awaiting results.</p>
      {pending.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No pending tests 🎉</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {pending.map((test) => (
            <Card key={test.id} className="border-warning/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="font-medium">{test.testType}</span>
                    <Badge variant="outline" className="text-xs font-mono-data">{test.batchId}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Submitted: {test.date}</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
