import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProcessorBatchesPage() {
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

  return (
    <div className="container py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">Batch Tracking</h1>
      <p className="text-muted-foreground mb-4">
        {steps.length} processing step{steps.length !== 1 ? 's' : ''} tracked.
      </p>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
        </div>
      ) : steps.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No processing steps found. Log a step via "New Step".
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {steps.map((step) => (
            <Card key={step.id} className={step.status === 'in-progress' ? 'border-warning/40' : 'border-success/30'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{step.stage}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {step.collections?.batch_id || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={step.status === 'completed' ? 'default' : 'secondary'}
                      className={step.status === 'completed' ? 'bg-success text-success-foreground' : 'bg-warning/20 text-warning-foreground'}
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
                  {step.facility_id && <span className="font-mono">{step.facility_id}</span>}
                </div>

                <Progress
                  value={step.status === 'completed' ? 100 : 60}
                  className="mt-2 h-1.5"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
