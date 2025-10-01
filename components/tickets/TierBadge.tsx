import React from 'react';
import { Crown, Star, Ticket } from 'lucide-react';
import { TierLevel } from '@prisma/client';
import { getTierDisplay } from '@/lib/utils/ticket-classifier';

interface TierBadgeProps {
  tierLevel: TierLevel | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function TierBadge({ tierLevel, size = 'md', showLabel = true }: TierBadgeProps) {
  const display = getTierDisplay(tierLevel);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (!tierLevel) return null;

  const Icon = tierLevel === TierLevel.VIP_ITEM ? Crown :
               tierLevel === TierLevel.GOLD_LEVEL ? Star : Ticket;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${display.color} ${sizeClasses[size]}`}>
      <Icon className={`${iconSizes[size]} ${
        tierLevel === TierLevel.VIP_ITEM ? 'text-black' :
        tierLevel === TierLevel.GOLD_LEVEL ? 'text-white' :
        'text-white'
      }`} />
      {showLabel && (
        <span className={
          tierLevel === TierLevel.VIP_ITEM ? 'text-black' :
          'text-white'
        }>
          {display.label}
        </span>
      )}
    </div>
  );
}