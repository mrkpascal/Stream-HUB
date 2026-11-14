import React from 'react';
import { useApp } from '../../context/AppContext';
import { Video } from '../../types';
import { AdSenseUnit } from '../ads/AdSenseUnit';
import {
  Play,
  Bookmark,
  ShieldAlert,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  EyeOff,
  Crown,
  Lock,
  Download,
  Youtube,
  MessageCircle,
  Send,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { isYouTubeUrl } from '../../utils/youtube';

export const StreamView: React.FC = () => {
  const {
    videos,
    videoGroups,
    selectedGroupId,
    setSelectedGroupId,
    searchQuery,
    setSearchQuery,
    playVideoWithGate,
    downloadVideoWithGate,
    currentUser,
    isAdmin,
    toggleWatchlist,
    isVideo18PlusBlurred,
    setCommunityPopupOpen,
    siteConfig,
    setCurrentView,
    setAdminActiveTab,
  } = useApp();

  // Helper: channel display order index based on videoGroups
  const getGroupOrder = (groupId: string) => {
    const idx = videoGroups.findIndex((g) => g.id === groupId);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  // Filter videos by selected category tab and real-time search query, sorted by channel (newest uploads stay at the top of their channel)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredVideos = videos
    .filter((video) => {
      const matchesGroup = selectedGroupId === 'all' || video.groupId === selectedGroupId;
      if (!normalizedQuery) return matchesGroup;

      const group = videoGroups.find((g) => g.id === video.groupId);
      const matchesSearch =
        video.title.toLowerCase().includes(normalizedQuery) ||
        video.description.toLowerCase().includes(normalizedQuery) ||
        video.creatorName.toLowerCase().includes(normalizedQuery) ||
        video.tags.some((t) => t.toLowerCase().includes(normalizedQuery)) ||
        (group?.name.toLowerCase().includes(normalizedQuery) ?? false) ||
        (group?.slug.toLowerCase().includes(normalizedQuery) ?? false);
      return matchesGroup && matchesSearch;
    })
    .sort((a, b) => getGroupOrder(a.groupId) - getGroupOrder(b.groupId));

  // Featured hero video
  const heroVideo =
    filteredVideos.find((v) => v.featured) ||
    videos.find((v) => v.featured && (selectedGroupId === 'all' || v.groupId === selectedGroupId)) ||
    filteredVideos[0] ||
    videos[0];

  const activeGroup = videoGroups.find((g) => g.id === selectedGroupId);

  const renderVideoCard = (video: Video) => {
    const group = videoGroups.find((g) => g.id === video.groupId);
    const isSaved = currentUser?.savedWatchlist.includes(video.id);
    const isBlurred = isVideo18PlusBlurred(video);

    return (
      <div
        key={video.id}
        className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/40 transition-all hover:-translate-y-1 hover:border-neutral-700 hover:shadow-xl hover:shadow-black/50"
      >
        {/* Thumbnail Frame */}
        <div
          onClick={() => playVideoWithGate(video)}
          className="relative aspect-video w-full overflow-hidden bg-black cursor-pointer"
        >
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            referrerPolicy="no-referrer"
            className={`h-full w-full object-cover transition-transform duration-300 ${
              isBlurred
                ? 'blur-2xl scale-110 brightness-50'
                : 'group-hover:scale-105'
            }`}
          />

          {isBlurred ? (
            <div className="absolute inset-0 bg-black/45 backdrop-blur-md flex flex-col items-center justify-center p-3 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600/30 border border-red-500/40 text-red-300 mb-1.5">
                <EyeOff className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-300">
                18+ Blurred Vision
              </span>
              <span className="mt-0.5 text-[10px] text-neutral-300">
                {!currentUser ? 'Sign In & VIP Required' : 'VIP Plan Required'}
              </span>
            </div>
          ) : (
            /* Play Hover Overlay */
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg">
                <Play className="h-4 w-4 fill-white ml-0.5" />
              </div>
            </div>
          )}

          {/* Duration Tag */}
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
            {video.duration}
          </span>

          {/* 18+ Mature Badge or YouTube Sync Badge */}
          {video.is18Plus ? (
            <span className="absolute top-2 left-2 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow flex items-center gap-0.5">
              <ShieldAlert className="h-2.5 w-2.5" />
              <span>18+</span>
            </span>
          ) : isYouTubeUrl(video.videoUrl) ? (
            <span className="absolute top-2 left-2 rounded bg-red-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow flex items-center gap-0.5">
              <Youtube className="h-2.5 w-2.5" />
              <span>YouTube</span>
            </span>
          ) : null}

          {/* Required Tier Tag */}
          {video.requiredTier !== 'free' && (
            <span
              className={`absolute top-2 right-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                video.requiredTier === 'vip'
                  ? 'bg-amber-500/90 text-neutral-950'
                  : 'bg-indigo-600/90 text-white'
              }`}
            >
              {video.requiredTier}
            </span>
          )}
        </div>

        {/* Metadata Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mb-1">
              <span className="truncate">{group?.name}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{video.views.toLocaleString()} views</span>
            </div>

            <h3
              onClick={() => playVideoWithGate(video)}
              className="font-heading text-sm font-bold text-white line-clamp-2 hover:text-rose-400 transition-colors cursor-pointer"
            >
              {video.title}
            </h3>

            <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          </div>

          {/* Card Footer: Publisher & Quick Actions */}
          <div className="flex items-center justify-between border-t border-neutral-800/60 pt-3">
            <span className="text-[11px] font-medium text-neutral-300 truncate max-w-[130px]">
              {video.creatorName}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => downloadVideoWithGate(video)}
                title="Download Video"
                className="rounded-lg p-1.5 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
              </button>

              <button
                onClick={() => toggleWatchlist(video.id)}
                title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                className={`rounded-lg p-1.5 text-xs transition-colors cursor-pointer ${
                  isSaved
                    ? 'text-rose-400 hover:text-rose-300'
                    : 'text-neutral-500 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => playVideoWithGate(video)}
                className="rounded-lg bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-600 transition-colors cursor-pointer"
              >
                Watch
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Cinematic Hero Billboard (Only displayed when not deep searching) */}
      {!searchQuery && heroVideo && (
        <section className="relative overflow-hidden border-b border-neutral-800 bg-neutral-950">
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Hero Pitch */}
              <div className="lg:col-span-7 space-y-4 z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{siteConfig.heroBadgeText}</span>
                  </span>
                  {heroVideo.is18Plus && (
                    <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/30 flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>18+ RESTRICTED</span>
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">
                    Duration: {heroVideo.duration}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminActiveTab('site-editor');
                        setCurrentView('admin-dashboard');
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit Site Texts &amp; Images</span>
                    </button>
                  )}
                </div>

                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  {siteConfig.heroCustomTitle.trim() || heroVideo.title}
                </h1>

                <p className="text-sm text-neutral-300 max-w-xl leading-relaxed">
                  {siteConfig.heroCustomDescription.trim() || heroVideo.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
                  <span>Publisher: <strong className="text-white">{heroVideo.creatorName}</strong></span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">{heroVideo.views.toLocaleString()} views</span>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={() => playVideoWithGate(heroVideo)}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-rose-900/30 hover:from-rose-500 hover:to-rose-600 transition-all cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    <span>{siteConfig.heroWatchButtonText || 'Watch Full Premiere'}</span>
                  </button>

                  <button
                    onClick={() => toggleWatchlist(heroVideo.id)}
                    className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-xs font-semibold text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>Add to Watchlist</span>
                  </button>

                  <button
                    onClick={() => downloadVideoWithGate(heroVideo)}
                    className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-xs font-semibold text-neutral-200 hover:border-emerald-500/40 hover:bg-neutral-800 hover:text-emerald-400 transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Right Media Preview Card */}
              {(() => {
                const heroBlurred = isVideo18PlusBlurred(heroVideo);
                return (
                  <div className="lg:col-span-5 relative group">
                    <div
                      onClick={() => playVideoWithGate(heroVideo)}
                      className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl cursor-pointer"
                    >
                      <img
                        src={siteConfig.heroBannerImageUrl.trim() || heroVideo.thumbnailUrl}
                        alt={siteConfig.heroCustomTitle.trim() || heroVideo.title}
                        referrerPolicy="no-referrer"
                        className={`h-full w-full object-cover transition-transform duration-500 ${
                          heroBlurred
                            ? 'blur-2xl scale-110 brightness-50'
                            : 'group-hover:scale-105'
                        }`}
                      />
                      {heroBlurred ? (
                        <div className="absolute inset-0 bg-black/55 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center space-y-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/25 border border-red-500/40 text-red-400">
                            <EyeOff className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider text-red-300">
                            18+ Blurred Vision
                          </span>
                          <span className="text-[11px] text-neutral-300 max-w-xs">
                            {!currentUser
                              ? 'Sign in & subscribe to VIP All-Access to unblur 18+ content.'
                              : 'Locked for your current subscription. Upgrade to VIP All-Access to unblur.'}
                          </span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-center justify-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600/90 text-white shadow-xl backdrop-blur-sm transition-transform group-hover:scale-110">
                            <Play className="h-6 w-6 fill-white ml-0.5" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                        <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded font-mono">
                          {heroVideo.duration}
                        </span>
                        <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-semibold uppercase text-rose-400">
                          {heroVideo.requiredTier.toUpperCase()} TIER
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {/* Main Stream Catalog Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* The 7 Video Group Category Switchers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Filter className="h-4 w-4 text-rose-500" />
              <span>{siteConfig.channelsSectionTitle}</span>
            </h2>
            <span className="text-xs text-neutral-400">
              {videoGroups.length} Channels · {siteConfig.channelsSectionSubtitle}
            </span>
          </div>

          {/* Category Tabs: Clean Segmented Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {/* All channels button */}
            <button
              onClick={() => setSelectedGroupId('all')}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedGroupId === 'all'
                  ? 'bg-neutral-100 text-neutral-950 shadow'
                  : 'bg-neutral-900/80 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
            >
              All Channels ({videos.length})
            </button>

            {/* The 7 Explicit Groups */}
            {videoGroups.map((group) => {
              const isSelected = selectedGroupId === group.id;
              const count = videos.filter((v) => v.groupId === group.id).length;

              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? group.is18Plus
                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                        : 'bg-neutral-100 text-neutral-950 shadow'
                      : group.is18Plus
                      ? 'bg-neutral-900 text-red-400 border border-red-500/30 hover:bg-red-950/20'
                      : 'bg-neutral-900/80 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {group.is18Plus && <ShieldAlert className="h-3.5 w-3.5 shrink-0" />}
                  <span>{group.index}. {group.name}</span>
                  <span className="opacity-70 font-mono text-[11px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Description Banner (Highlights Group 7 warning or category pitch) */}
        {activeGroup && (
          <div
            className={`rounded-xl border p-4 transition-all ${
              activeGroup.is18Plus
                ? 'border-red-500/40 bg-red-950/20 text-red-200'
                : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-sm text-white">
                    Group {activeGroup.index}: {activeGroup.name}
                  </h3>
                  {activeGroup.is18Plus && (
                    <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      18+ VERIFICATION MANDATORY
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-neutral-400 max-w-2xl">
                  {activeGroup.description}
                </p>
              </div>

              {activeGroup.is18Plus && (
                <div className="shrink-0 flex items-center gap-2 text-xs text-red-400 font-medium">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Blurred for guests &amp; non-VIP plans · VIP + 18+ age gate required</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>
              Showing <strong className="text-white">{filteredVideos.length}</strong> streaming titles
              {searchQuery.trim() && (
                <>
                  {' '}matching <strong className="text-rose-400">"{searchQuery.trim()}"</strong>
                </>
              )}
            </span>
            {(searchQuery || selectedGroupId !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGroupId('all');
                }}
                className="text-rose-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {filteredVideos.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center space-y-3">
              <Search className="h-8 w-8 text-neutral-600 mx-auto" />
              <h4 className="font-heading text-base font-bold text-white">
                No videos found matching your filter
              </h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                No video titles, categories, or tags match "{searchQuery}". Try selecting another category or resetting the search input.
              </p>
              <button
                onClick={() => {
                  setSelectedGroupId('all');
                  setSearchQuery('');
                }}
                className="mt-2 rounded-lg bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
              >
                Show All Videos
              </button>
            </div>
          ) : selectedGroupId === 'all' ? (
            <div className="space-y-10">
              {videoGroups.map((group) => {
                const groupVideos = filteredVideos.filter((v) => v.groupId === group.id);
                if (groupVideos.length === 0) return null;

                return (
                  <section key={group.id} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: group.accentColor || '#f43f5e' }}
                        />
                        <h3 className="font-heading text-base font-bold text-white tracking-tight">
                          {group.index}. {group.name}
                        </h3>
                        <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 font-mono text-[11px] text-neutral-400">
                          {groupVideos.length} {groupVideos.length === 1 ? 'video' : 'videos'}
                        </span>
                        {group.is18Plus && (
                          <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            18+
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedGroupId(group.id)}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        Open Channel →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {groupVideos.map(renderVideoCard)}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map(renderVideoCard)}
            </div>
          )}
        </div>

        {/* Official WhatsApp Updates Channel & Telegram Followers Comments */}
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-emerald-950/30 via-neutral-900/90 to-sky-950/30 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-heading text-sm font-bold text-white tracking-tight">
              {siteConfig.communitySectionTitle}
            </h3>
            <p className="text-xs text-neutral-300 max-w-2xl">
              {siteConfig.communitySectionDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCommunityPopupOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <span>Pop-up Links</span>
            </button>
            <a
              href={siteConfig.whatsappChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Follow WhatsApp Updates</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
            <a
              href={siteConfig.telegramGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-2.5 text-xs font-bold text-sky-300 hover:bg-sky-500/25 transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>Telegram Followers Comments</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          </div>
        </div>

        {/* Google AdSense Display Slot (automatically suppressed on 18+ group and paid tiers) */}
        <AdSenseUnit
          format="horizontal"
          is18PlusContext={Boolean(activeGroup?.is18Plus)}
          label="Sponsored Display"
          className="mt-4"
        />
      </div>
    </div>
  );
};
