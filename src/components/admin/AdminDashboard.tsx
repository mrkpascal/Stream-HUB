import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Video,
  AdCampaign,
  SubscriptionTierId,
  UserRole,
  UserStatus,
  AdFormat,
  AdThemeColor,
} from '../../types';
import {
  Sliders,
  Video as VideoIcon,
  Sparkles,
  BarChart3,
  Users,
  Settings,
  DollarSign,
  Plus,
  Trash2,
  Check,
  Eye,
  MousePointer,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Download,
  AlertCircle,
  Play,
  Film,
  Zap,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    videos,
    videoGroups,
    adCampaigns,
    subscriptionTiers,
    monetization,
    userControls,
    usersList,
    analytics,
    postVideo,
    deleteVideo,
    updateVideo,
    generateAdFromPrompt,
    addAdCampaign,
    toggleAdActive,
    deleteAdCampaign,
    updateUserRole,
    updateUserStatus,
    updateUserControls,
    updateMonetization,
    updateSubscriptionTier,
    setCurrentView,
    showToast,
  } = useApp();

  // Active Admin Sub-tab
  const [adminTab, setAdminTab] = useState<
    'videos' | 'ad-engine' | 'analytics' | 'users' | 'controls' | 'monetization'
  >('ad-engine');

  // POST VIDEO FORM STATE
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoGroupId, setVideoGroupId] = useState('group-1');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('14:30');
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(870);
  const [videoRequiredTier, setVideoRequiredTier] = useState<SubscriptionTierId>('free');
  const [videoCreator, setVideoCreator] = useState('PascalTech Studio');
  const [videoTags, setVideoTags] = useState('Tech, AI, Innovation');
  const [videoIsFeatured, setVideoIsFeatured] = useState(false);
  const [videoPrerollAd, setVideoPrerollAd] = useState(true);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);

  // AD PROMPT ENGINE STATE
  const [adPromptInput, setAdPromptInput] = useState(
    'Cyberpunk VPN offering 70% off with futuristic neon visual, call to action "Protect Your Privacy"'
  );
  const [adTargetGroup, setAdTargetGroup] = useState('all');
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<Partial<AdCampaign> | null>(null);

  // USER MANAGEMENT FILTER
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Video preset presets
  const samplePresets = [
    {
      name: 'Sintel Trailer (Sci-Fi HD)',
      url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      thumb: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
      duration: '00:52',
      seconds: 52,
    },
    {
      name: 'Big Buck Bunny (Animation HD)',
      url: 'https://media.w3.org/2010/05/bunny/movie.mp4',
      thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      duration: '09:56',
      seconds: 596,
    },
    {
      name: 'Nature Flower Loop (CC0 HD)',
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      thumb: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      duration: '00:05',
      seconds: 5,
    },
    {
      name: 'Local Studio Stream (MP4)',
      url: '/videos/demo-stream.mp4',
      thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      duration: '00:08',
      seconds: 8,
    },
  ];

  const applyPreset = (preset: typeof samplePresets[0]) => {
    setUploadMode('url');
    setUploadedFileName(null);
    setVideoUrl(preset.url);
    setVideoThumbnailUrl(preset.thumb);
    setVideoDuration(preset.duration);
    setVideoDurationSeconds(preset.seconds);
  };

  const uploadMediaFile = (
    file: File | Blob,
    fileName: string,
    onProgress?: (pct: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload-media');
      xhr.setRequestHeader('x-file-name', encodeURIComponent(fileName));
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && onProgress) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed.success && parsed.url) {
              resolve(parsed.url);
              return;
            }
          } catch {
            // fall through
          }
        }
        reject(new Error(`Upload failed (${xhr.status})`));
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(file);
    });
  };

  const extractVideoMetadataAndThumbnail = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.muted = true;
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = () => {
      if (tempVideo.duration && Number.isFinite(tempVideo.duration)) {
        const totalSec = Math.round(tempVideo.duration);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        setVideoDuration(`${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`);
        setVideoDurationSeconds(totalSec);
        tempVideo.currentTime = Math.min(1.5, totalSec / 3);
      }
    };

    tempVideo.onseeked = () => {
      try {
        if (!videoThumbnailUrl && tempVideo.videoWidth > 0 && tempVideo.videoHeight > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(tempVideo.videoWidth, 1280);
          canvas.height = Math.round((canvas.width / tempVideo.videoWidth) * tempVideo.videoHeight);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              async (blob) => {
                if (blob) {
                  try {
                    const thumbUrl = await uploadMediaFile(blob, `thumb_${Date.now()}.jpg`);
                    setVideoThumbnailUrl((prev) => prev || thumbUrl);
                  } catch {
                    // optional thumbnail capture
                  }
                }
                URL.revokeObjectURL(objectUrl);
              },
              'image/jpeg',
              0.85
            );
            return;
          }
        }
      } catch {
        // ignore canvas error
      }
      URL.revokeObjectURL(objectUrl);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(objectUrl);
    };
  };

  const handleVideoFileSelected = async (file: File) => {
    const validExtensions = /\.(mp4|webm|mov|mkv|avi|m4v|ogv|ogg|3gp|flv|wmv)$/i;
    if (!file.type.startsWith('video/') && !validExtensions.test(file.name)) {
      showToast('Please select a valid video file (MP4, WebM, MOV, MKV, etc.).');
      return;
    }

    if (!videoTitle.trim()) {
      const cleanedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      setVideoTitle(cleanedTitle);
    }

    extractVideoMetadataAndThumbnail(file);

    setIsUploadingVideo(true);
    setUploadProgress(0);
    setUploadedFileName(file.name);

    try {
      const uploadedUrl = await uploadMediaFile(file, file.name, (pct) => setUploadProgress(pct));
      setVideoUrl(uploadedUrl);
      showToast(`Video "${file.name}" uploaded and ready to publish!`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload video file.');
      setUploadedFileName(null);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleThumbFileSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file (JPG, PNG, WebP) for the thumbnail.');
      return;
    }
    setIsUploadingThumb(true);
    try {
      const uploadedUrl = await uploadMediaFile(file, file.name);
      setVideoThumbnailUrl(uploadedUrl);
      showToast('Custom thumbnail uploaded!');
    } catch {
      showToast('Failed to upload thumbnail image.');
    } finally {
      setIsUploadingThumb(false);
    }
  };

  // Video Submit Handler
  const handlePostVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingVideo) {
      showToast('Please wait for the video upload to finish.');
      return;
    }
    if (!videoTitle.trim() || !videoUrl.trim()) {
      showToast('Please upload a video file or enter a video URL.');
      return;
    }

    const selectedGroup = videoGroups.find((g) => g.id === videoGroupId);
    const isMature = selectedGroup ? selectedGroup.is18Plus : false;

    postVideo({
      title: videoTitle.trim(),
      description: videoDescription.trim() || 'No description provided.',
      groupId: videoGroupId,
      videoUrl: videoUrl.trim(),
      thumbnailUrl:
        videoThumbnailUrl.trim() ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      duration: videoDuration,
      durationSeconds: videoDurationSeconds,
      requiredTier: videoRequiredTier,
      is18Plus: isMature,
      tags: videoTags.split(',').map((t) => t.trim()).filter(Boolean),
      creatorName: videoCreator.trim() || 'Pascal Admin',
      featured: videoIsFeatured,
      adSettings: {
        prerollEnabled: videoPrerollAd,
        midrollEnabled: videoPrerollAd,
      },
    });

    // Reset Form
    setVideoTitle('');
    setVideoDescription('');
    setVideoUrl('');
    setVideoThumbnailUrl('');
    setUploadedFileName(null);
    setUploadProgress(0);
    setVideoIsFeatured(false);
  };

  // AD ENGINE: Generate Ad From Prompt
  const handleGenerateAdFromPrompt = async () => {
    if (!adPromptInput.trim()) {
      showToast('Please enter an ad description prompt.');
      return;
    }
    setIsGeneratingAd(true);
    const result = await generateAdFromPrompt(adPromptInput, adTargetGroup);
    setIsGeneratingAd(false);
    if (result.success && result.ad) {
      setGeneratedDraft(result.ad);
      showToast('Ad campaign generated from prompt!');
    } else {
      showToast(result.error || 'Failed to generate ad from prompt.');
    }
  };

  // Launch Generated Ad
  const handleLaunchDraftAd = () => {
    if (!generatedDraft) return;
    addAdCampaign({
      prompt: adPromptInput,
      title: generatedDraft.title || 'Promoted Campaign',
      brandName: generatedDraft.brandName || 'Sponsor Brand',
      headline: generatedDraft.headline || 'Exclusive Special Offer',
      tagline: generatedDraft.tagline || 'Experience the difference today.',
      ctaText: generatedDraft.ctaText || 'Learn More',
      ctaUrl: generatedDraft.ctaUrl || 'https://pascalhub.stream/promo',
      format: (generatedDraft.format as AdFormat) || 'preroll',
      themeColor: (generatedDraft.themeColor as AdThemeColor) || 'cyan',
      durationSeconds: generatedDraft.durationSeconds || 8,
      skipDelaySeconds: generatedDraft.skipDelaySeconds || 5,
      visualVibe: generatedDraft.visualVibe || 'Cinematic high-contrast advertising creative',
      estimatedCpm: generatedDraft.estimatedCpm || 20.0,
      active: true,
      targetGroupIds: generatedDraft.targetGroupIds || ['all'],
    });
    setGeneratedDraft(null);
  };

  // Export Revenue Report to CSV
  const handleExportCsv = () => {
    const rows = [
      ['Date', 'Views', 'Ad Impressions', 'Watch Time (Hrs)', 'Ad Revenue ($)', 'Subscription Revenue ($)'],
      ...analytics.map((a) => [a.date, a.views, a.adImpressions, a.watchTimeHours, a.adRevenue.toFixed(2), a.subRevenue.toFixed(2)]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pascalhub_revenue_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Revenue CSV report generated & downloaded.');
  };

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate totals
  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);
  const totalAdImpressions = adCampaigns.reduce((acc, a) => acc + a.impressions, 0);
  const totalAdClicks = adCampaigns.reduce((acc, a) => acc + a.clicks, 0);
  const overallCtr = totalAdImpressions > 0 ? ((totalAdClicks / totalAdImpressions) * 100).toFixed(2) : '3.82';
  const totalPlatformRevenue = (monetization.totalAdRevenue + monetization.totalSubscriptionRevenue).toFixed(2);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner: Master Admin Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-neutral-900 to-neutral-950 p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-900/40">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-bold text-white tracking-tight">
                PascalHub Admin Command Center
              </h1>
              <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Authorized Master Account: <strong className="text-white">pascaltechhub@gmail.com</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentView('stream')}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors"
          >
            Switch to Public Stream
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-800 pb-2 scrollbar-none">
        <button
          onClick={() => setAdminTab('ad-engine')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'ad-engine'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Prompt Ad Engine</span>
        </button>

        <button
          onClick={() => setAdminTab('videos')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'videos'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <VideoIcon className="h-4 w-4" />
          <span>Post & Manage Videos ({videos.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('analytics')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'analytics'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Analytics & Reports</span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'users'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Users & Permissions ({usersList.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('controls')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'controls'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>User Dashboard Controls</span>
        </button>

        <button
          onClick={() => setAdminTab('monetization')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'monetization'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Monetization & Tiers</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODULE 1: PROMPT AD ENGINE ("control all ads by entering prompt of Ad") */}
      {/* ========================================================================= */}
      {adminTab === 'ad-engine' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Ad Prompt Input Card */}
          <div className="rounded-2xl border border-rose-500/30 bg-neutral-900/80 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-rose-500" />
                  <span>Prompt-Driven Ad Campaign Generator</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Type any natural language prompt describing an ad concept, sponsor, brand, or offer to synthesize a video ad campaign.
                </p>
              </div>
              <span className="rounded bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-400 border border-rose-500/20">
                Full Network Ad Injection
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Enter Prompt of Ad:
                </label>
                <textarea
                  rows={3}
                  value={adPromptInput}
                  onChange={(e) => setAdPromptInput(e.target.value)}
                  placeholder="e.g. High energy electrolyte drink for gym athletes with discount code FUEL26, call to action 'Shop Starter Pack', targeting Gaming and Lifestyle channels..."
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3.5 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Sample Prompts Pills */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-400">
                <span className="font-medium text-neutral-300">Quick Prompt Templates:</span>
                <button
                  type="button"
                  onClick={() =>
                    setAdPromptInput(
                      'Next-gen AI coding assistant offering 30-day trial for software engineers, violet neon glow, button "Deploy In 10 Seconds"'
                    )
                  }
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-neutral-300 hover:border-neutral-700 hover:text-white cursor-pointer"
                >
                  AI Developer Cloud
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAdPromptInput(
                      'Gaming mechanical keyboard with hot-swappable optical switches, 40% discount countdown, button "Upgrade Battlestation"'
                    )
                  }
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-neutral-300 hover:border-neutral-700 hover:text-white cursor-pointer"
                >
                  Esports Peripheral
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAdPromptInput(
                      'Late night artisanal coffee subscription with whole bean dark roast, amber aesthetics, button "Taste The Dark Blend"'
                    )
                  }
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-neutral-300 hover:border-neutral-700 hover:text-white cursor-pointer"
                >
                  Artisan Coffee Roast
                </button>
              </div>

              {/* Channel Target & Generate CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-neutral-800">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-neutral-400">
                    Channel Target:
                  </label>
                  <select
                    value={adTargetGroup}
                    onChange={(e) => setAdTargetGroup(e.target.value)}
                    className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="all">All 7 Video Channels</option>
                    {videoGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.index}. {g.name} {g.is18Plus ? '(18+ Only)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerateAdFromPrompt}
                  disabled={isGeneratingAd}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-900/30 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`h-4 w-4 ${isGeneratingAd ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAd ? 'Synthesizing Ad...' : 'Generate Ad From Prompt'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Generated Ad Live Preview & Confirmation */}
          {generatedDraft && (
            <div className="rounded-2xl border border-cyan-500/40 bg-neutral-900 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-cyan-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300 border border-cyan-500/30">
                    Ad Creative Preview
                  </span>
                  <span className="text-xs text-neutral-400">
                    Target: {generatedDraft.targetGroupIds?.[0] === 'all' ? 'All Channels' : 'Targeted Group'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGeneratedDraft(null)}
                    className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleLaunchDraftAd}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md"
                  >
                    <Check className="h-4 w-4" />
                    <span>Deploy Ad to Video Network</span>
                  </button>
                </div>
              </div>

              {/* Mock Video Player Frame Showing Ad In-Situ */}
              <div className="relative aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 p-6 flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300 border border-amber-500/30">
                    Ad · 1 of 1 (0:0{generatedDraft.durationSeconds})
                  </span>
                  <span className="bg-neutral-800/80 px-2.5 py-1 rounded text-[11px] font-mono text-neutral-300">
                    Skip in {generatedDraft.skipDelaySeconds}s
                  </span>
                </div>

                <div className="my-auto text-center space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                    {generatedDraft.brandName}
                  </span>
                  <h3 className="font-heading text-2xl font-bold text-white">
                    {generatedDraft.headline}
                  </h3>
                  <p className="text-xs text-neutral-300 max-w-md mx-auto">
                    {generatedDraft.tagline}
                  </p>
                  <div className="pt-2">
                    <button className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg pointer-events-none">
                      {generatedDraft.ctaText} →
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-2">
                  <span>Estimated CPM: <strong>${generatedDraft.estimatedCpm?.toFixed(2)}</strong></span>
                  <span>Format: <strong>{generatedDraft.format}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Active Ad Campaigns Table */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-white tracking-tight">
                  Active Network Ad Campaigns ({adCampaigns.length})
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Currently running sponsored campaigns injected into non-paying viewers' video streams.
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                  ${adCampaigns.reduce((a, c) => a + c.revenueEarned, 0).toFixed(2)}
                </span>
                <p className="text-[10px] text-neutral-400">Total Ad Campaign Payout</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400">
                    <th className="pb-3 font-semibold">Campaign & Prompt</th>
                    <th className="pb-3 font-semibold">Brand / Format</th>
                    <th className="pb-3 font-semibold text-right">Impressions</th>
                    <th className="pb-3 font-semibold text-right">Clicks / CTR</th>
                    <th className="pb-3 font-semibold text-right">Est. CPM</th>
                    <th className="pb-3 font-semibold text-right">Revenue</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {adCampaigns.map((ad) => {
                    const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';

                    return (
                      <tr key={ad.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3.5 pr-4 max-w-xs">
                          <p className="font-semibold text-white truncate">{ad.title}</p>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5 italic">
                            "{ad.prompt}"
                          </p>
                        </td>

                        <td className="py-3.5 pr-4">
                          <span className="font-medium text-neutral-200">{ad.brandName}</span>
                          <span className="block text-[10px] text-neutral-400 uppercase">
                            {ad.format} · {ad.durationSeconds}s
                          </span>
                        </td>

                        <td className="py-3.5 pr-4 text-right font-mono tabular-nums text-neutral-200">
                          {ad.impressions.toLocaleString()}
                        </td>

                        <td className="py-3.5 pr-4 text-right font-mono tabular-nums text-neutral-200">
                          {ad.clicks.toLocaleString()} <span className="text-[10px] text-neutral-400">({ctr}%)</span>
                        </td>

                        <td className="py-3.5 pr-4 text-right font-mono tabular-nums text-neutral-200">
                          ${ad.estimatedCpm.toFixed(2)}
                        </td>

                        <td className="py-3.5 pr-4 text-right font-mono tabular-nums text-emerald-400 font-semibold">
                          ${ad.revenueEarned.toFixed(2)}
                        </td>

                        <td className="py-3.5 text-center">
                          <button
                            onClick={() => toggleAdActive(ad.id)}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                              ad.active
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                            }`}
                          >
                            {ad.active ? 'Active' : 'Paused'}
                          </button>
                        </td>

                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => deleteAdCampaign(ad.id)}
                            className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 2: POST VIDEO & CONTENT MANAGEMENT */}
      {/* ========================================================================= */}
      {adminTab === 'videos' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Form to Post New Video */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h2 className="font-heading text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Plus className="h-5 w-5 text-rose-500" />
                  <span>Publish New Video to Platform</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Distribute video streams across any of the 7 channels (including Channel 7: 18+ Mature with strict age gating).
                </p>
              </div>

              {/* Sample Presets Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-400 hidden sm:inline">Demo Presets:</span>
                {samplePresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  >
                    Preset {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handlePostVideo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Video Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deep Neural Architectures in 2026"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Category Group (The 7 Groups) */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Assign Video Group / Channel *
                  </label>
                  <select
                    value={videoGroupId}
                    onChange={(e) => setVideoGroupId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none font-medium"
                  >
                    {videoGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        Channel {g.index}: {g.name} {g.is18Plus ? '⚠️ (STRICT 18+ AGE RESTRICTED)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Video Synopsis & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed breakdown of the streaming title, director notes, chapters..."
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Upload Source Method Selector */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-neutral-200">
                    Video Upload Source *
                  </span>
                  <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-1">
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        uploadMode === 'file'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Video File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        uploadMode === 'url'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>Paste Any Video / YouTube URL</span>
                    </button>
                  </div>
                </div>

                {uploadMode === 'file' ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(true);
                    }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleVideoFileSelected(file);
                    }}
                    onClick={() => videoFileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                      isDraggingOver
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-neutral-700 bg-neutral-900/50 hover:border-neutral-500 hover:bg-neutral-900'
                    }`}
                  >
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v,.ogv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoFileSelected(file);
                      }}
                      className="hidden"
                    />
                    <Upload className="h-7 w-7 text-rose-400 mb-2" />
                    <p className="text-xs font-semibold text-white">
                      {isUploadingVideo
                        ? `Uploading ${uploadedFileName}... (${uploadProgress}%)`
                        : uploadedFileName && videoUrl
                        ? `Uploaded: ${uploadedFileName}`
                        : 'Drag & drop any video file here, or click to browse'}
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      Supports MP4, WebM, MOV, MKV, AVI, M4V (up to 500MB) · Auto-extracts duration & poster frame
                    </p>

                    {isUploadingVideo && (
                      <div className="mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-neutral-800">
                        <div
                          className="h-full bg-rose-500 transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}

                    {!isUploadingVideo && videoUrl && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                        <Check className="h-3 w-3" />
                        <span>Ready: {videoUrl}</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Video URL (Direct MP4 / WebM / MOV, YouTube, or Vimeo Link) *
                    </label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Thumbnail URL + Device Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Poster Thumbnail (Upload Image or Paste URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="https://...jpg or upload an image file"
                      value={videoThumbnailUrl}
                      onChange={(e) => setVideoThumbnailUrl(e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                    />
                    <input
                      ref={thumbFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleThumbFileSelected(file);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingThumb}
                      onClick={() => thumbFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white whitespace-nowrap cursor-pointer disabled:opacity-50"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-rose-400" />
                      <span>{isUploadingThumb ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                  </div>
                </div>

                {/* Duration Display */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Duration (MM:SS)
                  </label>
                  <input
                    type="text"
                    placeholder="14:30"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Publisher Name */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Publisher / Creator Name
                  </label>
                  <input
                    type="text"
                    value={videoCreator}
                    onChange={(e) => setVideoCreator(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Required Tier */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Subscriber Tier Access
                  </label>
                  <select
                    value={videoRequiredTier}
                    onChange={(e) => setVideoRequiredTier(e.target.value as SubscriptionTierId)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="free">Standard (Free with Prompt Ads)</option>
                    <option value="pro">Pro Streamer (Ad-Free HD)</option>
                    <option value="vip">VIP All-Access Only (4K UHD)</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Search Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={videoTags}
                    onChange={(e) => setVideoTags(e.target.value)}
                    placeholder="AI, Hardware, SciFi"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-neutral-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={videoIsFeatured}
                    onChange={(e) => setVideoIsFeatured(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-950 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Feature in Hero Billboard</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={videoPrerollAd}
                    onChange={(e) => setVideoPrerollAd(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-950 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Inject Prompt Ad Campaigns for Free-tier viewers</span>
                </label>

                {videoGroupId === 'group-7' && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Age Gate (18+) will be strictly enforced</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-900/30 hover:bg-rose-500 transition-all cursor-pointer"
                >
                  Publish Video Stream
                </button>
              </div>
            </form>
          </div>

          {/* Videos Table */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
            <h3 className="font-heading text-base font-bold text-white tracking-tight">
              Published Video Catalog ({videos.length} Titles)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400">
                    <th className="pb-3 font-semibold">Video</th>
                    <th className="pb-3 font-semibold">Channel / Group</th>
                    <th className="pb-3 font-semibold">Tier Access</th>
                    <th className="pb-3 font-semibold text-right">Views</th>
                    <th className="pb-3 font-semibold text-right">Likes</th>
                    <th className="pb-3 font-semibold text-center">Featured</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {videos.map((vid) => {
                    const group = videoGroups.find((g) => g.id === vid.groupId);

                    return (
                      <tr key={vid.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3 pr-4 flex items-center gap-3">
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.title}
                            className="h-10 w-16 rounded object-cover border border-neutral-800 shrink-0"
                          />
                          <div className="max-w-xs">
                            <p className="font-semibold text-white truncate">{vid.title}</p>
                            <p className="text-[10px] text-neutral-400">
                              {vid.creatorName} · {vid.duration}
                            </p>
                          </div>
                        </td>

                        <td className="py-3 pr-4">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              vid.is18Plus
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {group?.name || 'Channel'}
                          </span>
                        </td>

                        <td className="py-3 pr-4 uppercase text-[10px] font-semibold text-neutral-300">
                          {vid.requiredTier}
                        </td>

                        <td className="py-3 pr-4 text-right font-mono tabular-nums text-neutral-200">
                          {vid.views.toLocaleString()}
                        </td>

                        <td className="py-3 pr-4 text-right font-mono tabular-nums text-neutral-200">
                          {vid.likes}
                        </td>

                        <td className="py-3 text-center">
                          <button
                            onClick={() => updateVideo(vid.id, { featured: !vid.featured })}
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                              vid.featured
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-neutral-800 text-neutral-500'
                            }`}
                          >
                            {vid.featured ? 'Featured' : 'Standard'}
                          </button>
                        </td>

                        <td className="py-3 text-right">
                          <button
                            onClick={() => deleteVideo(vid.id)}
                            className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 3: ROBUST ANALYTICS DASHBOARD */}
      {/* ========================================================================= */}
      {adminTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <span className="text-xs text-neutral-400">Total Video Views</span>
              <p className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
                {totalViews.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-400">+18.4% this week</span>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <span className="text-xs text-neutral-400">Ad Impressions</span>
              <p className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
                {totalAdImpressions.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-400">Avg CTR: {overallCtr}%</span>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <span className="text-xs text-neutral-400">Ad Network Revenue</span>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                ${monetization.totalAdRevenue.toFixed(2)}
              </p>
              <span className="text-[10px] text-neutral-400">Via Prompt Campaigns</span>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <span className="text-xs text-neutral-400">Total Platform Gross</span>
              <p className="mt-1 font-mono text-2xl font-bold text-amber-400 tabular-nums">
                ${totalPlatformRevenue}
              </p>
              <span className="text-[10px] text-amber-300">Subs + Ad CPM</span>
            </div>
          </div>

          {/* Interactive SVG Area Chart: Revenue & Traffic Trajectory */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading text-base font-bold text-white tracking-tight">
                  12-Day Platform Growth Trajectory (Views & Combined Revenue)
                </h3>
                <p className="text-xs text-neutral-400">
                  Tracking video impressions and combined gross revenue from prompt ads + subscription tiers.
                </p>
              </div>

              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV Report</span>
              </button>
            </div>

            {/* High-Resolution Responsive SVG Chart */}
            <div className="relative h-64 w-full pt-4">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="0" y1="40" x2="600" y2="40" stroke="#262626" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="#262626" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="#262626" strokeDasharray="3 3" />

                {/* Area Polygon */}
                <polygon
                  fill="url(#revenueGrad)"
                  points={`0,180 ${analytics
                    .map((d, i) => `${(i / (analytics.length - 1)) * 600},${180 - (d.views / 9000) * 140}`)
                    .join(' ')} 600,180`}
                />

                {/* Line Path */}
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  points={analytics
                    .map((d, i) => `${(i / (analytics.length - 1)) * 600},${180 - (d.views / 9000) * 140}`)
                    .join(' ')}
                />

                {/* Data Points */}
                {analytics.map((d, i) => {
                  const cx = (i / (analytics.length - 1)) * 600;
                  const cy = 180 - (d.views / 9000) * 140;
                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r="3.5"
                      fill="#ffffff"
                      stroke="#f43f5e"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>

              {/* X Axis Date labels */}
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono pt-2">
                {analytics.map((d, i) => (
                  <span key={i} className="hidden sm:inline">
                    {d.date}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Breakdown by the 7 Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
              <h3 className="font-heading text-base font-bold text-white tracking-tight">
                Views Breakdown Across 7 Channels
              </h3>

              <div className="space-y-3">
                {videoGroups.map((group) => {
                  const groupVideos = videos.filter((v) => v.groupId === group.id);
                  const groupViews = groupVideos.reduce((a, b) => a + b.views, 0);
                  const percent = totalViews > 0 ? ((groupViews / totalViews) * 100).toFixed(1) : '0';

                  return (
                    <div key={group.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-neutral-300">
                          {group.index}. {group.name}
                        </span>
                        <span className="font-mono tabular-nums text-neutral-400">
                          {groupViews.toLocaleString()} views ({percent}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            group.is18Plus ? 'bg-red-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ad Monetization Metrics Matrix */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
              <h3 className="font-heading text-base font-bold text-white tracking-tight">
                Ad Network Performance Summary
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                  <span className="text-neutral-500 text-[11px]">Avg CPM Rate</span>
                  <p className="text-lg font-mono font-bold text-white mt-1 tabular-nums">
                    $22.80
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                  <span className="text-neutral-500 text-[11px]">Completed Views</span>
                  <p className="text-lg font-mono font-bold text-white mt-1 tabular-nums">
                    84.2%
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                  <span className="text-neutral-500 text-[11px]">Total Ad Clicks</span>
                  <p className="text-lg font-mono font-bold text-white mt-1 tabular-nums">
                    {totalAdClicks.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                  <span className="text-neutral-500 text-[11px]">Avg Watch Duration</span>
                  <p className="text-lg font-mono font-bold text-white mt-1 tabular-nums">
                    18.4 min
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/60 p-3 text-xs text-neutral-400">
                <p>
                  <strong>Ad Engine Status:</strong> Operational. Injected prerolls automatically pause videos for free subscribers and generate per-impression CPM revenue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 4: USER MANAGEMENT & PERMISSIONS */}
      {/* ========================================================================= */}
      {adminTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-rose-500" />
                <span>User Management & Access Permissions</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Inspect registered viewers, toggle moderation states, grant VIP access, or change roles.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 focus:border-rose-500 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="vip">VIP Member</option>
                <option value="subscriber">Subscriber</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Age / 18+ Verification</th>
                    <th className="pb-3 font-semibold">Subscription Tier</th>
                    <th className="pb-3 font-semibold">Platform Role</th>
                    <th className="pb-3 font-semibold">Account Status</th>
                    <th className="pb-3 font-semibold text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3.5 pr-4 flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover border border-neutral-700 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-white">{user.name}</p>
                          <p className="text-[11px] text-neutral-400">{user.email}</p>
                        </div>
                      </td>

                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-neutral-200">Age: {user.age}</span>
                        <span
                          className={`ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            user.age >= 18
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {user.age >= 18 ? '18+ Verified' : 'Under 18 (Restricted)'}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            user.subscriptionTier === 'vip'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : user.subscriptionTier === 'pro'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {user.subscriptionTier}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                          className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-200 focus:outline-none"
                        >
                          <option value="subscriber">Subscriber</option>
                          <option value="vip">VIP Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="py-3.5 pr-4">
                        <select
                          value={user.status}
                          onChange={(e) => updateUserStatus(user.id, e.target.value as UserStatus)}
                          className={`rounded border px-2 py-1 text-xs font-semibold focus:outline-none ${
                            user.status === 'active'
                              ? 'border-emerald-600/40 bg-emerald-950/20 text-emerald-300'
                              : 'border-red-600/40 bg-red-950/20 text-red-300'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                        </select>
                      </td>

                      <td className="py-3.5 text-right font-mono text-[11px] text-neutral-400">
                        {user.createdAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 5: USER DASHBOARD CONTROL (Feature Flags) */}
      {/* ========================================================================= */}
      {adminTab === 'controls' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-neutral-800 pb-4">
            <h2 className="font-heading text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Settings className="h-5 w-5 text-rose-500" />
              <span>User Dashboard & Feature Permissions Control</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Control what viewer accounts can do inside their personal dashboards and during stream playback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">Enable Video Discussions & Comments</h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Allows registered members to post remarks, feedback, and replies underneath stream players.
                </p>
              </div>
              <input
                type="checkbox"
                checked={userControls.allowUserComments}
                onChange={(e) => updateUserControls({ allowUserComments: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-neutral-700 bg-neutral-950 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">Enable User Watch History Tracking</h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Automatically saves playback checkpoints in user dashboards so they can resume across devices.
                </p>
              </div>
              <input
                type="checkbox"
                checked={userControls.enableWatchHistory}
                onChange={(e) => updateUserControls({ enableWatchHistory: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-neutral-700 bg-neutral-950 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">Strict Age Enforcement for Channel 7 (18+)</h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Enforces mandatory affirmation of age 18+ and verifies user birthdate prior to playback initiation.
                </p>
              </div>
              <input
                type="checkbox"
                checked={userControls.strictAgeEnforcement}
                onChange={(e) => updateUserControls({ strictAgeEnforcement: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-neutral-700 bg-neutral-950 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">Allow Custom User Watchlists & Playlists</h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Enables users to bookmark videos to personal collections and create custom playback queues.
                </p>
              </div>
              <input
                type="checkbox"
                checked={userControls.allowUserPlaylists}
                onChange={(e) => updateUserControls({ allowUserPlaylists: e.target.checked })}
                className="mt-1 h-5 w-5 rounded border-neutral-700 bg-neutral-950 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 6: MONETIZATION SETTINGS & SUBSCRIPTION TIERS */}
      {/* ========================================================================= */}
      {adminTab === 'monetization' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="border-b border-neutral-800 pb-4">
            <h2 className="font-heading text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-rose-500" />
              <span>Monetization Settings & Subscription Tiers Manager</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Configure subscription tier pricing, ad revenue share splits, and payment gateway simulation.
            </p>
          </div>

          {/* Revenue Distribution Settings */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
            <h3 className="font-heading text-sm font-bold text-white">
              Revenue Split & Payout Rules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Ad Revenue Share to Creators (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={monetization.adRevenueSharePercent}
                  onChange={(e) =>
                    updateMonetization({ adRevenueSharePercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Platform Commission Fee (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={monetization.platformFeePercent}
                  onChange={(e) =>
                    updateMonetization({ platformFeePercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Minimum Payout Threshold ($)
                </label>
                <input
                  type="number"
                  min={10}
                  value={monetization.minimumPayout}
                  onChange={(e) =>
                    updateMonetization({ minimumPayout: parseFloat(e.target.value) || 50 })
                  }
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={monetization.paymentGatewaySandbox}
                  onChange={(e) =>
                    updateMonetization({ paymentGatewaySandbox: e.target.checked })
                  }
                  className="rounded border-neutral-700 bg-neutral-950 text-rose-600 focus:ring-rose-500"
                />
                <span>Simulated Stripe Sandbox Gateway (instant test upgrades without real charges)</span>
              </label>

              <button
                onClick={handleExportCsv}
                className="text-rose-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Download className="h-3 w-3" />
                <span>Export Revenue Ledger</span>
              </button>
            </div>
          </div>

          {/* Google AdSense Integration Controls */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-sm font-bold text-white">
                  Google AdSense Integration
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Script loaded globally in document head and ads.txt published at /ads.txt. AdSense units automatically hide for Pro/VIP tiers and 18+ streams.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-200 shrink-0">
                <input
                  type="checkbox"
                  checked={monetization.adsenseEnabled}
                  onChange={(e) => updateMonetization({ adsenseEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-rose-600 focus:ring-rose-500"
                />
                <span>{monetization.adsenseEnabled ? 'AdSense Active' : 'AdSense Paused'}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  AdSense Publisher Client ID
                </label>
                <input
                  type="text"
                  value={monetization.adsenseClientId}
                  onChange={(e) => updateMonetization({ adsenseClientId: e.target.value })}
                  placeholder="ca-pub-9250869376937276"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Display Banner Slot ID (Optional)
                </label>
                <input
                  type="text"
                  value={monetization.adsenseDisplaySlotId}
                  onChange={(e) => updateMonetization({ adsenseDisplaySlotId: e.target.value })}
                  placeholder="e.g. 1234567890 (Auto Ads if blank)"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Player Sidebar Slot ID (Optional)
                </label>
                <input
                  type="text"
                  value={monetization.adsenseSidebarSlotId}
                  onChange={(e) => updateMonetization({ adsenseSidebarSlotId: e.target.value })}
                  placeholder="e.g. 0987654321 (Auto Ads if blank)"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Manage the 3 Subscription Tiers */}
          <div className="space-y-4">
            <h3 className="font-heading text-sm font-bold text-white">
              Subscription Tiers Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{tier.name}</h4>
                    <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-400">
                      {tier.id}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-1">
                        Monthly Price ($)
                      </label>
                      <input
                        type="number"
                        step={0.01}
                        value={tier.priceMonthly}
                        onChange={(e) =>
                          updateSubscriptionTier(tier.id, {
                            priceMonthly: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded border border-neutral-700 bg-neutral-950 p-2 font-mono text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-1">
                        Annual Price ($)
                      </label>
                      <input
                        type="number"
                        step={0.01}
                        value={tier.priceYearly}
                        onChange={(e) =>
                          updateSubscriptionTier(tier.id, {
                            priceYearly: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded border border-neutral-700 bg-neutral-950 p-2 font-mono text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-1">
                        Max Streaming Quality
                      </label>
                      <select
                        value={tier.maxQuality}
                        onChange={(e) =>
                          updateSubscriptionTier(tier.id, {
                            maxQuality: e.target.value as any,
                          })
                        }
                        className="w-full rounded border border-neutral-700 bg-neutral-950 p-2 text-white"
                      >
                        <option value="720p">720p HD</option>
                        <option value="1080p Full HD">1080p Full HD</option>
                        <option value="4K Ultra HD">4K Ultra HD</option>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-neutral-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tier.adFree}
                          onChange={(e) =>
                            updateSubscriptionTier(tier.id, { adFree: e.target.checked })
                          }
                          className="rounded border-neutral-700 bg-neutral-950 text-rose-600"
                        />
                        <span>100% Ad-Free Playback</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tier.allows18Plus}
                          onChange={(e) =>
                            updateSubscriptionTier(tier.id, { allows18Plus: e.target.checked })
                          }
                          className="rounded border-neutral-700 bg-neutral-950 text-rose-600"
                        />
                        <span>Channel 7: 18+ Mature Access</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
