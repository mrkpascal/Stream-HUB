import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Video } from '../../types';
import { AdSenseUnit } from '../ads/AdSenseUnit';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Bookmark,
  ThumbsUp,
  Share2,
  ExternalLink,
  ShieldAlert,
  Clock,
  Sparkles,
  MessageSquare,
  Send,
  Sliders,
  Check,
} from 'lucide-react';

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const trimmed = url.trim();
    const ytWatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytWatch?.[1]) {
      return `https://www.youtube.com/embed/${ytWatch[1]}?autoplay=1&rel=0`;
    }
    const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo?.[1]) {
      return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
    }
  } catch {
    return null;
  }
  return null;
}

interface VideoPlayerProps {
  video: Video;
  onClose?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const {
    currentUser,
    isAdmin,
    videos,
    videoGroups,
    activeAd,
    adCountdown,
    canSkipAd,
    dismissCurrentAd,
    recordAdClick,
    toggleWatchlist,
    toggleLikeVideo,
    playVideoWithGate,
    userControls,
    monetization,
    setPricingModalOpen,
    showToast,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(video.durationSeconds || 120);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [speedDropdownOpen, setSpeedDropdownOpen] = useState<boolean>(false);
  const [hasCopiedShare, setHasCopiedShare] = useState<boolean>(false);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>(
    video.videoUrl || '/videos/demo-stream.mp4'
  );
  const [videoLoadError, setVideoLoadError] = useState<boolean>(false);

  // Comments state
  const [comments, setComments] = useState<
    { id: string; user: string; avatar: string; text: string; time: string; likes: number }[]
  >([
    {
      id: 'c-1',
      user: 'Sophia Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      text: 'The production quality here is breathtaking. Incredible lighting depth and audio mastering!',
      time: '3 hours ago',
      likes: 24,
    },
    {
      id: 'c-2',
      user: 'Liam Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      text: 'Streaming this in 4K UHD via VIP tier with zero compression artifacts. Flawless bitrate.',
      time: '6 hours ago',
      likes: 18,
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  // Group metadata
  const currentGroup = videoGroups.find((g) => g.id === video.groupId);
  const isSaved = currentUser?.savedWatchlist.includes(video.id);

  // Reset source state when active video changes
  useEffect(() => {
    setResolvedVideoUrl(video.videoUrl || '/videos/demo-stream.mp4');
    setVideoLoadError(false);
  }, [video.id, video.videoUrl]);

  // Video element handlers
  useEffect(() => {
    if (videoRef.current) {
      if (activeAd) {
        // Pause underlying video while pre-roll ad is active
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [resolvedVideoUrl, activeAd]);

  const handleVideoError = () => {
    if (resolvedVideoUrl !== '/videos/demo-stream.mp4') {
      setResolvedVideoUrl('/videos/demo-stream.mp4');
      setVideoLoadError(false);
    } else {
      setVideoLoadError(true);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (activeAd || videoLoadError) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeAd) return;
    const target = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setSpeedDropdownOpen(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setHasCopiedShare(true);
    showToast('Video URL copied to clipboard!');
    setTimeout(() => setHasCopiedShare(false), 2500);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) return;
    const newComment = {
      id: `c-${Date.now()}`,
      user: currentUser.name,
      avatar: currentUser.avatarUrl,
      text: newCommentText.trim(),
      time: 'Just now',
      likes: 1,
    };
    setComments([newComment, ...comments]);
    setNewCommentText('');
    showToast('Comment posted!');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Related videos from the same group
  const relatedVideos = videos
    .filter((v) => v.id !== video.id && (v.groupId === video.groupId || !v.is18Plus))
    .slice(0, 4);

  return (
    <div className={`mx-auto w-full transition-all ${isTheaterMode ? 'max-w-full' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Video & Ad Player Column */}
        <div className={`space-y-4 ${isTheaterMode ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          
          {/* Player Frame */}
          <div
            ref={containerRef}
            className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl border border-neutral-800"
          >
            {(() => {
              const embedUrl = getEmbedUrl(resolvedVideoUrl);
              if (embedUrl) {
                return activeAd ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover opacity-40"
                  />
                ) : (
                  <iframe
                    src={embedUrl}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                );
              }
              return (
                <>
                  {/* Underlying Video */}
                  <video
                    ref={videoRef}
                    src={resolvedVideoUrl}
                    poster={video.thumbnailUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    onError={handleVideoError}
                    onClick={togglePlay}
                    playsInline
                    className="h-full w-full object-cover cursor-pointer"
                  />

                  {videoLoadError && !activeAd && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/90 p-6 text-center">
                      <p className="text-sm font-semibold text-white">Unable to load stream source</p>
                      <p className="mt-1 text-xs text-neutral-400">
                        Please check the video URL or select another title from the catalog.
                      </p>
                    </div>
                  )}
                </>
              );
            })()}

            {/* AD OVERLAY SYSTEM: INJECTED ACCORDING TO ADMIN PROMPT CONFIGURATION */}
            {activeAd && (
              <div className="absolute inset-0 z-30 flex flex-col justify-between bg-black/90 p-6 animate-in fade-in duration-200">
                
                {/* Ad Top Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                      Ad · 1 of 1
                    </span>
                    <span className="text-xs text-neutral-300">
                      Promoted by <strong className="text-white">{activeAd.brandName}</strong>
                    </span>
                  </div>

                  {/* Skip Ad Button with Countdown */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono tabular-nums text-neutral-400">
                      Ends in {adCountdown}s
                    </span>
                    <button
                      onClick={dismissCurrentAd}
                      disabled={!canSkipAd}
                      className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                        canSkipAd
                          ? 'bg-white text-neutral-950 shadow-md hover:bg-neutral-200 cursor-pointer'
                          : 'bg-neutral-800/80 text-neutral-500 cursor-not-allowed border border-neutral-700/40'
                      }`}
                    >
                      {canSkipAd ? 'Skip Ad' : `Skip in ${adCountdown}s`}
                    </button>
                  </div>
                </div>

                {/* Ad Creative Centerpiece Generated From Admin Prompt */}
                <div className="my-auto max-w-xl mx-auto text-center space-y-3.5">
                  <div
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                      activeAd.themeColor === 'cyan'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : activeAd.themeColor === 'amber'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : activeAd.themeColor === 'rose'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : activeAd.themeColor === 'violet'
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    Prompt Ad Campaign
                  </div>

                  <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {activeAd.headline}
                  </h2>

                  <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                    {activeAd.tagline}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        recordAdClick(activeAd.id);
                        showToast(`Redirecting to ${activeAd.brandName}...`);
                        window.open(activeAd.ctaUrl, '_blank');
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-xl shadow-rose-900/30 hover:brightness-110 transition-all cursor-pointer"
                    >
                      <span>{activeAd.ctaText}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-[10px] text-neutral-500 italic">
                    Ad Prompt: "{activeAd.prompt}" · Non-paying tier sponsored stream
                  </p>
                </div>

                {/* Ad Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-1000"
                    style={{
                      width: `${((activeAd.durationSeconds - adCountdown) / activeAd.durationSeconds) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Custom Video Controls Bar (shown for direct/uploaded video files) */}
            {!activeAd && !getEmbedUrl(resolvedVideoUrl) && (
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {/* Scrubber Range */}
                <div className="mb-2 flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-neutral-700 accent-rose-500 focus:outline-none"
                  />
                </div>

                {/* Bottom Row Controls */}
                <div className="flex items-center justify-between text-neutral-200">
                  <div className="flex items-center gap-4">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="hover:text-white transition-colors focus:outline-none"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 fill-current" />
                      ) : (
                        <Play className="h-5 w-5 fill-current" />
                      )}
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                      <button onClick={toggleMute} className="hover:text-white">
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="h-1 w-16 cursor-pointer appearance-none rounded bg-neutral-600 accent-rose-500"
                      />
                    </div>

                    {/* Time Counter */}
                    <span className="font-mono text-xs tabular-nums text-neutral-300">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {/* Quality Indicator */}
                    <span className="rounded bg-neutral-800/80 px-2 py-0.5 text-[10px] font-semibold text-neutral-300 border border-neutral-700">
                      {currentUser?.subscriptionTier === 'vip'
                        ? '4K UHD'
                        : currentUser?.subscriptionTier === 'pro'
                        ? '1080p HD'
                        : '720p'}
                    </span>

                    {/* Playback Speed */}
                    <div className="relative">
                      <button
                        onClick={() => setSpeedDropdownOpen(!speedDropdownOpen)}
                        className="rounded px-1.5 py-0.5 text-[11px] font-mono hover:bg-neutral-800 transition-colors"
                      >
                        {playbackSpeed}x
                      </button>
                      {speedDropdownOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-20 rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
                          {[0.5, 1, 1.25, 1.5, 2].map((sp) => (
                            <button
                              key={sp}
                              onClick={() => handleSpeedChange(sp)}
                              className={`block w-full px-2 py-1 text-left text-xs font-mono hover:bg-neutral-800 ${
                                playbackSpeed === sp ? 'text-rose-400 font-bold' : 'text-neutral-300'
                              }`}
                            >
                              {sp}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Theater Mode */}
                    <button
                      onClick={() => setIsTheaterMode(!isTheaterMode)}
                      title="Toggle Theater Mode"
                      className="hidden sm:block hover:text-white"
                    >
                      <Sliders className="h-4 w-4" />
                    </button>

                    {/* Fullscreen */}
                    <button onClick={toggleFullscreen} className="hover:text-white">
                      {isFullscreen ? (
                        <Minimize className="h-4 w-4" />
                      ) : (
                        <Maximize className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video Metadata & Actions */}
          <div className="space-y-4 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {video.is18Plus && (
                <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  <span>18+ RESTRICTED</span>
                </span>
              )}
              <span className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
                {currentGroup?.name || 'Channel'}
              </span>
              <span className="text-xs text-neutral-500">·</span>
              <span className="text-xs text-neutral-400 font-mono tabular-nums">
                {video.views.toLocaleString()} views
              </span>
              <span className="text-xs text-neutral-500">·</span>
              <span className="text-xs text-neutral-400">Published {video.createdAt}</span>
            </div>

            <h1 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
              {video.title}
            </h1>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-neutral-800/80 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600/20 text-rose-400 font-bold border border-rose-500/30">
                  {video.creatorName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{video.creatorName}</h4>
                  <p className="text-[11px] text-neutral-400">Verified Platform Publisher</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Like Button */}
                <button
                  onClick={() => toggleLikeVideo(video.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
                >
                  <ThumbsUp className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="font-mono tabular-nums">{video.likes}</span>
                </button>

                {/* Watchlist Button */}
                <button
                  onClick={() => toggleWatchlist(video.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSaved
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  <span>{isSaved ? 'Saved' : 'Watchlist'}</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
                >
                  {hasCopiedShare ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                  <span>{hasCopiedShare ? 'Copied' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Description & Tags */}
            <p className="text-xs text-neutral-300 leading-relaxed">
              {video.description}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {video.tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded bg-neutral-800/80 px-2 py-0.5 text-[10px] text-neutral-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Comments Section */}
          {userControls.allowUserComments && (
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-neutral-400" />
                  <span>Discussion ({comments.length})</span>
                </h3>
                <span className="text-[11px] text-neutral-500">
                  Community guidelines enforced
                </span>
              </div>

              {/* Add Comment Input */}
              {currentUser ? (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Share your thoughts on this stream..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:border-rose-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <p className="text-xs text-neutral-500 italic">
                  Sign in to participate in the video discussion.
                </p>
              )}

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 text-xs">
                    <img
                      src={c.avatar}
                      alt={c.user}
                      className="h-7 w-7 rounded-full object-cover border border-neutral-700 shrink-0"
                    />
                    <div className="flex-1 bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white">{c.user}</span>
                        <span className="text-[10px] text-neutral-500">{c.time}</span>
                      </div>
                      <p className="text-neutral-300 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Up Next from Category & Sponsored Callout */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-white">
              More from {currentGroup?.name || 'Channel'}
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              {relatedVideos.length} titles
            </span>
          </div>

          <div className="space-y-3">
            {relatedVideos.map((item) => (
              <div
                key={item.id}
                onClick={() => playVideoWithGate(item)}
                className="group flex gap-3 rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-2.5 hover:border-neutral-700 hover:bg-neutral-800/60 transition-all cursor-pointer"
              >
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-black">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-mono text-white">
                    {item.duration}
                  </span>
                  {item.is18Plus && (
                    <span className="absolute top-1 left-1 rounded bg-red-600 px-1 py-0.5 text-[8px] font-bold text-white">
                      18+
                    </span>
                  )}
                </div>

                <div className="flex flex-col justify-between py-0.5">
                  <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-rose-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="text-[10px] text-neutral-400">
                    <p className="truncate">{item.creatorName}</p>
                    <p className="font-mono tabular-nums">{item.views.toLocaleString()} views</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Google AdSense Sidebar Unit */}
          <AdSenseUnit
            slotId={monetization.adsenseSidebarSlotId}
            format="rectangle"
            is18PlusContext={video.is18Plus || video.groupId === 'group-7'}
            label="Sponsored"
          />

          {/* Sponsored Sidebar Box */}
          <div className="rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-4 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
              Sponsored Spotlight
            </span>
            <h4 className="text-xs font-bold text-white">
              Upgrade to VIP All-Access
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Remove all ads permanently, unlock full 4K UHD streaming, and get unlimited access to Channel 7's 18+ Mature library.
            </p>
            <button
              onClick={() => setPricingModalOpen(true)}
              className="mt-2 text-xs font-semibold text-amber-400 hover:underline cursor-pointer"
            >
              Explore VIP Tiers →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
