import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin, Leaf, Check } from 'lucide-react';
import { toast } from 'sonner';

const SPECIES = [
  'Ashwagandha (Withania somnifera)',
  'Tulsi (Ocimum tenuiflorum)',
  'Shatavari (Asparagus racemosus)',
  'Brahmi (Bacopa monnieri)',
  'Neem (Azadirachta indica)',
];

export default function FarmerCollectPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="container max-w-lg py-12 text-center animate-fade-in">
        <div className="rounded-full bg-success/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold">Collection Recorded</h2>
        <p className="text-muted-foreground mt-2">Batch ASHW-2026-004 queued for blockchain sync.</p>
        <Badge variant="outline" className="mt-3 text-warning border-warning/30">Sync Pending</Badge>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>New Collection</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-xl py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">New Collection</h1>
      <p className="text-muted-foreground mb-6">Record a harvest event with GPS and quality data.</p>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Collector ID</Label>
              <Input value="farmer-1" readOnly className="font-mono-data text-sm bg-muted" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" defaultValue="2026-04-03" />
            </div>
          </div>

          <div>
            <Label>Species</Label>
            <Select defaultValue={SPECIES[0]}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SPECIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input type="number" placeholder="25" />
            </div>
            <div>
              <Label>Unit</Label>
              <Select defaultValue="kg">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Quality Assessment</Label>
            <Select defaultValue="excellent">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Weather</Label>
              <Select defaultValue="sunny">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">Sunny</SelectItem>
                  <SelectItem value="cloudy">Cloudy</SelectItem>
                  <SelectItem value="rainy">Rainy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperature (°C)</Label>
              <Input type="number" placeholder="28" />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-sage-50 border border-sage-100">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">GPS Auto-Captured</span>
            </div>
            <p className="text-xs font-mono-data text-muted-foreground mt-1">10.5276°N, 76.2144°E · Thrissur, Kerala</p>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea placeholder="Additional observations..." rows={3} />
          </div>

          <Button className="w-full" onClick={() => { setSubmitted(true); toast.success('Collection recorded!'); }}>
            <Leaf className="h-4 w-4 mr-2" /> Submit Collection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
