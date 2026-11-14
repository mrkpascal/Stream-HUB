import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSenseUnitProps {
  slotId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical';
  is18PlusContext?: boolean;
  label?: string;
  className?: string;
}

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  slotId,
  format = 'auto',
  is18PlusContext = false,
  label = 'Advertisement',
  className = '',
}) => {
  const { monetization, currentUser, isAdmin } = useApp();
  const pushedRef = useRef(false);

  const adsenseEnabled = monetization.adsenseEnabled ?? true;
  const clientId = monetization.adsenseClientId || 'ca-pub-9250869376937276';
  const resolvedSlot = slotId || monetization.adsenseDisplaySlotId || '';

  // Paid tiers (Pro/VIP) and admins stay ad-free; 18+ pages omit AdSense per policy
  const isAdFreeUser =
    currentUser?.subscriptionTier === 'pro' ||
    currentUser?.subscriptionTier === 'vip' ||
    isAdmin;

  const shouldRender = adsenseEnabled && !isAdFreeUser && !is18PlusContext;

  useEffect(() => {
    if (!shouldRender || !resolvedSlot || pushedRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // Ignore duplicate push or blocked ad-network script in offline/adblock browsers
    }
  }, [shouldRender, resolvedSlot]);

  if (!shouldRender) return null;

  return (
    <div
      className={`rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 text-center ${className}`}
    >
      <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-neutral-500">
        <span>{label}</span>
        <span>Google AdSense</span>
      </div>

      {resolvedSlot ? (
        <ins
          className="adsbygoogle block w-full overflow-hidden rounded-lg"
          style={{ display: 'block', minHeight: format === 'rectangle' ? '250px' : '90px' }}
          data-ad-client={clientId}
          data-ad-slot={resolvedSlot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex min-h-[90px] flex-col items-center justify-center rounded-lg border border-dashed border-neutral-800 bg-neutral-950/60 px-4 py-3 text-xs text-neutral-400">
          <p className="font-medium text-neutral-300">
            Google AdSense Auto Ads Active
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Publisher <span className="font-mono text-neutral-400">{clientId}</span> · Add an optional Ad Unit Slot ID in Admin Monetization for manual placement
          </p>
        </div>
      )}
    </div>
  );
};
