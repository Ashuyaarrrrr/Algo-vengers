import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
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
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    collector_id: user?.id || '',
    date: new Date().toISOString().split('T')[0],
    species: SPECIES[0],
    quantity: '',
    unit: 'kg',
    quality: 'excellent',
    weather: 'sunny',
    temperature: '',
    latitude: '',
    longitude: '',
    location_name: '',
    notes: ''
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
        },
        (error) => {
          console.warn('Geolocation error:', error);
          toast.error('Could not auto-capture GPS location. You may need to enable location access.');
        }
      );
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.collector_id || !formData.date || !formData.species || !formData.quantity || !formData.unit) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('collections')
        .insert([{
          ...formData,
          quantity: parseFloat(formData.quantity) || 0,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }]);

      if (error) {
        throw error;
      }

      toast.success('Collection recorded successfully!');
      navigate('/dashboard'); 
    } catch (err: any) {
      console.error('Error inserting collection:', err);
      toast.error(err.message || 'Failed to submit collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-xl py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">New Collection</h1>
      <p className="text-muted-foreground mb-6">Record a harvest event with GPS and quality data.</p>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Collector ID *</Label>
                <Input 
                  name="collector_id"
                  value={formData.collector_id} 
                  readOnly 
                  className="font-mono-data text-sm bg-muted" 
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Species *</Label>
              <Select 
                value={formData.species} 
                onValueChange={(val) => handleSelectChange('species', val)}
              >
                <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                <SelectContent>
                  {SPECIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input 
                  type="number" 
                  name="quantity"
                  placeholder="25" 
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label>Unit *</Label>
                <Select 
                  value={formData.unit}
                  onValueChange={(val) => handleSelectChange('unit', val)}
                >
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
              <Select 
                value={formData.quality}
                onValueChange={(val) => handleSelectChange('quality', val)}
              >
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
                <Select 
                  value={formData.weather}
                  onValueChange={(val) => handleSelectChange('weather', val)}
                >
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
                <Input 
                  type="number" 
                  name="temperature"
                  placeholder="28" 
                  value={formData.temperature}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-sage-50 border border-sage-100">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">GPS {formData.latitude ? 'Auto-Captured' : 'Locating...'}</span>
              </div>
              {formData.latitude && formData.longitude ? (
                <p className="text-xs font-mono-data text-muted-foreground mt-1">
                  {formData.latitude}°, {formData.longitude}°
                </p>
              ) : (
                <p className="text-xs font-mono-data text-muted-foreground mt-1">Acquiring position...</p>
              )}
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea 
                name="notes"
                placeholder="Additional observations..." 
                rows={3} 
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <Leaf className="h-4 w-4 mr-2" /> Submit Collection
                </>
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
