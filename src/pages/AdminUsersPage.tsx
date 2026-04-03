import { DEMO_USERS, ROLE_LABELS, ROLE_COLORS, type UserRole } from '@/lib/demo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Leaf, FlaskConical, Factory, Package, ShieldCheck } from 'lucide-react';

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  farmer: Leaf, lab: FlaskConical, processor: Factory, manufacturer: Package, admin: ShieldCheck,
};

export default function AdminUsersPage() {
  return (
    <div className="container py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">{DEMO_USERS.length} registered users.</p>
        </div>
        <Button>Add User</Button>
      </div>

      <div className="space-y-3">
        {DEMO_USERS.map((user) => {
          const Icon = ROLE_ICONS[user.role];
          return (
            <Card key={user.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`rounded-lg p-2.5 ${ROLE_COLORS[user.role]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    <Badge variant="outline" className="text-xs">{ROLE_LABELS[user.role]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email} · {user.organization}</p>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
