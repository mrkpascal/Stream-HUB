import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, Crown, Zap, Shield, X, Sparkles } from 'lucide-react';
import { SubscriptionTierId } from '../../types';

export const PricingModal: React.FC = () => {
  const {
    pricingModalOpen,
    setPricingModalOpen,
    subscriptionTiers,
    currentUser,
    upgradeSubscription,
    openAuthModal,
  } = useApp();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  if (!pricingModalOpen) return null;

  const handleSelectTier = (tierId: SubscriptionTierId) => {
    if (!currentUser) {
      setPricingModalOpen(false);
      openAuthModal('signup');
      return;
    }
    upgradeSubscription(tierId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" />
              <span>Streaming Tiers & Monetization Access</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Choose an ad-free tier with 4K UHD encoding, early premiere access, and unlimited 18+ vaults.
            </p>
          </div>
          <button
            onClick={() => setPricingModalOpen(false)}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Billing Cadence Toggle */}
        <div className="flex justify-center border-b border-neutral-800 bg-neutral-950/40 py-3">
          <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-md px-3.5 py-1 text-xs font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-md px-3.5 py-1 text-xs font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Annual Billing (Save 18%)
            </button>
          </div>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          {subscriptionTiers.map((tier) => {
            const isCurrent = currentUser?.subscriptionTier === tier.id;
            const price = billingCycle === 'monthly' ? tier.priceMonthly : tier.priceYearly;

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all ${
                  tier.recommended
                    ? 'border-rose-500/60 bg-gradient-to-b from-rose-950/20 to-neutral-900 shadow-lg shadow-rose-950/30'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                {tier.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rose-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading text-base font-bold text-white">
                      {tier.name}
                    </h4>
                    <span className="text-[10px] font-semibold uppercase text-neutral-400">
                      {tier.badge}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-extrabold text-white tabular-nums">
                      ${price}
                    </span>
                    <span className="text-xs text-neutral-400">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-neutral-400 leading-relaxed min-h-[36px]">
                    {tier.description}
                  </p>

                  <div className="my-4 border-t border-neutral-800 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 mb-2.5">
                      Included features:
                    </p>
                    <ul className="space-y-2 text-xs text-neutral-300">
                      {tier.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 shrink-0 text-rose-400 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <button
                    onClick={() => handleSelectTier(tier.id)}
                    disabled={isCurrent}
                    className={`w-full rounded-lg py-2.5 text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'border border-neutral-700 bg-neutral-800 text-neutral-400 cursor-default'
                        : tier.recommended
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30 hover:bg-rose-500'
                        : 'border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${tier.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950 px-6 py-3.5 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>Encrypted Sandbox Checkout · Instant Activation · Cancel Anytime</span>
          </div>
          <span className="text-[11px]">Direct Creator Revenue Split 65/35</span>
        </div>
      </div>
    </div>
  );
};
