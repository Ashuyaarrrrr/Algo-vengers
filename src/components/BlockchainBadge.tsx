import { ShieldCheck, Clock, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  txHash?: string;
  status?: 'confirmed' | 'pending';
}

export function BlockchainBadge({ txHash, status = txHash ? 'confirmed' : 'pending' }: Props) {
  if (status === 'pending') {
    return (
      <Badge variant="outline" className="gap-1 text-warning border-warning/30 bg-warning/5">
        <Clock className="h-3 w-3" /> Pending
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-success border-success/30 bg-success/5">
      <ShieldCheck className="h-3 w-3" /> On-Chain
    </Badge>
  );
}
