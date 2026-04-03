import { StatCard } from '@/components/StatCard';
import { ShieldCheck, Activity, Users, AlertTriangle, Globe, TrendingUp, Leaf, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const harvestData = [
  { month: 'Jan', kg: 45 }, { month: 'Feb', kg: 62 }, { month: 'Mar', kg: 55 },
];

const speciesData = [
  { name: 'Ashwagandha', value: 43, color: '#7C9885' },
  { name: 'Tulsi', value: 12, color: '#D4896B' },
  { name: 'Shatavari', value: 8, color: '#E6B84F' },
];

const alerts = [
  { type: 'warning', message: 'Thrissur district Ashwagandha at 78% seasonal limit', time: '2h ago' },
  { type: 'info', message: 'New lab test submitted for TULSI-2026-001', time: '4h ago' },
  { type: 'success', message: 'Batch ASHW-2026-001 fully verified on-chain', time: '1d ago' },
];

export default function AdminDashboard() {
  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">AYUSH Ministry · Regulatory Overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Network Nodes" value="12" icon={Globe} trend="All healthy" />
        <StatCard label="Transactions" value="1,847" icon={Activity} />
        <StatCard label="Active Users" value="23" icon={Users} />
        <StatCard label="Alerts" value="1" icon={AlertTriangle} className="border-warning/30" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Harvest Volumes (kg)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={harvestData}>
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="kg" fill="hsl(147, 12%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Species Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={speciesData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                  {speciesData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {speciesData.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.name}</span>
                  <span className="text-muted-foreground">{s.value} kg</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Network Health</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Consensus', value: 99.8 },
              { label: 'Throughput', value: 85 },
              { label: 'Sync Reliability', value: 97 },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{m.label}</span>
                  <span className="font-medium">{m.value}%</span>
                </div>
                <Progress value={m.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <Badge variant="outline" className={
                  a.type === 'warning' ? 'text-warning border-warning/30' :
                  a.type === 'success' ? 'text-success border-success/30' :
                  'text-info border-info/30'
                }>
                  {a.type}
                </Badge>
                <div className="flex-1">
                  <p>{a.message}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
