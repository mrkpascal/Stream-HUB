import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, MessageCircle, Send, ExternalLink, BellRing, Play } from 'lucide-react';

export const CommunityPopupModal: React.FC = () => {
  const { communityPopupOpen, setCommunityPopupOpen, siteConfig } = useApp();

  return (
    <>
      {/* Persistent Quick-Open Floating Launcher when Popup is Closed */}
      {!communityPopupOpen && (
        <button
          type="button"
          onClick={() => setCommunityPopupOpen(true)}
          aria-label="Open WhatsApp Updates & Telegram Comments Links"
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-emerald-500/40 bg-neutral-900/95 px-3.5 py-2 text-xs font-semibold text-white shadow-2xl shadow-black/60 backdrop-blur-md hover:border-emerald-400 hover:bg-neutral-800 transition-all cursor-pointer"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
            <MessageCircle className="h-3 w-3" />
          </span>
          <span className="hidden sm:inline">WhatsApp &amp; Telegram</span>
          <span className="sm:hidden">Community</span>
        </button>
      )}

      {/* Community Links Popup Modal */}
      {communityPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setCommunityPopupOpen(false)}
              aria-label="Close popup"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              {siteConfig.siteLogoUrl ? (
                <img
                  src={siteConfig.siteLogoUrl}
                  alt={siteConfig.siteName}
                  className="h-9 w-9 rounded-xl object-cover border border-neutral-700 shadow-lg"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-amber-500 text-white shadow-lg shadow-rose-900/30">
                  <Play className="h-4 w-4 fill-white" />
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  {siteConfig.siteName} · {siteConfig.siteSlogan}
                </p>
                <h2 className="font-heading text-base font-bold text-white">
                  {siteConfig.communityPopupTitle}
                </h2>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-5">
              {siteConfig.communityPopupDescription}
            </p>

            <div className="space-y-3">
              {/* WhatsApp Channel Card */}
              <a
                href={siteConfig.whatsappChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 hover:border-emerald-400 hover:bg-emerald-900/35 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        WhatsApp Updates Channel
                      </span>
                      <BellRing className="h-3 w-3 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-emerald-300/90 truncate">
                      Follow {siteConfig.siteName} Updates on WhatsApp
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white group-hover:bg-emerald-500 transition-colors">
                  <span>Follow</span>
                  <ExternalLink className="h-3 w-3" />
                </span>
              </a>

              {/* Telegram Group Card */}
              <a
                href={siteConfig.telegramGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 rounded-xl border border-sky-500/40 bg-sky-950/30 p-3.5 hover:border-sky-400 hover:bg-sky-900/35 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow">
                    <Send className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white">
                      Telegram Followers Comments
                    </span>
                    <p className="text-[11px] text-sky-300/90 truncate">
                      Chat, react &amp; drop comments with followers
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-bold text-white group-hover:bg-sky-500 transition-colors">
                  <span>Join</span>
                  <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-neutral-800/80 pt-4">
              <span className="text-[10px] text-neutral-500">
                Opens safely in a new browser tab
              </span>
              <button
                type="button"
                onClick={() => setCommunityPopupOpen(false)}
                className="rounded-lg bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Continue to Stream HUB
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
