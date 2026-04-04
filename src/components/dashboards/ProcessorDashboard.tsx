import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/StatCard';
import { Factory, Thermometer, Droplets, CheckCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function ProcessorDashboard() {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('processing_steps')
        .select(`
          *,
          collections ( batch_id )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSteps(data || []);
    } catch (err: any) {
      toast.error('Failed to load processing steps');
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (id: string) => {
    setMarkingId(id);
    try {
      const { error } = await supabase
        .from('processing_steps')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Step marked as completed');
      await fetchSteps();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update step');
    } finally {
      setMarkingId(null);
    }
  };

  // Derived stats
  const active = steps.filter(s => s.status === 'in-progress').length;
  const completed = steps.filter(s => s.status === 'completed').length;
  const temps = steps.map(s => s.temperature).filter(t => t != null) as number[];
  const humids = steps.map(s => s.humidity).filter(h => h != null) as number[];
  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '—';
  const avgHumidity = humids.length ? (humids.reduce((a, b) => a + b, 0) / humids.length).toFixed(1) : '—';

  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Processor Dashboard</h1>
        <p className="text-muted-foreground">Live batch processing overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Batches" value={loading ? '…' : active} icon={Factory} />
        <StatCard label="Completed" value={loading ? '…' : completed} icon={CheckCircle} />
        <StatCard label="Avg Temp" value={loading ? '…' : `${avgTemp}°C`} icon={Thermometer} />
        <StatCard label="Avg Humidity" value={loading ? '…' : `${avgHumidity}%`} icon={Droplets} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Processing Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : steps.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No processing steps yet. Create one via "New Step".
            </p>
          ) : (
            steps.map((step) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg border bg-muted/30 ${
                  step.status === 'in-progress' ? 'border-warning/40' : 'border-success/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{step.stage}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      · {step.collections?.batch_id || 'Unknown Batch'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={step.status === 'completed' ? 'default' : 'secondary'}
                      className={
                        step.status === 'completed'
                          ? 'bg-success text-success-foreground'
                          : 'bg-warning/20 text-warning-foreground'
                      }
                    >
                      {step.status}
                    </Badge>
                    {step.status === 'in-progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        disabled={markingId === step.id}
                        onClick={() => markCompleted(step.id)}
                      >
                        {markingId === step.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <CheckCircle2 className="h-3 w-3" />
                        }
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Started: {new Date(step.started_at).toLocaleDateString()}</span>
                  {step.ended_at && (
                    <span>Completed: {new Date(step.ended_at).toLocaleDateString()}</span>
                  )}
                  {step.temperature != null && <span>🌡 {step.temperature}°C</span>}
                  {step.humidity != null && <span>💧 {step.humidity}%</span>}
                  {step.facility_id && (
                    <span className="font-mono">{step.facility_id}</span>
                  )}
                </div>

                <Progress
                  value={step.status === 'completed' ? 100 : 60}
                  className="mt-2 h-1.5"
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
