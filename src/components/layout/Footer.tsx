import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Play } from 'lucide-react';

export const Footer: React.FC = () => {
  const { openAuthModal, setSelectedGroupId, setCurrentView } = useApp();

  return (
    <footer className="border-t border-neutral-900 bg-neutral-950 py-12 text-neutral-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Mission */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white">
                <Play className="h-3.5 w-3.5 fill-white" />
              </div>
              <span className="font-heading text-base font-bold text-white tracking-tight">
                PASCALHUB STREAM
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-500 max-w-sm">
              Next-generation video streaming platform powered by dynamic prompt-orchestrated ad distribution. High-fidelity encoding, strict age-gated vaults, and independent creator monetization.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-neutral-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Age Verification & 18+ Mature Content Safe Harbor Enforced</span>
            </div>
          </div>

          {/* 7 Channels Quick Select */}
          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-neutral-200">
              7 Channels
            </h4>
            <ul className="mt-3 space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => {
                    setSelectedGroupId('group-1');
                    setCurrentView('stream');
                  }}
                  className="hover:text-rose-400 transition-colors"
                >
                  01. Tech & AI Innovations
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedGroupId('group-2');
                    setCurrentView('stream');
                  }}
                  className="hover:text-rose-400 transition-colors"
                >
                  02. Gaming & Esports
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedGroupId('group-3');
                    setCurrentView('stream');
                  }}
                  className="hover:text-rose-400 transition-colors"
                >
                  03. Cinema & Short Films
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedGroupId('group-4');
                    setCurrentView('stream');
                  }}
                  className="hover:text-rose-400 transition-colors"
                >
                  04. Music & Live Concerts
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Vaults & Tiers
            </h4>
            <ul className="mt-3 space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => {
                    setSelectedGroupId('group-5');
                    setCurrentView('stream');
                  }}
                  className="hover:text-rose-400 transition-colors"
                >
                  05. Documentaries
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedGroupId('group-6');
                    setCurrentView('stream');
                  }}
                  className="hover:text-rose-400 transition-colors"
                >
                  06. Lifestyle & Design
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedGroupId('group-7');
                    setCurrentView('stream');
                  }}
                  className="text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  07. 18+ Mature (Restricted)
                </button>
              </li>
              <li>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="hover:text-white transition-colors"
                >
                  User Registration
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Hidden Admin Entry */}
          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Compliance
            </h4>
            <ul className="mt-3 space-y-1.5 text-xs">
              <li>
                <span className="text-neutral-500">Terms of Streaming</span>
              </li>
              <li>
                <span className="text-neutral-500">COPPA & Age Verification</span>
              </li>
              <li>
                <span className="text-neutral-500">Advertiser Guidelines</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-neutral-900 pt-6 text-[11px] text-neutral-500 sm:flex-row">
          <p>© 2026 PascalHub Video & Ad Network. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Prompt Ad Orchestration</span>
            <span>·</span>
            <span>Zero Tracking Leakage</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
