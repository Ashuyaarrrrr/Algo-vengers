import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import { DEMO_USERS, ROLE_LABELS, ROLE_COLORS, type UserRole } from '@/lib/demo-data';
import { Leaf, FlaskConical, Factory, Package, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  farmer: Leaf,
  lab: FlaskConical,
  processor: Factory,
  manufacturer: Package,
  admin: ShieldCheck,
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  farmer: 'Log harvest events with GPS, species data, and quality assessments',
  lab: 'Run quality tests, upload certificates, validate batches',
  processor: 'Track drying, grinding, and storage processing stages',
  manufacturer: 'Create formulations, generate QR codes, manage products',
  admin: 'Monitor network health, compliance, and supply chain analytics',
};

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = (userId: string) => {
    login(userId);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-sage-50/50 to-background">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <Leaf className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">AyurTrace</h1>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            Blockchain-powered traceability for Ayurvedic herbs — from farm to shelf.
          </p>
        </div>

        <div className="grid gap-3">
          {DEMO_USERS.map((user) => {
            const Icon = ROLE_ICONS[user.role];
            return (
              <Card
                key={user.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                onClick={() => handleLogin(user.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`rounded-lg p-2.5 ${ROLE_COLORS[user.role]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{user.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{ROLE_LABELS[user.role]}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.organization}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ROLE_DESCRIPTIONS[user.role]}</p>
                  </div>
                  <Button variant="outline" size="sm">Login</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button variant="link" className="text-muted-foreground" onClick={() => navigate('/verify/ASHVITAL-001-2026')}>
            Or scan a product as a consumer →
          </Button>
        </div>
      </div>
    </div>
  );
}
