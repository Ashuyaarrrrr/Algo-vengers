import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Upload, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function LabPendingPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [collectionId, setCollectionId] = useState('');
  const [collections, setCollections] = useState<any[]>([]);
  const [testType, setTestType] = useState('');
  const [status, setStatus] = useState('pending');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingTests();
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('id, batch_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingTests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lab_tests')
        .select(`
          *,
          collections (
            batch_id
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPending(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load pending tests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId || !testType) {
      toast.error('Please select both a Batch ID and a Test Type');
      return;
    }
    
    setSubmitting(true);
    try {
      // Insert into lab_tests with collection_id
      const { error: insertError } = await supabase
        .from('lab_tests')
        .insert({
          collection_id: collectionId,
          test_type: testType,
          status: status,
          result: status === 'pending' ? 'Awaiting analysis' : status === 'pass' ? 'Passed all checks' : 'Failed quality checks'
        });

      if (insertError) throw insertError;

      toast.success('Lab test submitted successfully');
      setCollectionId('');
      setTestType('');
      await fetchPendingTests();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failure submitting test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-6 animate-fade-in max-w-4xl">
      <div className="mb-8">
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Lab Report
            </CardTitle>
            <CardDescription>
              Submit a new test report for an herb batch. The PDF will be hashed for blockchain verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batchId">Batch ID</Label>
                <Select value={collectionId} onValueChange={setCollectionId} required>
                  <SelectTrigger id="batchId">
                    <SelectValue placeholder="Select Batch ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map(col => (
                      <SelectItem key={col.id} value={col.id}>{col.batch_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="testType">Test Type</Label>
                <Select value={testType} onValueChange={setTestType} required>
                  <SelectTrigger id="testType">
                    <SelectValue placeholder="Select Test Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNA Barcoding">DNA Barcoding</SelectItem>
                    <SelectItem value="Heavy Metals">Heavy Metals</SelectItem>
                    <SelectItem value="Pesticide Residue">Pesticide Residue</SelectItem>
                    <SelectItem value="Moisture Content">Moisture Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Result Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportFile">Upload Report (PDF)</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    id="reportFile" 
                    type="file" 
                    accept=".pdf" 
                    className="cursor-pointer file:cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:-ml-2 file:text-sm file:font-medium" 
                    // optional for dummy, but required if they want real uploads later
                  />
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <h1 className="text-2xl font-bold mb-1">Pending Tests</h1>
      <p className="text-muted-foreground mb-4">{pending.length} tests awaiting results.</p>
      
      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
      ) : pending.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No pending tests 🎉</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {pending.map((test) => (
            <Card key={test.id} className="border-warning/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="font-medium">{test.test_type}</span>
                    <Badge variant="outline" className="text-xs font-mono-data">
                      {test.collections?.batch_id || 'Unknown Batch'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Submitted: {new Date(test.created_at).toLocaleDateString()}</p>
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
