import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function LabTestsPage() {
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
          .order('created_at', { ascending: false });

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

  return (
    <div className="container py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">All Tests</h1>
      <p className="text-muted-foreground mb-4">{tests.length} tests recorded.</p>
      
      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground bg-muted/20">
                    <th className="text-left py-3 px-4 font-medium">Batch</th>
                    <th className="text-left py-3 px-4 font-medium">Test Type</th>
                    <th className="text-left py-3 px-4 font-medium">Result</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr key={test.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 font-mono-data text-xs">
                        {test.collections?.batch_id || 'Unknown Batch'}
                      </td>
                      <td className="py-3 px-4 font-medium">{test.test_type}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{test.result}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(test.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <Badge variant={test.status === 'pass' ? 'default' : test.status === 'fail' ? 'destructive' : 'secondary'}
                          className={`capitalize ${test.status === 'pass' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : test.status === 'fail' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white border-0 outline-none'}`}>
                          {test.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4"><BlockchainBadge txHash={test.tx_hash} /></td>
                    </tr>
                  ))}
                  {tests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted-foreground">No tests recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
