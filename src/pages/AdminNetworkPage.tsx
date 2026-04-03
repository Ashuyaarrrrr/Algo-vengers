import { StatCard } from '@/components/StatCard';
import { Globe, Activity, Server, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const nodes = [
  { name: 'Kerala Node 1', status: 'online', latency: '12ms', block: 14523 },
  { name: 'Kerala Node 2', status: 'online', latency: '18ms', block: 14523 },
  { name: 'Mumbai Gateway', status: 'online', latency: '45ms', block: 14522 },
  { name: 'Delhi Regulator', status: 'online', latency: '62ms', block: 14522 },
  { name: 'Bangalore Lab', status: 'syncing', latency: '120ms', block: 14520 },
];

export default function AdminNetworkPage() {
  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Network Health</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Nodes Online" value="4/5" icon={Globe} />
        <StatCard label="Block Height" value="14,523" icon={Server} />
        <StatCard label="TPS" value="23.4" icon={Activity} />
        <StatCard label="Avg Latency" value="51ms" icon={Wifi} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Nodes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nodes.map((node) => (
              <div key={node.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${node.status === 'online' ? 'bg-success' : 'bg-warning animate-pulse'}`} />
                  <div>
                    <span className="font-medium text-sm">{node.name}</span>
                    <p className="text-xs text-muted-foreground">Block #{node.block} · {node.latency}</p>
                  </div>
                </div>
                <Badge variant={node.status === 'online' ? 'default' : 'secondary'}
                  className={node.status === 'online' ? 'bg-success text-success-foreground' : ''}>
                  {node.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
