import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Check,
  Crown,
  Shield,
  X,
  Phone,
  Copy,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Globe,
  Upload,
  Image as ImageIcon,
  ArrowRightLeft,
  Bitcoin,
} from 'lucide-react';
import { SubscriptionTierId } from '../../types';
import {
  COUNTRY_CURRENCIES,
  FALLBACK_EXCHANGE_RATES,
  convertFromUsd,
  detectDefaultCountryCode,
  formatCurrencyAmount,
} from '../../utils/currency';

export const PricingModal: React.FC = () => {
  const {
    pricingModalOpen,
    setPricingModalOpen,
    subscriptionTiers,
    currentUser,
    upgradeSubscription,
    monetization,
    paymentRequests,
    submitSubscriptionPaymentRequest,
    openAuthModal,
  } = useApp();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(() =>
    detectDefaultCountryCode()
  );
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(FALLBACK_EXCHANGE_RATES);
  const [rateSource, setRateSource] = useState<'live' | 'fallback'>('fallback');

  const [checkoutTierId, setCheckoutTierId] = useState<SubscriptionTierId | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'usdt_trc20'>('momo');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const screenshotInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pricingModalOpen) return;
    fetch('/api/exchange-rates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.rates) {
          setExchangeRates(data.rates);
          setRateSource(data.source === 'live' ? 'live' : 'fallback');
        }
      })
      .catch(() => {});
  }, [pricingModalOpen]);

  useEffect(() => {
    if (currentUser?.countryCode) {
      setSelectedCountryCode(currentUser.countryCode);
    }
    if (currentUser?.name && !senderName) {
      setSenderName(currentUser.name);
    }
  }, [currentUser, checkoutTierId, pricingModalOpen]);

  if (!pricingModalOpen) return null;

  const paymentDestination = monetization.subscriptionPaymentPhone || '+250781301598';
  const usdtTrc20Address =
    monetization.usdtTrc20Address || 'TAVQFaWipQzMamBjhAKiU83d67gTYKc1wK';
  const localDialNumber = paymentDestination.startsWith('+250')
    ? `0${paymentDestination.slice(4)}`
    : paymentDestination;

  const countryOption =
    COUNTRY_CURRENCIES.find((c) => c.countryCode === selectedCountryCode) ||
    COUNTRY_CURRENCIES[0];

  const userPendingRequest = currentUser
    ? paymentRequests.find((r) => r.userId === currentUser.id && r.status === 'pending')
    : undefined;

  const checkoutTier = checkoutTierId
    ? subscriptionTiers.find((t) => t.id === checkoutTierId)
    : undefined;

  const handleClose = () => {
    setCheckoutTierId(null);
    setFormError(null);
    setPricingModalOpen(false);
  };

  const handleSelectTier = (tierId: SubscriptionTierId) => {
    if (!currentUser) {
      handleClose();
      openAuthModal('signup');
      return;
    }
    if (tierId === 'free') {
      upgradeSubscription('free');
      return;
    }
    setFormError(null);
    setCheckoutTierId(tierId);
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(paymentDestination);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(usdtTrc20Address);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleScreenshotSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid screenshot image (PNG, JPG, WebP).');
      return;
    }

    setFormError(null);
    setIsUploadingScreenshot(true);
    setScreenshotFileName(file.name);

    try {
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: {
          'x-file-name': encodeURIComponent(file.name),
          'Content-Type': file.type || 'image/png',
        },
        body: file,
      });
      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
      }
      const data = await res.json();
      if (data.success && data.url) {
        setScreenshotUrl(data.url);
      } else {
        throw new Error('Could not save screenshot.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to upload screenshot. Please try again.');
      setScreenshotFileName('');
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTierId || !checkoutTier) return;

    if (isUploadingScreenshot) {
      setFormError('Please wait until the screenshot finishes uploading.');
      return;
    }

    const usdAmount =
      billingCycle === 'monthly' ? checkoutTier.priceMonthly : checkoutTier.priceYearly;
    const localAmount = convertFromUsd(usdAmount, countryOption.currency, exchangeRates);
    const rwfAmount = convertFromUsd(usdAmount, 'RWF', exchangeRates);

    const result = submitSubscriptionPaymentRequest({
      tierId: checkoutTierId,
      billingCycle,
      paymentMethod,
      senderPhone,
      senderName,
      screenshotUrl,
      transactionId,
      countryName: countryOption.countryName,
      localCurrency: countryOption.currency,
      localAmount,
      rwfAmount,
      usdtAmount: usdAmount,
      note,
    });

    if (!result.success) {
      setFormError(result.error || 'Could not submit payment proof.');
      return;
    }

    setCheckoutTierId(null);
    setSenderPhone('');
    setSenderName('');
    setScreenshotUrl('');
    setScreenshotFileName('');
    setTransactionId('');
    setNote('');
    setFormError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" />
              <span>
                {checkoutTier
                  ? paymentMethod === 'usdt_trc20'
                    ? `Pay for ${checkoutTier.name} via Bitcoin / Crypto (USDT TRC-20)`
                    : `Pay for ${checkoutTier.name} via Rwanda Mobile Money`
                  : 'Stream HUB Tiers & Subscription Plans'}
              </span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              {checkoutTier
                ? paymentMethod === 'usdt_trc20'
                  ? `Send exact USDT (TRC-20) to ${usdtTrc20Address} or switch to Rwanda Mobile Money.`
                  : `Prices automatically convert from your country's currency to the exact Rwanda (RWF) amount due on ${paymentDestination}.`
                : 'Pay via Rwanda Mobile Money (+250781301598) or Bitcoin / Crypto USDT (TRC-20) with instant local currency conversion.'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pending Review Banner */}
        {userPendingRequest && !checkoutTier && (
          <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-xs text-amber-200">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Your <strong>{userPendingRequest.requestedTier.toUpperCase()}</strong> ({userPendingRequest.billingCycle}) payment of{' '}
                <strong className="font-mono">
                  {userPendingRequest.paymentMethod === 'usdt_trc20'
                    ? `${(userPendingRequest.usdtAmount ?? userPendingRequest.amount).toFixed(2)} USDT (TRC-20)`
                    : userPendingRequest.rwfAmount
                    ? `${userPendingRequest.rwfAmount.toLocaleString()} RWF`
                    : `$${userPendingRequest.amount.toFixed(2)}`}
                </strong>{' '}
                from <strong>{userPendingRequest.senderName}</strong> ({userPendingRequest.senderPhone}) to{' '}
                <strong className="font-mono">{userPendingRequest.recipientNumber}</strong> is awaiting Admin Payment Review.
              </span>
            </div>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300 shrink-0">
              Pending
            </span>
          </div>
        )}

        {/* Billing Cadence & Country Currency Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950/40 px-6 py-3">
          <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-md px-3.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-md px-3.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Annual Billing (Save 18%)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
            <label className="text-neutral-400 font-medium">Your Country:</label>
            <select
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
            >
              {COUNTRY_CURRENCIES.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.countryName} ({c.currency})
                </option>
              ))}
            </select>
            <span className="hidden sm:inline rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
              {rateSource === 'live' ? 'Live FX' : 'FX Ready'}
            </span>
          </div>
        </div>

        {/* VIEW 1: TIERS SELECTION */}
        {!checkoutTier ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            {subscriptionTiers
              .filter((t) => t.active)
              .map((tier) => {
              const isCurrent = currentUser?.subscriptionTier === tier.id;
              const usdPrice = billingCycle === 'monthly' ? tier.priceMonthly : tier.priceYearly;
              const localPrice = convertFromUsd(usdPrice, countryOption.currency, exchangeRates);
              const rwfPrice = convertFromUsd(usdPrice, 'RWF', exchangeRates);

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

                    <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                        {usdPrice === 0
                          ? formatCurrencyAmount(0, countryOption.currency)
                          : formatCurrencyAmount(localPrice, countryOption.currency)}
                      </span>
                      <span className="text-xs text-neutral-400">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>

                    {usdPrice > 0 && (
                      <div className="mt-1 space-y-0.5 text-[11px] font-mono">
                        <p className="text-emerald-400">
                          Rwanda MoMo: {rwfPrice.toLocaleString()} RWF
                        </p>
                        <p className="text-amber-400">
                          Crypto / USDT (TRC-20): {usdPrice.toFixed(2)} USDT
                        </p>
                      </div>
                    )}

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

                  <div className="pt-4 border-t border-neutral-800 space-y-2">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 py-2.5 text-xs font-semibold text-neutral-400 cursor-default"
                      >
                        Current Plan
                      </button>
                    ) : tier.id === 'free' ? (
                      <button
                        onClick={() => handleSelectTier(tier.id)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-all cursor-pointer"
                      >
                        Switch to {tier.name}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setPaymentMethod('momo');
                            handleSelectTier(tier.id);
                          }}
                          className={`w-full rounded-lg py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                            tier.recommended
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30 hover:bg-rose-500'
                              : 'border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800'
                          }`}
                        >
                          Pay {rwfPrice.toLocaleString()} RWF (MoMo)
                        </button>
                        <button
                          onClick={() => {
                            setPaymentMethod('usdt_trc20');
                            handleSelectTier(tier.id);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 py-2 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
                        >
                          <Bitcoin className="h-3.5 w-3.5" />
                          <span>Pay {usdPrice.toFixed(2)} USDT (TRC-20)</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VIEW 2: CURRENCY CONVERSION + RWANDA MOBILE MONEY GUIDE + PROOF FORM */
          (() => {
            const usdAmount =
              billingCycle === 'monthly'
                ? checkoutTier.priceMonthly
                : checkoutTier.priceYearly;
            const localAmount = convertFromUsd(
              usdAmount,
              countryOption.currency,
              exchangeRates
            );
            const rwfAmount = convertFromUsd(usdAmount, 'RWF', exchangeRates);

            return (
              <form onSubmit={handleSubmitPayment} className="p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutTierId(null);
                      setFormError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Subscription Plans</span>
                  </button>

                  {/* Payment Method Switcher */}
                  <div className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('momo');
                        setFormError(null);
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        paymentMethod === 'momo'
                          ? 'bg-emerald-600 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Rwanda MoMo ({paymentDestination})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('usdt_trc20');
                        setFormError(null);
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        paymentMethod === 'usdt_trc20'
                          ? 'bg-amber-600 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Bitcoin className="h-3.5 w-3.5" />
                      <span>Bitcoin / USDT (TRC-20)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* LEFT COLUMN: Currency Conversion + Payment Guide (MoMo OR USDT TRC-20) */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Currency Conversion Summary */}
                    <div
                      className={`rounded-xl border p-4 space-y-3 ${
                        paymentMethod === 'usdt_trc20'
                          ? 'border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-neutral-950 to-neutral-950'
                          : 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-neutral-950 to-neutral-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            paymentMethod === 'usdt_trc20' ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                          <span>Converted Payment Amount ({countryOption.countryName})</span>
                        </span>
                        <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-300">
                          {checkoutTier.name} · {billingCycle}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-3">
                          <p className="text-[10px] uppercase text-neutral-400">
                            Price in {countryOption.countryName}
                          </p>
                          <p className="font-mono text-lg font-extrabold text-white mt-0.5 tabular-nums">
                            {formatCurrencyAmount(localAmount, countryOption.currency)}
                          </p>
                          <p className="text-[10px] text-neutral-500 font-mono">
                            Base: ${usdAmount.toFixed(2)} USD
                          </p>
                        </div>

                        {paymentMethod === 'usdt_trc20' ? (
                          <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-3">
                            <p className="text-[10px] uppercase text-amber-300 font-semibold">
                              Exact Crypto Amount (TRC-20)
                            </p>
                            <p className="font-mono text-lg font-extrabold text-amber-400 mt-0.5 tabular-nums">
                              {usdAmount.toFixed(2)} USDT
                            </p>
                            <p className="text-[10px] text-amber-300/80">
                              Network: TRON (TRC-20)
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3">
                            <p className="text-[10px] uppercase text-emerald-300 font-semibold">
                              Equal Amount in Rwanda (RWF)
                            </p>
                            <p className="font-mono text-lg font-extrabold text-emerald-400 mt-0.5 tabular-nums">
                              {rwfAmount.toLocaleString()} RWF
                            </p>
                            <p className="text-[10px] text-emerald-300/80">
                              Send this exact RWF value
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {paymentMethod === 'usdt_trc20' ? (
                      /* Step-by-Step Bitcoin / Crypto USDT TRC-20 Payment Guide */
                      <div className="rounded-xl border border-amber-500/30 bg-neutral-950/80 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <Bitcoin className="h-3.5 w-3.5" />
                            <span>Guide: Pay via Bitcoin / Crypto (USDT TRC-20)</span>
                          </span>
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                            TRON TRC-20
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-[10px] text-neutral-400 uppercase">
                              USDT (TRC-20) Wallet Address
                            </p>
                            <p className="font-mono text-xs sm:text-sm font-bold text-amber-400 break-all">
                              {usdtTrc20Address}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyWallet}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
                          >
                            {copiedWallet ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <ol className="space-y-2 text-[11px] text-neutral-300 leading-relaxed list-decimal list-inside">
                          <li>
                            <strong className="text-white">Open Your Crypto Wallet or Exchange:</strong>{' '}
                            Launch Binance, Trust Wallet, OKX, Bybit, TronLink, or your preferred Bitcoin/crypto wallet.
                          </li>
                          <li>
                            <strong className="text-white">Select USDT &amp; Network TRC-20:</strong>{' '}
                            Choose <strong className="text-amber-300">USDT</strong> and make sure the transfer network is set strictly to{' '}
                            <code className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-amber-300">
                              TRON (TRC-20)
                            </code>.
                          </li>
                          <li>
                            <strong className="text-white">Send Exact Amount:</strong>{' '}
                            Transfer <strong className="font-mono text-amber-400">{usdAmount.toFixed(2)} USDT</strong>{' '}
                            (equal to {formatCurrencyAmount(localAmount, countryOption.currency)}) to{' '}
                            <strong className="font-mono text-white break-all">{usdtTrc20Address}</strong>.
                          </li>
                          <li>
                            <strong className="text-white">Upload Screenshot &amp; TXID:</strong>{' '}
                            Screenshot your completed transaction confirmation, paste your sender wallet address &amp; TXID on the right, and submit for Admin approval.
                          </li>
                        </ol>
                      </div>
                    ) : (
                      /* Step-by-Step Rwanda Mobile Money Payment Guide */
                      <div className="rounded-xl border border-rose-500/30 bg-neutral-950/80 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            <span>Guide: How to Pay via Rwanda Mobile Money</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5">
                          <div>
                            <p className="text-[10px] text-neutral-400 uppercase">
                              Send Mobile Money To (Rwanda)
                            </p>
                            <p className="font-mono text-base font-bold text-emerald-400">
                              {paymentDestination}{' '}
                              <span className="text-xs text-neutral-400 font-normal">
                                (Local: {localDialNumber})
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyPhone}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
                          >
                            {copiedPhone ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <ol className="space-y-2 text-[11px] text-neutral-300 leading-relaxed list-decimal list-inside">
                          <li>
                            <strong className="text-white">In Rwanda (MTN MoMo):</strong> Dial{' '}
                            <code className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-amber-300">
                              *182*1*1#
                            </code>{' '}
                            (or open the MTN MoMo App → Send Money), enter{' '}
                            <strong className="font-mono text-emerald-400">{localDialNumber}</strong>, enter{' '}
                            <strong className="font-mono text-white">
                              {rwfAmount.toLocaleString()} RWF
                            </strong>
                            , confirm recipient name, and enter your PIN.
                          </li>
                          <li>
                            <strong className="text-white">In Rwanda (Airtel Money):</strong> Dial{' '}
                            <code className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-amber-300">
                              *500*1#
                            </code>{' '}
                            → Send to Mobile Money → enter{' '}
                            <strong className="font-mono text-emerald-400">{localDialNumber}</strong> and{' '}
                            <strong className="font-mono text-white">
                              {rwfAmount.toLocaleString()} RWF
                            </strong>
                            .
                          </li>
                          <li>
                            <strong className="text-white">Outside Rwanda ({countryOption.countryName}):</strong>{' '}
                            Use your Mobile Money International transfer / Remittance app to send to Rwanda{' '}
                            <strong className="font-mono text-emerald-400">{paymentDestination}</strong>{' '}
                            so the recipient receives{' '}
                            <strong className="font-mono text-white">
                              {rwfAmount.toLocaleString()} RWF
                            </strong>{' '}
                            (equal to {formatCurrencyAmount(localAmount, countryOption.currency)}).
                          </li>
                          <li>
                            <strong className="text-white">Take a Screenshot:</strong> Capture the confirmation SMS or app receipt, then submit the sender details & screenshot on the right.
                          </li>
                        </ol>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Sender Details + Screenshot Upload */}
                  <div className="lg:col-span-6 rounded-xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-4">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                      {paymentMethod === 'usdt_trc20'
                        ? 'Submit USDT (TRC-20) Transfer Proof for Admin Review'
                        : 'Submit Mobile Money Proof for Admin Review'}
                    </span>

                    {formError && (
                      <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                        {formError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        {paymentMethod === 'usdt_trc20'
                          ? "Sender's Wallet Address / Contact *"
                          : "Sender's Phone Number *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder={
                          paymentMethod === 'usdt_trc20'
                            ? 'Your TRC-20 wallet address (T...) or phone'
                            : '+25078... or your local MoMo number'
                        }
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white font-mono placeholder-neutral-500 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        {paymentMethod === 'usdt_trc20'
                          ? "Sender's Full Names / Exchange Account *"
                          : "Sender's Full Names (MoMo Account Name) *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="e.g. Jean Paul Mugisha"
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Payment Screenshot *
                      </label>
                      <input
                        ref={screenshotInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleScreenshotSelected(file);
                        }}
                        className="hidden"
                      />

                      <div
                        onClick={() => screenshotInputRef.current?.click()}
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900/70 p-4 text-center hover:border-rose-500/60 transition-colors cursor-pointer"
                      >
                        {screenshotUrl ? (
                          <div className="w-full space-y-2">
                            <img
                              src={screenshotUrl}
                              alt="Payment screenshot preview"
                              className="mx-auto max-h-36 rounded-lg border border-neutral-700 object-contain"
                            />
                            <p className="text-[11px] text-emerald-400 font-medium flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Uploaded: {screenshotFileName || 'Payment Screenshot'} (Click to replace)</span>
                            </p>
                          </div>
                        ) : (
                          <>
                            {isUploadingScreenshot ? (
                              <Upload className="h-6 w-6 text-rose-400 animate-bounce mb-1.5" />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-rose-400 mb-1.5" />
                            )}
                            <p className="text-xs font-semibold text-white">
                              {isUploadingScreenshot
                                ? 'Uploading screenshot...'
                                : paymentMethod === 'usdt_trc20'
                                ? 'Click to upload USDT TRC-20 transfer screenshot'
                                : 'Click to upload Mobile Money screenshot'}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              PNG, JPG, or WebP confirmation screen
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          {paymentMethod === 'usdt_trc20'
                            ? 'TXID / Transaction Hash'
                            : 'Transaction ID (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder={
                            paymentMethod === 'usdt_trc20'
                              ? 'e.g. 9f2a8c... (TRON TXID)'
                              : 'e.g. MOMO-98341205'
                          }
                          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white font-mono placeholder-neutral-500 focus:border-rose-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1">
                          Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Any extra remark..."
                          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUploadingScreenshot}
                      className={`w-full rounded-lg py-2.5 text-xs font-bold text-white shadow-lg disabled:opacity-50 transition-colors cursor-pointer ${
                        paymentMethod === 'usdt_trc20'
                          ? 'bg-amber-600 shadow-amber-900/30 hover:bg-amber-500'
                          : 'bg-rose-600 shadow-rose-900/30 hover:bg-rose-500'
                      }`}
                    >
                      {isUploadingScreenshot
                        ? 'Uploading Screenshot...'
                        : paymentMethod === 'usdt_trc20'
                        ? `Submit ${usdAmount.toFixed(2)} USDT (TRC-20) Payment for Review`
                        : `Submit ${rwfAmount.toLocaleString()} RWF Payment for Review`}
                    </button>
                  </div>
                </div>
              </form>
            );
          })()
        )}

        {/* Footer Guarantee */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 bg-neutral-950 px-6 py-3.5 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>
              Rwanda MoMo: <strong className="text-neutral-300 font-mono">{paymentDestination}</strong> · USDT TRC-20: <strong className="text-amber-300 font-mono">{usdtTrc20Address}</strong>
            </span>
          </div>
          <span className="text-[11px]">Stream HUB Subscriptions</span>
        </div>
      </div>
    </div>
  );
};
