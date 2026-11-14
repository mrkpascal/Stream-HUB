import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ADMIN_CREDENTIALS } from '../../data/initialData';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Calendar,
  Shield,
  AlertCircle,
  Globe,
  Crown,
  ArrowRightLeft,
} from 'lucide-react';
import { SubscriptionTierId } from '../../types';
import {
  COUNTRY_CURRENCIES,
  FALLBACK_EXCHANGE_RATES,
  convertFromUsd,
  detectDefaultCountryCode,
  formatCurrencyAmount,
} from '../../utils/currency';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    loginUser,
    signupUser,
    loginAdmin,
    subscriptionTiers,
    monetization,
  } = useApp();

  // Form states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpBirthDate, setSignUpBirthDate] = useState('2001-05-15');
  const [signUpCountryCode, setSignUpCountryCode] = useState<string>(() =>
    detectDefaultCountryCode()
  );
  const [signUpTier, setSignUpTier] = useState<SubscriptionTierId>('free');
  const [signUpBillingCycle, setSignUpBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(FALLBACK_EXCHANGE_RATES);
  const [rateSource, setRateSource] = useState<'live' | 'fallback'>('fallback');

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authModalOpen || authModalTab !== 'signup') return;
    fetch('/api/exchange-rates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.rates) {
          setExchangeRates(data.rates);
          setRateSource(data.source === 'live' ? 'live' : 'fallback');
        }
      })
      .catch(() => {});
  }, [authModalOpen, authModalTab]);

  if (!authModalOpen) return null;

  const selectedCountry =
    COUNTRY_CURRENCIES.find((c) => c.countryCode === signUpCountryCode) || COUNTRY_CURRENCIES[0];

  const selectedTierObj =
    subscriptionTiers.find((t) => t.id === signUpTier) || subscriptionTiers[0];

  const selectedUsdPrice = selectedTierObj
    ? signUpBillingCycle === 'monthly'
      ? selectedTierObj.priceMonthly
      : selectedTierObj.priceYearly
    : 0;

  const calculatedLocalAmount = convertFromUsd(
    selectedUsdPrice,
    selectedCountry.currency,
    exchangeRates
  );
  const calculatedRwfAmount = convertFromUsd(selectedUsdPrice, 'RWF', exchangeRates);
  const paymentDestination = monetization.subscriptionPaymentPhone || '+250781301598';
  const usdtTrc20Address =
    monetization.usdtTrc20Address || 'TAVQFaWipQzMamBjhAKiU83d67gTYKc1wK';

  const handleClose = () => {
    setErrorMessage(null);
    setAuthModalOpen(false);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = loginUser(signInEmail, signInPassword);
    setIsSubmitting(false);
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to sign in.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    const result = signupUser({
      name: signUpName,
      email: signUpEmail,
      pass: signUpPassword,
      birthDate: signUpBirthDate,
      tier: signUpTier,
      countryCode: signUpCountryCode,
    });
    setIsSubmitting(false);
    if (!result.success) {
      setErrorMessage(result.error || 'Registration failed.');
    }
  };

  const handleAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = loginAdmin(adminEmail, adminPassword);
    setIsSubmitting(false);
    if (!result.success) {
      setErrorMessage(result.error || 'Access denied. Incorrect administrator credentials.');
    }
  };

  const fillAdminCredentials = () => {
    setAdminEmail(ADMIN_CREDENTIALS.email);
    setAdminPassword(ADMIN_CREDENTIALS.password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Header with Close */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            {authModalTab === 'admin' ? (
              <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm">
                <Shield className="h-4 w-4" />
                <span>Authorized Personnel Portal</span>
              </div>
            ) : (
              <span className="font-heading text-base font-bold text-white">
                {authModalTab === 'signup' ? 'Create Streaming Account' : 'Sign In to Stream HUB'}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex shrink-0 border-b border-neutral-800 bg-neutral-950/60 p-1">
          <button
            onClick={() => {
              setErrorMessage(null);
              setAuthModalTab('signin');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              authModalTab === 'signin'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setErrorMessage(null);
              setAuthModalTab('signup');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              authModalTab === 'signup'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Account
          </button>

          {authModalTab === 'admin' && (
            <button
              onClick={() => setAuthModalTab('admin')}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30"
            >
              Admin Portal
            </button>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 flex shrink-0 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6">
          {/* TAB 1: USER SIGN IN */}
          {authModalTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-100 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-100 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-900/30 hover:bg-rose-500 transition-colors"
                >
                  {isSubmitting ? 'Verifying...' : 'Sign In & Start Watching'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-neutral-500">
                <span>Account required before streaming videos.</span>
                <button
                  type="button"
                  onClick={() => setAuthModalTab('signup')}
                  className="text-rose-400 hover:underline"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: USER SIGN UP WITH COUNTRY & CURRENCY CALCULATOR */}
          {authModalTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <p className="text-xs text-neutral-400">
                Create your account to stream across all 9 channels, select your country, and preview subscription costs in your local currency.
              </p>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Full Name / Display Nickname
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="email"
                    required
                    placeholder="alex@domain.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="password"
                      required
                      placeholder="Min 6 chars"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="date"
                      required
                      value={signUpBirthDate}
                      onChange={(e) => setSignUpBirthDate(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Country Selection */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Country & Currency
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                  <select
                    value={signUpCountryCode}
                    onChange={(e) => setSignUpCountryCode(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-3 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  >
                    {COUNTRY_CURRENCIES.map((c) => (
                      <option key={c.countryCode} value={c.countryCode}>
                        {c.countryName} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subscription Plan Selection & Real-Time Currency Calculator */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/90 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-200">
                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                    <span>Select Plan ({selectedCountry.currency})</span>
                  </span>
                  <div className="flex items-center rounded-md border border-neutral-800 bg-neutral-900 p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSignUpBillingCycle('monthly')}
                      className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                        signUpBillingCycle === 'monthly'
                          ? 'bg-neutral-700 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignUpBillingCycle('yearly')}
                      className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                        signUpBillingCycle === 'yearly'
                          ? 'bg-neutral-700 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {subscriptionTiers
                    .filter((t) => t.active)
                    .map((tier) => {
                      const tierUsd =
                        signUpBillingCycle === 'monthly' ? tier.priceMonthly : tier.priceYearly;
                      const tierLocal = convertFromUsd(
                        tierUsd,
                        selectedCountry.currency,
                        exchangeRates
                      );
                      const isSelected = signUpTier === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setSignUpTier(tier.id)}
                          className={`rounded-lg border p-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 text-white'
                              : 'border-neutral-800 bg-neutral-900/70 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                          }`}
                        >
                          <div className="text-[11px] font-bold truncate">
                            {tier.id === 'free' ? 'Free' : tier.id === 'pro' ? 'Pro' : 'VIP'}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] font-semibold text-emerald-400 truncate">
                            {tierUsd === 0
                              ? '0 ' + selectedCountry.currency
                              : formatCurrencyAmount(tierLocal, selectedCountry.currency)}
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Calculated Country Currency & Equal Rwanda RWF Payment Box */}
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">
                      Amount in {selectedCountry.countryName}:
                    </span>
                    <span className="font-mono font-bold text-white">
                      {selectedUsdPrice === 0
                        ? `Free (0 ${selectedCountry.currency})`
                        : `${formatCurrencyAmount(calculatedLocalAmount, selectedCountry.currency)} / ${
                            signUpBillingCycle === 'monthly' ? 'mo' : 'yr'
                          }`}
                    </span>
                  </div>

                  {selectedUsdPrice > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-emerald-300">
                          <ArrowRightLeft className="h-3 w-3" />
                          <span>Equal Rwanda MoMo Pay:</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {calculatedRwfAmount.toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-300">Or Crypto (USDT TRC-20):</span>
                        <span className="font-mono font-bold text-amber-400">
                          {selectedUsdPrice.toFixed(2)} USDT
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 pt-0.5 leading-relaxed">
                        USD Base: ${selectedUsdPrice.toFixed(2)} ({rateSource} rate). Pay via Rwanda MoMo (<span className="font-mono text-white">{paymentDestination}</span>) or USDT TRC-20 (<span className="font-mono text-amber-300 break-all">{usdtTrc20Address}</span>).
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-neutral-400">
                      Free account includes standard streaming &amp; downloads across channels (upgrade anytime).
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-900/40 hover:from-rose-500 hover:to-rose-600 transition-all cursor-pointer"
                >
                  {isSubmitting
                    ? 'Creating Account...'
                    : signUpTier === 'free'
                    ? 'Complete Registration & Watch'
                    : `Create Account & Pay ${formatCurrencyAmount(
                        calculatedLocalAmount,
                        selectedCountry.currency
                      )}`}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: HIDDEN ADMIN LOGIN (Required: pascaltechhub@gmail.com / Admin@2026) */}
          {authModalTab === 'admin' && (
            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
                <p className="font-semibold text-rose-400">Strictly Restricted Staff Access</p>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Enter master administrative credentials to access video publishing, prompt ad control engine, and monetization analytics.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Admin Master Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="email"
                    required
                    placeholder="pascaltechhub@gmail.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-100 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Admin Master Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="password"
                    required
                    placeholder="Admin@2026"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-100 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-900/30 hover:bg-rose-500 transition-colors"
                >
                  {isSubmitting ? 'Authenticating Admin...' : 'Authenticate Master Admin'}
                </button>

                {/* Quick Autofill for convenience */}
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 text-[11px] font-medium text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors"
                >
                  Autofill Admin Credentials (pascaltechhub@gmail.com)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
