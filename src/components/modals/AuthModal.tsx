import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ADMIN_CREDENTIALS } from '../../data/initialData';
import { X, Lock, Mail, User as UserIcon, Calendar, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { SubscriptionTierId } from '../../types';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    loginUser,
    signupUser,
    loginAdmin,
  } = useApp();

  // Form states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpBirthDate, setSignUpBirthDate] = useState('2001-05-15');
  const [signUpTier, setSignUpTier] = useState<SubscriptionTierId>('free');

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!authModalOpen) return null;

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
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        
        {/* Header with Close */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            {authModalTab === 'admin' ? (
              <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm">
                <Shield className="h-4 w-4" />
                <span>Authorized Personnel Portal</span>
              </div>
            ) : (
              <span className="font-heading text-base font-bold text-white">
                {authModalTab === 'signup' ? 'Create Streaming Account' : 'Sign In to PascalHub'}
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

        {/* Tab switchers - For regular users: Sign In / Create Account.
            Admin tab is rendered if opened directly via shortcut / footer link */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 p-1">
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

          {/* Admin tab only visible if explicitly on admin mode */}
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
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
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

          {/* TAB 2: USER SIGN UP */}
          {authModalTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <p className="text-xs text-neutral-400">
                Create a quick account to stream videos across all 7 categories and save favorites.
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

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Date of Birth (For 18+ Mature Age Verification)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="date"
                    required
                    value={signUpBirthDate}
                    onChange={(e) => setSignUpBirthDate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-3 text-xs text-neutral-100 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[10px] text-neutral-500">
                  Required to legally unlock Channel 7: 18+ Mature content.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-900/40 hover:from-rose-500 hover:to-rose-600 transition-all"
                >
                  {isSubmitting ? 'Creating Account...' : 'Complete Registration & Watch'}
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
