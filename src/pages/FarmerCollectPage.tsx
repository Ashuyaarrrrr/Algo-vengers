import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';
import { createHerbBatch, UI_ROLE_TO_CONTRACT_ROLE, hasRole } from '@/lib/blockchain';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { MapPin, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';

const SPECIES = [
  'Ashwagandha (Withania somnifera)',
  'Tulsi (Ocimum tenuiflorum)',
  'Shatavari (Asparagus racemosus)',
  'Brahmi (Bacopa monnieri)',
  'Neem (Azadirachta indica)',
];

export default function FarmerCollectPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const wallet   = useWallet();
  const [loading, setLoading]         = useState(false);
  const [txHash, setTxHash]           = useState<string | null>(null);
  const [blockchainStatus, setBlockchainStatus] = useState<'idle' | 'submitting' | 'confirmed' | 'failed'>('idle');
  const [hasBlockchainRole, setHasBlockchainRole] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    collector_id:  user?.id || '',
    date:          new Date().toISOString().split('T')[0],
    species:       SPECIES[0],
    quantity:      '',
    unit:          'kg',
    quality:       'excellent',
    weather:       'sunny',
    temperature:   '',
    latitude:      '',
    longitude:     '',
    location_name: '',
    notes:         '',
    isSustainable: true,
  });

  // Auto-capture GPS
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData((p) => ({
          ...p,
          latitude:  pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        })),
        (err) => console.warn('Geolocation error:', err)
      );
    }
  }, []);

  // Check if the wallet has the COLLECTOR_ROLE on-chain
  useEffect(() => {
    if (!wallet.account) { setHasBlockchainRole(null); return; }
    const check = async () => {
      const ok = await hasRole(UI_ROLE_TO_CONTRACT_ROLE['farmer'], wallet.account!);
      setHasBlockchainRole(ok);
    };
    check();
  }, [wallet.account]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) =>
    setFormData((p) => ({ ...p, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.collector_id || !formData.date || !formData.species || !formData.quantity || !formData.unit) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    // ── Step 1: Save to Supabase (source of truth for UI) ───────────
    try {
      const { data: row, error } = await supabase
        .from('collections')
        .insert([{
          ...formData,
          quantity:    parseFloat(formData.quantity) || 0,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          latitude:    formData.latitude    ? parseFloat(formData.latitude)    : null,
          longitude:   formData.longitude   ? parseFloat(formData.longitude)   : null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Collection saved to database!');

      // ── Step 2: Write to blockchain (MetaMask) ─────────────────────
      if (wallet.isConnected && wallet.isCorrectNetwork && hasBlockchainRole) {
        setBlockchainStatus('submitting');
        try {
          const harvestTimestamp = Math.floor(new Date(formData.date).getTime() / 1000);
          const quantityInt      = Math.round(parseFloat(formData.quantity) * 1000); // scale to avoid decimals
          const tempInt          = formData.temperature ? Math.round(parseFloat(formData.temperature)) : 0;

          const { batchId, txHash: hash } = await createHerbBatch({
            herbName:       formData.species.split('(')[0].trim(),
            geoLatitude:    formData.latitude  || '0',
            geoLongitude:   formData.longitude || '0',
            harvestDate:    harvestTimestamp,
            isSustainable:  formData.isSustainable,
            herbSpecies:    formData.species,
            quantity:       quantityInt,
            unit:           formData.unit,
            weather:        formData.weather,
            temperature:    tempInt,
            initialQuality: formData.quality,
            ipfsHash:       '',
          });

          // Save blockchain batchId back to the Supabase row
          if (batchId && row?.id) {
            await supabase
              .from('collections')
              .update({ batch_id: batchId })
              .eq('id', row.id);
          }

          setTxHash(hash);
          setBlockchainStatus('confirmed');
          toast.success(`On-chain! TX: ${hash.slice(0, 10)}…`);
        } catch (bcErr: any) {
          console.error('[blockchain] createHerbBatch error:', bcErr);
          setBlockchainStatus('failed');
          toast.warning(`Saved to database but blockchain write failed: ${bcErr.message}`);
        }
      }

      navigate('/farmer/history');
    } catch (err: any) {
      console.error('Error inserting collection:', err);
      toast.error(err.message || 'Failed to submit collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-xl py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">New Collection</h1>
        {blockchainStatus === 'confirmed' && <BlockchainBadge txHash={txHash!} status="confirmed" />}
        {blockchainStatus === 'submitting' && <BlockchainBadge status="submitting" />}
      </div>
      <p className="text-muted-foreground mb-4">Record a harvest event with GPS and quality data.</p>



      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Collector ID *</Label>
                <Input name="collector_id" value={formData.collector_id} readOnly className="font-mono text-sm bg-muted" />
              </div>
              <div>
                <Label>Date *</Label>
                <Input type="date" name="date" value={formData.date} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <Label>Species *</Label>
              <Select value={formData.species} onValueChange={(v) => handleSelectChange('species', v)}>
                <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                <SelectContent>
                  {SPECIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input type="number" name="quantity" placeholder="25" value={formData.quantity} onChange={handleChange} required />
              </div>
              <div>
                <Label>Unit *</Label>
                <Select value={formData.unit} onValueChange={(v) => handleSelectChange('unit', v)}>
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
              <Select value={formData.quality} onValueChange={(v) => handleSelectChange('quality', v)}>
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
                <Select value={formData.weather} onValueChange={(v) => handleSelectChange('weather', v)}>
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
                <Input type="number" name="temperature" placeholder="28" value={formData.temperature} onChange={handleChange} />
              </div>
            </div>

            <div>
              <Label>Location Name</Label>
              <Input name="location_name" placeholder="e.g. Kerala Forest Reserve" value={formData.location_name} onChange={handleChange} />
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">GPS {formData.latitude ? 'Auto-Captured' : 'Locating…'}</span>
              </div>
              {formData.latitude && formData.longitude ? (
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {parseFloat(formData.latitude).toFixed(6)}°, {parseFloat(formData.longitude).toFixed(6)}°
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Acquiring position…</p>
              )}
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea name="notes" placeholder="Additional observations…" rows={3} value={formData.notes} onChange={handleChange} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>Saving…</>
              ) : (
                <>
                  <Leaf className="h-4 w-4 mr-2" />
                  Submit Collection
                  {wallet.isConnected && wallet.isCorrectNetwork && hasBlockchainRole && (
                    <span className="ml-2 text-xs opacity-80">+ On-Chain</span>
                  )}
                </>
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
