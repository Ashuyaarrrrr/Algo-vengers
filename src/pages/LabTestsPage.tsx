import { DEMO_TESTS } from '@/lib/demo-data';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LabTestsPage() {
  return (
    <div className="container py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">All Tests</h1>
      <p className="text-muted-foreground mb-4">{DEMO_TESTS.length} tests recorded.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 font-medium">Batch</th>
              <th className="text-left py-2 font-medium">Test Type</th>
              <th className="text-left py-2 font-medium">Result</th>
              <th className="text-left py-2 font-medium">Date</th>
              <th className="text-left py-2 font-medium">Status</th>
              <th className="text-left py-2 font-medium">Chain</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_TESTS.map((test) => (
              <tr key={test.id} className="border-b last:border-0">
                <td className="py-2.5 font-mono-data text-xs">{test.batchId}</td>
                <td className="py-2.5">{test.testType}</td>
                <td className="py-2.5 text-muted-foreground text-xs">{test.result}</td>
                <td className="py-2.5 text-muted-foreground">{test.date}</td>
                <td className="py-2.5">
                  <Badge variant={test.status === 'pass' ? 'default' : test.status === 'fail' ? 'destructive' : 'secondary'}
                    className={test.status === 'pass' ? 'bg-success text-success-foreground' : ''}>
                    {test.status}
                  </Badge>
                </td>
                <td className="py-2.5"><BlockchainBadge txHash={test.txHash} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
