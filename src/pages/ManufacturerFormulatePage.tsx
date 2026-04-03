import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ManufacturerFormulatePage() {
  const [herbs, setHerbs] = useState([{ name: 'Ashwagandha', ratio: 85 }]);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="container max-w-lg py-12 text-center animate-fade-in">
        <div className="rounded-full bg-success/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold">Formulation Created</h2>
        <p className="text-muted-foreground mt-2">Product registered on blockchain.</p>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>New Formulation</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-xl py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">Formulation Builder</h1>
      <p className="text-muted-foreground mb-6">Create a product formulation with herb blending ratios.</p>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div><Label>Product Name</Label><Input placeholder="AshwaVital Capsules" /></div>
          <div><Label>Dosage</Label><Input placeholder="500mg x 60 capsules" /></div>

          <div>
            <Label>Herb Composition</Label>
            <div className="space-y-2 mt-2">
              {herbs.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={h.name} onChange={(e) => { const n = [...herbs]; n[i].name = e.target.value; setHerbs(n); }} placeholder="Herb name" className="flex-1" />
                  <Input type="number" value={h.ratio} onChange={(e) => { const n = [...herbs]; n[i].ratio = Number(e.target.value); setHerbs(n); }} className="w-20" />
                  <span className="text-sm text-muted-foreground">%</span>
                  {herbs.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => setHerbs(herbs.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setHerbs([...herbs, { name: '', ratio: 0 }])}>
              <Plus className="h-3 w-3 mr-1" /> Add Herb
            </Button>
            <div className="mt-2">
              <Badge variant={herbs.reduce((s, h) => s + h.ratio, 0) === 100 ? 'default' : 'destructive'}
                className={herbs.reduce((s, h) => s + h.ratio, 0) === 100 ? 'bg-success text-success-foreground' : ''}>
                Total: {herbs.reduce((s, h) => s + h.ratio, 0)}%
              </Badge>
            </div>
          </div>

          <Button className="w-full" onClick={() => { setSubmitted(true); toast.success('Formulation created!'); }}>
            <Package className="h-4 w-4 mr-2" /> Create Formulation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
