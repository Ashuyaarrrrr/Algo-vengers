import { useState } from 'react';
import { DEMO_TESTS } from '@/lib/demo-data';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Upload } from 'lucide-react';

export default function LabPendingPage() {
  const pending = DEMO_TESTS.filter(t => t.status === 'pending');

  const [herbName, setHerbName] = useState('');
  const [description, setDescription] = useState('');

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate uploading the report
    alert("Report for " + herbName + " submitted to the blockchain!");
    setHerbName('');
    setDescription('');
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
                <Label htmlFor="herbName">Name of Herb</Label>
                <Input 
                  id="herbName" 
                  placeholder="e.g., Ashwagandha Root" 
                  value={herbName}
                  onChange={(e) => setHerbName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description of Herb</Label>
                <Textarea 
                  id="description" 
                  placeholder="Provide batch details, physical characteristics, and processing notes..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportFile">Upload Report (PDF)</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    id="reportFile" 
                    type="file" 
                    accept=".pdf" 
                    className="cursor-pointer file:cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:-ml-2 file:text-sm file:font-medium" 
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Submit Report
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

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
