import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from '@/lib/demo-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Leaf, FlaskConical, Factory, Package, ShieldCheck, Truck, ShoppingBag } from 'lucide-react';

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  farmer: Leaf,
  lab: FlaskConical,
  processor: Factory,
  manufacturer: Package,
  distributor: Truck,
  retailer: ShoppingBag,
  admin: ShieldCheck,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('*');
      if (data) setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  if (loading) return <div className="p-8 text-center bg-white min-h-screen">Loading users...</div>;

  return (
    <div className="container py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">{users.length} registered users.</p>
        </div>
        <Button>Add User</Button>
      </div>

      <div className="space-y-3">
        {users.map((user) => {
          const role = (user.role || 'farmer') as UserRole;
          const Icon = ROLE_ICONS[role] || Leaf;
          return (
            <Card key={user.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`rounded-lg p-2.5 ${ROLE_COLORS[role] || ROLE_COLORS.farmer}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name || user.email}</span>
                    <Badge variant="outline" className="text-xs">{ROLE_LABELS[role]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email} · {user.location || 'Unknown'}</p>
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
