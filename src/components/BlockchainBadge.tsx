import { ShieldCheck, Clock, Loader2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  txHash?: string;
  status?: 'confirmed' | 'pending' | 'submitting';
}

export function BlockchainBadge({ txHash, status }: Props) {
  // Derive status if not passed
  const derived = status ?? (txHash ? 'confirmed' : 'pending');

  if (derived === 'submitting') {
    return (
      <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300 bg-blue-50">
        <Loader2 className="h-3 w-3 animate-spin" /> Submitting…
      </Badge>
    );
  }

  if (derived === 'pending') {
    return (
      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
        <Clock className="h-3 w-3" /> Pending
      </Badge>
    );
  }

  // confirmed — show tx hash tooltip
  const short = txHash ? `${txHash.slice(0, 10)}…${txHash.slice(-6)}` : '';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="gap-1 text-emerald-700 border-emerald-300 bg-emerald-50 cursor-pointer"
        >
          <ShieldCheck className="h-3 w-3" /> On-Chain
          {txHash && <ExternalLink className="h-2.5 w-2.5 opacity-60" />}
        </Badge>
      </TooltipTrigger>
      {txHash && (
        <TooltipContent>
          <p className="font-mono text-xs">TX: {short}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Hardhat Localhost</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
