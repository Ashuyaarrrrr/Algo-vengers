import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Factory, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ProcessorProcessPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="container max-w-lg py-12 text-center animate-fade-in">
        <div className="rounded-full bg-success/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold">Processing Step Logged</h2>
        <p className="text-muted-foreground mt-2">Awaiting blockchain confirmation.</p>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>Log Another</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-xl py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">New Processing Step</h1>
      <p className="text-muted-foreground mb-6">Log a processing stage for a batch.</p>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Batch ID</Label>
            <Input placeholder="ASHW-2026-001" />
          </div>
          <div>
            <Label>Stage</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="drying">Drying</SelectItem>
                <SelectItem value="grinding">Grinding</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="extraction">Extraction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Temperature (°C)</Label><Input type="number" placeholder="45" /></div>
            <div><Label>Humidity (%)</Label><Input type="number" placeholder="15" /></div>
          </div>
          <div><Label>Facility ID</Label><Input placeholder="FAC-HC-01" /></div>
          <Button className="w-full" onClick={() => { setSubmitted(true); toast.success('Processing step logged!'); }}>
            <Factory className="h-4 w-4 mr-2" /> Log Step
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
