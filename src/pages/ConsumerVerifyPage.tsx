import { useParams, Link } from 'react-router-dom';
import { JOURNEY_DATA } from '@/lib/demo-data';
import { Leaf, FlaskConical, Factory, Package, ShieldCheck, MapPin, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const STEP_ICONS: Record<string, React.ElementType> = {
  leaf: Leaf, flask: FlaskConical, factory: Factory, package: Package,
};

export default function ConsumerVerifyPage() {
  const { qrCode } = useParams();
  const data = JOURNEY_DATA;
  const isValid = qrCode === 'ASHVITAL-001-2026';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50/50 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
            <Leaf className="h-6 w-6 text-primary" />
            <span>AyurTrace</span>
          </Link>
          <Badge variant="outline" className="text-xs">Consumer Portal</Badge>
        </div>
      </header>

      <div className="container max-w-2xl py-8 space-y-6 animate-fade-in">
        {!isValid ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
              <p className="text-muted-foreground">Code "{qrCode}" not recognized. Please check and try again.</p>
              <Button className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Authenticity Card */}
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-success/20 p-3">
                    <ShieldCheck className="h-8 w-8 text-success" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-success">Verified Authentic</h2>
                    <p className="text-sm text-muted-foreground">Blockchain-verified with {data.authenticityScore}% confidence</p>
                  </div>
                </div>
                <Progress value={data.authenticityScore} className="mt-4 h-2" />
              </CardContent>
            </Card>

            {/* Product Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold">{data.productName}</h3>
                <p className="text-sm text-muted-foreground">by {data.manufacturer}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="font-mono-data text-xs">{data.batchId}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Journey Timeline */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-6">Journey — Farm to Shelf</h3>
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {data.steps.map((step, i) => {
                      const Icon = STEP_ICONS[step.icon] || Leaf;
                      return (
                        <div key={i} className="relative flex gap-4">
                          <div className={`relative z-10 rounded-full p-2 border-2 ${step.verified ? 'bg-success/10 border-success' : 'bg-muted border-border'}`}>
                            <Icon className={`h-4 w-4 ${step.verified ? 'text-success' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{step.title}</span>
                              {step.verified && <CheckCircle className="h-3.5 w-3.5 text-success" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{step.date}</p>
                            <p className="text-sm mt-1">{step.details}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{step.location}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{step.actor} · {step.org}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sustainability */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-3">Sustainability Credentials</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Wild-Harvested', desc: 'Sustainably collected from natural habitat' },
                    { label: 'Fair Trade', desc: 'Farmer receives fair compensation' },
                    { label: 'Conservation Compliant', desc: 'Within seasonal harvest limits' },
                    { label: 'Lab Verified', desc: 'All quality tests passed' },
                  ].map((c) => (
                    <div key={c.label} className="p-3 rounded-lg bg-sage-50 border border-sage-100">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                        <span className="text-sm font-medium">{c.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-2">Community Impact</h3>
                <p className="text-sm text-muted-foreground">
                  This product supports the Kerala Ashwagandha Growers Collective — a cooperative
                  of 47 farmers preserving traditional harvesting practices while ensuring sustainable yields.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">47</p>
                    <p className="text-xs text-muted-foreground">Farmers</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">12</p>
                    <p className="text-xs text-muted-foreground">Villages</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">3yr</p>
                    <p className="text-xs text-muted-foreground">Active Since</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
