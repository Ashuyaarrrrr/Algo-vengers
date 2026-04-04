import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/StatCard';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { FlaskConical, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LabDashboard() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const { data, error } = await supabase
          .from('lab_tests')
          .select(`
            *,
            collections (
              batch_id
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10); // Show recent tests on dashboard

        if (error) {
          throw error;
        }

        setTests(data || []);
      } catch (error) {
        console.error('Error fetching lab tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const passed = tests.filter(t => t.status === 'pass').length;
  const pending = tests.filter(t => t.status === 'pending').length;
  const total = tests.length;
  const passRate = total - pending > 0 ? Math.round((passed / (total - pending)) * 100) : 0;

  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Laboratory Dashboard</h1>
        <p className="text-muted-foreground">AyurTest Labs · Dr. Priya Nair</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Recent Tests" value={total} icon={FlaskConical} />
        <StatCard label="Passed" value={passed} icon={CheckCircle} />
        <StatCard label="Pending" value={pending} icon={Clock} />
        <StatCard label="Pass Rate" value={`${passRate}%`} icon={FlaskConical} trend="Above threshold" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Tests</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
          ) : (
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
                  {tests.map((test) => (
                    <tr key={test.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 font-mono-data text-xs">
                        {test.collections?.batch_id || 'Unknown Batch'}
                      </td>
                      <td className="py-2.5">{test.test_type}</td>
                      <td className="py-2.5 text-muted-foreground">{test.result}</td>
                      <td className="py-2.5">
                        <Badge variant={test.status === 'pass' ? 'default' : test.status === 'fail' ? 'destructive' : 'secondary'}
                          className={`capitalize ${test.status === 'pass' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : test.status === 'fail' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white border-0 outline-none'}`}>
                          {test.status}
                        </Badge>
                      </td>
                      <td className="py-2.5"><BlockchainBadge txHash={test.tx_hash} /></td>
                    </tr>
                  ))}
                  {tests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-muted-foreground">No tests recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
