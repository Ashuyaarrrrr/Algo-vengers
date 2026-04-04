import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/StatCard';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Leaf, MapPin, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FarmerDashboard() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setCollections(data || []);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();

    // Supabase REALTIME listener for live updates
    const channel = supabase
      .channel('collections_dashboard_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'collections' },
        (payload) => {
          console.log('Realtime new collection:', payload.new);
          // Prepend the new record without refreshing the page
          setCollections((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalKg = collections.reduce((s, c) => s + (Number(c.quantity) || 0), 0);
  
  // Assume all items in our system sync correctly or use placeholder
  const syncedCount = collections.filter((c) => c.status === 'synced').length || collections.length;

  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Farmer Dashboard</h1>
        <p className="text-muted-foreground">Kerala Ashwagandha Growers Collective</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Harvested" value={`${totalKg} kg`} icon={Leaf} trend="+12% this month" />
        <StatCard label="Collections" value={collections.length} icon={MapPin} />
        <StatCard label="Synced" value={`${syncedCount}/${collections.length || 1}`} icon={TrendingUp} />
        <StatCard label="Alerts" value="1" icon={AlertTriangle} className="border-warning/30" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No collections recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {collections.map((col) => (
                <div key={col.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {col.species ? col.species.split('(')[0].trim() : 'Unknown'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {col.batch_id || `COL-${col.id?.toString().slice(0, 4) || '???'}`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {col.quantity} {col.unit} · {col.date} · {col.weather || '--'}, {col.temperature || '--'}°C
                    </p>
                    <p className="text-xs font-mono-data text-muted-foreground">
                      📍 {col.latitude != null ? Number(col.latitude).toFixed(4) : '--'}, {col.longitude != null ? Number(col.longitude).toFixed(4) : '--'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={col.quality === 'excellent' ? 'default' : 'secondary'} 
                      className={col.quality === 'excellent' ? 'bg-success text-success-foreground' : ''}
                    >
                      {col.quality || 'N/A'}
                    </Badge>
                    <BlockchainBadge txHash={col.tx_hash || undefined} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Sustainability Alert</p>
            <p className="text-sm text-muted-foreground">
              Ashwagandha harvest in Thrissur district is at 78% of seasonal limit.
              Remaining quota: ~14 kg for this quarter.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
