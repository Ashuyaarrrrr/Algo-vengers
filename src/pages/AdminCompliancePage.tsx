import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const complianceData = [
  { region: 'Thrissur', score: 78 },
  { region: 'Ernakulam', score: 92 },
  { region: 'Wayanad', score: 85 },
  { region: 'Idukki', score: 95 },
];

const qualityTrend = [
  { month: 'Jan', rate: 94 }, { month: 'Feb', rate: 97 }, { month: 'Mar', rate: 95 },
];

export default function AdminCompliancePage() {
  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Compliance & Analytics</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Harvest Limits by Region</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={complianceData}>
                <XAxis dataKey="region" fontSize={12} />
                <YAxis fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="hsl(147, 12%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Quality Pass Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={qualityTrend}>
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} domain={[80, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="hsl(147, 12%, 55%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Sustainability Metrics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Ashwagandha – Thrissur', value: 78, limit: '55/70 kg' },
            { label: 'Tulsi – Ernakulam', value: 42, limit: '12/28 kg' },
            { label: 'Shatavari – Wayanad', value: 15, limit: '8/52 kg' },
          ].map((m) => (
            <div key={m.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{m.label}</span>
                <span className="text-muted-foreground">{m.limit} ({m.value}%)</span>
              </div>
              <Progress value={m.value} className={`h-2 ${m.value > 75 ? '[&>div]:bg-warning' : ''}`} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
