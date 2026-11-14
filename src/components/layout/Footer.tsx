import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Play, MessageCircle, Send, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const { openAuthModal, setSelectedGroupId, setCurrentView, videoGroups, siteConfig } = useApp();

  const firstColumnGroups = videoGroups.slice(0, 5);
  const secondColumnGroups = videoGroups.slice(5);

  return (
    <footer className="border-t border-neutral-900 bg-neutral-950 py-12 text-neutral-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Mission */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              {siteConfig.siteLogoUrl ? (
                <img
                  src={siteConfig.siteLogoUrl}
                  alt={siteConfig.siteName}
                  className="h-7 w-7 rounded-lg object-cover border border-neutral-700"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white">
                  <Play className="h-3.5 w-3.5 fill-white" />
                </div>
              )}
              <span className="font-heading text-base font-bold text-white tracking-tight">
                {siteConfig.siteName}
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-500 max-w-sm">
              <strong className="text-neutral-300">{siteConfig.siteSlogan}</strong> — {siteConfig.footerDescription}
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-neutral-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>{siteConfig.footerSafeHarborText}</span>
            </div>
          </div>

          {/* 9 Channels Quick Select */}
          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Channels
            </h4>
            <ul className="mt-3 space-y-1.5 text-xs">
              {firstColumnGroups.map((group) => (
                <li key={group.id}>
                  <button
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setCurrentView('stream');
                    }}
                    className={`transition-colors cursor-pointer ${
                      group.is18Plus
                        ? 'text-red-400 hover:text-red-300 font-medium'
                        : 'hover:text-rose-400'
                    }`}
                  >
                    {String(group.index).padStart(2, '0')}. {group.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-neutral-200">
              More & Vaults
            </h4>
            <ul className="mt-3 space-y-1.5 text-xs">
              {secondColumnGroups.map((group) => (
                <li key={group.id}>
                  <button
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setCurrentView('stream');
                    }}
                    className={`transition-colors cursor-pointer ${
                      group.is18Plus
                        ? 'text-red-400 hover:text-red-300 font-medium'
                        : 'hover:text-rose-400'
                    }`}
                  >
                    {String(group.index).padStart(2, '0')}. {group.name}
                    {group.is18Plus ? ' (Restricted)' : ''}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  User Registration
                </button>
              </li>
            </ul>
          </div>

          {/* Updates & Community */}
          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Updates &amp; Community
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a
                  href={siteConfig.whatsappChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>WhatsApp Updates Channel</span>
                  <ExternalLink className="h-3 w-3 opacity-75" />
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.telegramGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  <Send className="h-3.5 w-3.5 shrink-0" />
                  <span>Telegram Followers Comments</span>
                  <ExternalLink className="h-3 w-3 opacity-75" />
                </a>
              </li>
              <li className="pt-1">
                <span className="text-neutral-500">Terms of Streaming</span>
              </li>
              <li>
                <span className="text-neutral-500">COPPA & Age Verification</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-neutral-900 pt-6 text-[11px] text-neutral-500 sm:flex-row">
          <p>{siteConfig.footerCopyright}</p>
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
