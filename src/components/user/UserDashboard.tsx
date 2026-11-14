import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User as UserIcon,
  Crown,
  Bookmark,
  History,
  ShieldCheck,
  ShieldAlert,
  Play,
  Trash2,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const {
    currentUser,
    videos,
    videoGroups,
    subscriptionTiers,
    playVideoWithGate,
    toggleWatchlist,
    setPricingModalOpen,
    confirm18PlusConsent,
    userControls,
    setCurrentView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'watchlist' | 'history' | 'subscription'>('watchlist');

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="font-heading text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-neutral-400 mt-2">
          Please sign in to view your personalized dashboard, saved watchlist, and subscription tier.
        </p>
      </div>
    );
  }

  // Saved videos
  const savedVideos = videos.filter((v) => currentUser.savedWatchlist.includes(v.id));

  // History videos
  const historyItems = currentUser.watchHistory
    .map((item) => {
      const vid = videos.find((v) => v.id === item.videoId);
      return { ...item, video: vid };
    })
    .filter((item) => item.video);

  const currentTier = subscriptionTiers.find((t) => t.id === currentUser.subscriptionTier);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="h-16 w-16 rounded-full object-cover border-2 border-neutral-700 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-bold text-white tracking-tight">
                {currentUser.name}
              </h1>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                  currentUser.subscriptionTier === 'vip'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : currentUser.subscriptionTier === 'pro'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {currentUser.subscriptionTier} Plan
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{currentUser.email}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                {currentUser.age >= 18 ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">18+ Age Verified</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                    <span>Age: {currentUser.age} (Standard Catalog)</span>
                  </>
                )}
              </span>
              <span>·</span>
              <span>Member since {currentUser.createdAt}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPricingModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-neutral-950 shadow-lg shadow-amber-900/20 hover:brightness-110 transition-all cursor-pointer"
          >
            <Crown className="h-4 w-4" />
            <span>Manage / Upgrade Plan</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'watchlist'
              ? 'bg-rose-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Bookmark className="h-3.5 w-3.5" />
          <span>My Saved Watchlist ({savedVideos.length})</span>
        </button>

        {userControls.enableWatchHistory && (
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Watch History ({historyItems.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'subscription'
              ? 'bg-rose-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Plan & Ad-Free Status</span>
        </button>
      </div>

      {/* TAB 1: WATCHLIST */}
      {activeTab === 'watchlist' && (
        <div className="space-y-4">
          {savedVideos.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center space-y-3">
              <Bookmark className="h-8 w-8 text-neutral-600 mx-auto" />
              <h3 className="font-heading text-base font-bold text-white">
                Your Watchlist is Empty
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Explore the 7 video channels and click the bookmark icon on any stream to add it here.
              </p>
              <button
                onClick={() => setCurrentView('stream')}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Browse Streams
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedVideos.map((video) => {
                const group = videoGroups.find((g) => g.id === video.groupId);

                return (
                  <div
                    key={video.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/40 transition-all hover:border-neutral-700"
                  >
                    <div
                      onClick={() => playVideoWithGate(video)}
                      className="relative aspect-video w-full overflow-hidden bg-black cursor-pointer"
                    >
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] text-white">
                        {video.duration}
                      </span>
                      {video.is18Plus && (
                        <span className="absolute top-2 left-2 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          18+
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                          {group?.name}
                        </span>
                        <h4
                          onClick={() => playVideoWithGate(video)}
                          className="font-heading text-xs font-bold text-white line-clamp-2 hover:text-rose-400 cursor-pointer"
                        >
                          {video.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between border-t border-neutral-800/60 pt-3">
                        <button
                          onClick={() => playVideoWithGate(video)}
                          className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Watch</span>
                        </button>

                        <button
                          onClick={() => toggleWatchlist(video.id)}
                          className="text-neutral-500 hover:text-red-400 text-xs p-1"
                          title="Remove from saved"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WATCH HISTORY */}
      {activeTab === 'history' && userControls.enableWatchHistory && (
        <div className="space-y-3">
          {historyItems.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center text-xs text-neutral-400">
              No recent watch history recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => item.video && playVideoWithGate(item.video)}
                  className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 hover:border-neutral-700 hover:bg-neutral-800/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.video?.thumbnailUrl}
                      alt={item.video?.title}
                      className="h-12 w-20 rounded object-cover border border-neutral-800 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.video?.title}</h4>
                      <p className="text-[11px] text-neutral-400">
                        Watched on {item.watchedAt} · {item.video?.creatorName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-rose-400">Resume Playback →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION & TIER */}
      {activeTab === 'subscription' && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-6 max-w-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h3 className="font-heading text-base font-bold text-white">
                Current Subscription: {currentTier?.name}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {currentTier?.description}
              </p>
            </div>
            <span className="font-mono text-xl font-bold text-white">
              ${currentTier?.priceMonthly}/mo
            </span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Active Tier Privileges:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <span className="text-neutral-500 text-[11px]">Ad Status</span>
                <p className={`font-semibold mt-0.5 ${currentTier?.adFree ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {currentTier?.adFree ? '100% Ad-Free Streaming' : 'Ad-Supported Playback'}
                </p>
              </div>

              <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <span className="text-neutral-500 text-[11px]">Max Resolution</span>
                <p className="font-semibold text-white mt-0.5">
                  {currentTier?.maxQuality}
                </p>
              </div>

              <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <span className="text-neutral-500 text-[11px]">Channel 7 Access (18+)</span>
                <p className="font-semibold text-white mt-0.5">
                  {currentUser.isVerified18Plus ? 'Unlocked (18+ Verified)' : 'Restricted'}
                </p>
              </div>

              <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <span className="text-neutral-500 text-[11px]">Bandwidth Tier</span>
                <p className="font-semibold text-white mt-0.5">
                  Priority High Bitrate
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
            <p className="text-[11px] text-neutral-500">
              Simulated billing cycle renews on the 1st of every month.
            </p>
            <button
              onClick={() => setPricingModalOpen(true)}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
            >
              Change Tier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
