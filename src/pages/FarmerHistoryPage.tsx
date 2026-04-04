import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function FarmerHistoryPage() {
  const [search, setSearch] = useState('');
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;

    const fetchCollections = async () => {
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .eq('collector_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCollections(data || []);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('public:collections')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'collections', 
        filter: `collector_id=eq.${user.id}` 
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setCollections(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setCollections(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
        } else if (payload.eventType === 'DELETE') {
          setCollections(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  const filtered = collections.filter(c => {
    const term = search.toLowerCase();
    const species = (c.species || c.herb_name || '').toLowerCase();
    const batchId = (c.batch_id || '').toLowerCase();
    return species.includes(term) || batchId.includes(term);
  });

  return (
    <div className="container py-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-1">Collection History</h1>
      <p className="text-muted-foreground mb-4">All your recorded harvests.</p>
      
      <Input 
        placeholder="Search by herb name or batch ID..." 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        className="max-w-sm mb-4" 
      />
      
      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {search ? 'No matches found.' : 'No collection history found.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((col) => (
            <Card key={col.id}>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-lg">
                      {(col.species || col.herb_name || 'Unknown Herb').split('(')[0].trim()}
                    </span>
                    <Badge variant="outline" className="text-xs font-mono-data">
                      {col.batch_id || 'Pending Batch ID'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {col.quantity} {col.unit || 'kg'} · {col.created_at ? new Date(col.created_at).toLocaleDateString() : (col.date || 'Unknown Date')} · {col.weather || 'Unknown weather'}
                  </p>
                  <p className="text-xs font-mono-data text-muted-foreground mt-1">
                    📍 {col.latitude || col.location_lat ? Number(col.latitude || col.location_lat).toFixed(4) : 'N/A'}, {col.longitude || col.location_lng ? Number(col.longitude || col.location_lng).toFixed(4) : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={col.quality === 'excellent' ? 'default' : 'secondary'}
                    className={col.quality === 'excellent' ? 'bg-emerald-500 hover:bg-emerald-600 outline-none border-none' : ''}
                  >
                    {col.quality ? col.quality.charAt(0).toUpperCase() + col.quality.slice(1) : 'Unknown'}
                  </Badge>
                  
                  {col.tx_hash ? (
                    <BlockchainBadge txHash={col.tx_hash} />
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      {col.status || 'Pending'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
