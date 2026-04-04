import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Factory, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProcessorProcessPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [collections, setCollections] = useState<any[]>([]);
  const [collectionId, setCollectionId] = useState('');
  const [stage, setStage] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [facilityId, setFacilityId] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    const { data, error } = await supabase
      .from('collections')
      .select('id, batch_id')
      .order('created_at', { ascending: false });
    if (!error) setCollections(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId || !stage) {
      toast.error('Please select both a Batch ID and a Stage');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('processing_steps').insert({
        collection_id: collectionId,
        stage,
        temperature: temperature ? parseFloat(temperature) : null,
        humidity: humidity ? parseFloat(humidity) : null,
        facility_id: facilityId || null,
        status: 'in-progress',
        started_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Processing step logged!');
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to log step');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setCollectionId('');
    setStage('');
    setTemperature('');
    setHumidity('');
    setFacilityId('');
  };

  if (submitted) {
    return (
      <div className="container max-w-lg py-12 text-center animate-fade-in">
        <div className="rounded-full bg-success/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold">Processing Step Logged</h2>
        <p className="text-muted-foreground mt-2">Step is now tracked as in-progress.</p>
        <Button className="mt-6" onClick={handleReset}>Log Another</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-xl py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">New Processing Step</h1>
      <p className="text-muted-foreground mb-6">Log a processing stage for a batch.</p>
      <Card>
        <CardContent className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchId">Batch ID</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger id="batchId">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.batch_id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Drying">Drying</SelectItem>
                  <SelectItem value="Grinding">Grinding</SelectItem>
                  <SelectItem value="Storage">Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  placeholder="e.g. 45"
                  value={temperature}
                  onChange={e => setTemperature(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  placeholder="e.g. 15"
                  value={humidity}
                  onChange={e => setHumidity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilityId">Facility ID</Label>
              <Input
                id="facilityId"
                placeholder="e.g. FAC-HC-01"
                value={facilityId}
                onChange={e => setFacilityId(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Logging...</>
                : <><Factory className="h-4 w-4 mr-2" /> Log Step</>
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
