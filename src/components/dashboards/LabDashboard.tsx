import { DEMO_TESTS } from '@/lib/demo-data';
import { StatCard } from '@/components/StatCard';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { FlaskConical, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LabDashboard() {
  const passed = DEMO_TESTS.filter(t => t.status === 'pass').length;
  const pending = DEMO_TESTS.filter(t => t.status === 'pending').length;

  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Laboratory Dashboard</h1>
        <p className="text-muted-foreground">AyurTest Labs · Dr. Priya Nair</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tests" value={DEMO_TESTS.length} icon={FlaskConical} />
        <StatCard label="Passed" value={passed} icon={CheckCircle} />
        <StatCard label="Pending" value={pending} icon={Clock} />
        <StatCard label="Pass Rate" value={`${Math.round((passed / (DEMO_TESTS.length - pending)) * 100)}%`} icon={FlaskConical} trend="Above threshold" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">All Tests</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Batch</th>
                  <th className="text-left py-2 font-medium">Test Type</th>
                  <th className="text-left py-2 font-medium">Result</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Chain</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_TESTS.map((test) => (
                  <tr key={test.id} className="border-b last:border-0">
                    <td className="py-2.5 font-mono-data text-xs">{test.batchId}</td>
                    <td className="py-2.5">{test.testType}</td>
                    <td className="py-2.5 text-muted-foreground">{test.result}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}
