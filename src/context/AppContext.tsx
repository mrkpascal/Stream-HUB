import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Video,
  VideoGroup,
  AdCampaign,
  SubscriptionTier,
  UserDashboardControls,
  MonetizationSettings,
  AnalyticsMetric,
  SubscriptionTierId,
  UserRole,
  UserStatus,
  SubscriptionPaymentRequest,
  SiteConfig,
} from '../types';
import {
  ADMIN_CREDENTIALS,
  INITIAL_GROUPS,
  INITIAL_VIDEOS,
  INITIAL_ADS,
  INITIAL_SUBSCRIPTION_TIERS,
  INITIAL_USERS,
  INITIAL_USER_CONTROLS,
  INITIAL_MONETIZATION,
  INITIAL_PAYMENT_REQUESTS,
  INITIAL_ANALYTICS,
  INITIAL_SITE_CONFIG,
} from '../data/initialData';
import { COUNTRY_CURRENCIES } from '../utils/currency';

interface AppContextType {
  currentUser: User | null;
  isAdmin: boolean;
  videos: Video[];
  videoGroups: VideoGroup[];
  adCampaigns: AdCampaign[];
  subscriptionTiers: SubscriptionTier[];
  monetization: MonetizationSettings;
  userControls: UserDashboardControls;
  usersList: User[];
  analytics: AnalyticsMetric[];
  siteConfig: SiteConfig;

  // Navigation & View State
  currentView: 'stream' | 'admin-dashboard' | 'user-dashboard' | 'pricing';
  setCurrentView: (view: 'stream' | 'admin-dashboard' | 'user-dashboard' | 'pricing') => void;
  adminActiveTab: 'videos' | 'ad-engine' | 'site-editor' | 'ai-studio-prompt' | 'analytics' | 'users' | 'controls' | 'monetization' | 'payment-review';
  setAdminActiveTab: (tab: 'videos' | 'ad-engine' | 'site-editor' | 'ai-studio-prompt' | 'analytics' | 'users' | 'controls' | 'monetization' | 'payment-review') => void;
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Active Playback & Ads
  activeVideo: Video | null;
  setActiveVideo: (video: Video | null) => void;
  playVideoWithGate: (video: Video) => boolean;
  downloadVideoWithGate: (video: Video) => boolean;
  activeAd: AdCampaign | null;
  adCountdown: number;
  canSkipAd: boolean;
  dismissCurrentAd: () => void;
  recordAdClick: (adId: string) => void;

  // Modals
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'signin' | 'signup' | 'admin';
  setAuthModalTab: (tab: 'signin' | 'signup' | 'admin') => void;
  openAuthModal: (tab?: 'signin' | 'signup' | 'admin') => void;
  
  ageGateModalOpen: boolean;
  setAgeGateModalOpen: (open: boolean) => void;
  pending18PlusVideo: Video | null;
  confirm18PlusConsent: (confirmed: boolean) => void;

  pricingModalOpen: boolean;
  setPricingModalOpen: (open: boolean) => void;

  communityPopupOpen: boolean;
  setCommunityPopupOpen: (open: boolean) => void;

  isVideo18PlusBlurred: (video: Video) => boolean;

  // Authentication Actions
  loginUser: (email: string, pass: string) => { success: boolean; error?: string };
  signupUser: (data: { name: string; email: string; pass: string; birthDate: string; tier?: SubscriptionTierId; countryCode?: string }) => { success: boolean; error?: string };
  loginAdmin: (email: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  upgradeSubscription: (tierId: SubscriptionTierId) => void;

  // Video Management Actions
  postVideo: (video: Omit<Video, 'id' | 'views' | 'likes' | 'createdAt'>) => void;
  updateVideo: (id: string, updates: Partial<Video>) => void;
  deleteVideo: (id: string) => void;
  toggleWatchlist: (videoId: string) => void;
  toggleLikeVideo: (videoId: string) => void;

  // Ad Campaign Management
  generateAdFromPrompt: (prompt: string, targetGroup?: string) => Promise<{ success: boolean; ad?: Partial<AdCampaign>; error?: string }>;
  addAdCampaign: (campaign: Omit<AdCampaign, 'id' | 'impressions' | 'clicks' | 'revenueEarned' | 'createdAt'>) => void;
  updateAdCampaign: (adId: string, updates: Partial<AdCampaign>) => void;
  toggleAdActive: (adId: string) => void;
  deleteAdCampaign: (adId: string) => void;

  // Admin Controls, Channels & Site Content Settings
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  updateUserSubscription: (userId: string, tierId: SubscriptionTierId) => void;
  updateUserControls: (controls: Partial<UserDashboardControls>) => void;
  updateMonetization: (settings: Partial<MonetizationSettings>) => void;
  updateSubscriptionTier: (tierId: SubscriptionTierId, updates: Partial<SubscriptionTier>) => void;
  updateSiteConfig: (updates: Partial<SiteConfig>) => void;
  resetSiteConfig: () => void;
  applySitePrompt: (
    prompt: string,
    attachedImageUrl?: string
  ) => Promise<{ success: boolean; summary?: string; source?: string; error?: string }>;
  undoLastSitePrompt: () => void;
  canUndoSitePrompt: boolean;
  sitePromptHistory: { id: string; prompt: string; summary: string; source: string; createdAt: string }[];
  updateVideoGroup: (groupId: string, updates: Partial<VideoGroup>) => void;
  addVideoGroup: (group: { name: string; description: string; is18Plus: boolean; accentColor: string; badgeText?: string }) => void;
  deleteVideoGroup: (groupId: string) => void;

  // Subscription Payment Review
  paymentRequests: SubscriptionPaymentRequest[];
  submitSubscriptionPaymentRequest: (data: {
    tierId: SubscriptionTierId;
    billingCycle: 'monthly' | 'yearly';
    paymentMethod?: 'momo' | 'usdt_trc20';
    senderPhone: string;
    senderName: string;
    screenshotUrl: string;
    transactionId?: string;
    countryName?: string;
    localCurrency?: string;
    localAmount?: number;
    rwfAmount?: number;
    usdtAmount?: number;
    note?: string;
  }) => { success: boolean; error?: string };
  approvePaymentRequest: (requestId: string) => void;
  rejectPaymentRequest: (requestId: string) => void;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const RESET_USERS_PAYMENTS_FLAG = 'streamhub_clean_users_payments_v1';
const VIP_18PLUS_MIGRATION_FLAG = 'streamhub_18plus_vip_only_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // One-time cleanup of previously cached demo non-admin users, payment requests, and subscription revenue
  if (typeof window !== 'undefined' && !localStorage.getItem(RESET_USERS_PAYMENTS_FLAG)) {
    try {
      const savedUserRaw = localStorage.getItem('pascalhub_user');
      if (savedUserRaw) {
        const parsedUser: User = JSON.parse(savedUserRaw);
        if (parsedUser.role !== 'admin') {
          localStorage.removeItem('pascalhub_user');
        }
      }
      localStorage.setItem('pascalhub_users_list', JSON.stringify(INITIAL_USERS));
      localStorage.setItem('streamhub_payment_requests', JSON.stringify([]));
      const savedMonetizationRaw = localStorage.getItem('pascalhub_monetization');
      if (savedMonetizationRaw) {
        const parsedMon = JSON.parse(savedMonetizationRaw);
        localStorage.setItem(
          'pascalhub_monetization',
          JSON.stringify({ ...parsedMon, totalSubscriptionRevenue: 0 })
        );
      }
      localStorage.setItem(RESET_USERS_PAYMENTS_FLAG, '1');
    } catch {
      // ignore storage errors
    }
  }

  // One-time migration: ensure Free & Pro tiers have allows18Plus = false so 18+ videos stay blurred for non-VIP subscriptions
  if (typeof window !== 'undefined' && !localStorage.getItem(VIP_18PLUS_MIGRATION_FLAG)) {
    try {
      const savedTiersRaw = localStorage.getItem('pascalhub_tiers');
      if (savedTiersRaw) {
        const parsedTiers: SubscriptionTier[] = JSON.parse(savedTiersRaw);
        const migratedTiers = parsedTiers.map((t) => {
          if (t.id === 'free' || t.id === 'pro') {
            const defaultTier = INITIAL_SUBSCRIPTION_TIERS.find((it) => it.id === t.id);
            return {
              ...t,
              allows18Plus: false,
              description: defaultTier?.description || t.description,
              features: defaultTier?.features || t.features,
            };
          }
          return t;
        });
        localStorage.setItem('pascalhub_tiers', JSON.stringify(migratedTiers));
      }
      localStorage.setItem(VIP_18PLUS_MIGRATION_FLAG, '1');
    } catch {
      // ignore storage errors
    }
  }

  // Load saved state or use initial defaults
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pascalhub_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [videos, setVideos] = useState<Video[]>(() => {
    const saved = localStorage.getItem('pascalhub_videos');
    if (!saved) return INITIAL_VIDEOS;
    const parsed: Video[] = JSON.parse(saved);
    const repaired = parsed.map((vid) => {
      if (vid.videoUrl?.includes('commondatastorage.googleapis.com/gtv-videos-bucket/sample/')) {
        const replacement = INITIAL_VIDEOS.find((v) => v.id === vid.id)?.videoUrl || '/videos/demo-stream.mp4';
        return { ...vid, videoUrl: replacement };
      }
      return vid;
    });
    const existingIds = new Set(repaired.map((v) => v.id));
    const newChannelVideos = INITIAL_VIDEOS.filter(
      (v) => (v.groupId === 'group-8' || v.groupId === 'group-9') && !existingIds.has(v.id)
    );
    return newChannelVideos.length > 0 ? [...repaired, ...newChannelVideos] : repaired;
  });

  const [videoGroups, setVideoGroups] = useState<VideoGroup[]>(() => {
    try {
      const saved = localStorage.getItem('streamhub_video_groups');
      return saved ? JSON.parse(saved) : INITIAL_GROUPS;
    } catch {
      return INITIAL_GROUPS;
    }
  });

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try {
      const saved = localStorage.getItem('streamhub_site_config');
      return saved ? { ...INITIAL_SITE_CONFIG, ...JSON.parse(saved) } : INITIAL_SITE_CONFIG;
    } catch {
      return INITIAL_SITE_CONFIG;
    }
  });

  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>(() => {
    const saved = localStorage.getItem('pascalhub_ads');
    return saved ? JSON.parse(saved) : INITIAL_ADS;
  });

  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>(() => {
    const saved = localStorage.getItem('pascalhub_tiers');
    if (!saved) return INITIAL_SUBSCRIPTION_TIERS;
    const parsed: SubscriptionTier[] = JSON.parse(saved);
    return parsed.map((tier) => {
      const initialTier = INITIAL_SUBSCRIPTION_TIERS.find((t) => t.id === tier.id);
      const hasDownloadFeature = tier.features?.some((f) => f.toLowerCase().includes('download'));
      return {
        ...tier,
        allowsDownloads: tier.allowsDownloads ?? true,
        features: hasDownloadFeature
          ? tier.features
          : [
              ...(tier.features || []),
              initialTier?.features.find((f) => f.toLowerCase().includes('download')) ||
                'Direct video downloads enabled',
            ],
      };
    });
  });

  const [userControls, setUserControls] = useState<UserDashboardControls>(() => {
    const saved = localStorage.getItem('pascalhub_controls');
    return saved ? JSON.parse(saved) : INITIAL_USER_CONTROLS;
  });

  const [monetization, setMonetization] = useState<MonetizationSettings>(() => {
    const saved = localStorage.getItem('pascalhub_monetization');
    return saved ? { ...INITIAL_MONETIZATION, ...JSON.parse(saved) } : INITIAL_MONETIZATION;
  });

  const [usersList, setUsersList] = useState<User[]>(() => {
    const saved = localStorage.getItem('pascalhub_users_list');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [paymentRequests, setPaymentRequests] = useState<SubscriptionPaymentRequest[]>(() => {
    const saved = localStorage.getItem('streamhub_payment_requests');
    if (!saved) return INITIAL_PAYMENT_REQUESTS;
    const parsed: SubscriptionPaymentRequest[] = JSON.parse(saved);
    return parsed.map((req) => ({
      ...req,
      senderName: req.senderName || req.userName,
    }));
  });

  const [analytics, setAnalytics] = useState<AnalyticsMetric[]>(INITIAL_ANALYTICS);

  // View state
  const [currentView, setCurrentView] = useState<'stream' | 'admin-dashboard' | 'user-dashboard' | 'pricing'>('stream');
  const [adminActiveTab, setAdminActiveTab] = useState<
    'videos' | 'ad-engine' | 'site-editor' | 'ai-studio-prompt' | 'analytics' | 'users' | 'controls' | 'monetization' | 'payment-review'
  >('ad-engine');
  const [lastSiteSnapshot, setLastSiteSnapshot] = useState<{
    siteConfig: SiteConfig;
    subscriptionTiers: SubscriptionTier[];
    videoGroups: VideoGroup[];
  } | null>(null);
  const [sitePromptHistory, setSitePromptHistory] = useState<
    { id: string; prompt: string; summary: string; source: string; createdAt: string }[]
  >(() => {
    try {
      const saved = localStorage.getItem('streamhub_prompt_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Video & Ad playback
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activeAd, setActiveAd] = useState<AdCampaign | null>(null);
  const [adCountdown, setAdCountdown] = useState<number>(0);
  const [canSkipAd, setCanSkipAd] = useState<boolean>(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'admin'>('signin');
  const [ageGateModalOpen, setAgeGateModalOpen] = useState<boolean>(false);
  const [pending18PlusVideo, setPending18PlusVideo] = useState<Video | null>(null);
  const [pricingModalOpen, setPricingModalOpen] = useState<boolean>(false);
  const [communityPopupOpen, setCommunityPopupOpen] = useState<boolean>(false);

  // Auto-open community links popup once per browser session (skip inside Admin preview iframe)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search.includes('preview=1')) {
        return;
      }
      if (!sessionStorage.getItem('streamhub_community_popup_seen')) {
        const timer = setTimeout(() => {
          setCommunityPopupOpen(true);
          sessionStorage.setItem('streamhub_community_popup_seen', '1');
        }, 900);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore sessionStorage errors
    }
  }, []);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  // Sync state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pascalhub_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pascalhub_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pascalhub_videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('pascalhub_ads', JSON.stringify(adCampaigns));
  }, [adCampaigns]);

  useEffect(() => {
    localStorage.setItem('pascalhub_tiers', JSON.stringify(subscriptionTiers));
  }, [subscriptionTiers]);

  useEffect(() => {
    localStorage.setItem('pascalhub_controls', JSON.stringify(userControls));
  }, [userControls]);

  useEffect(() => {
    localStorage.setItem('pascalhub_monetization', JSON.stringify(monetization));
  }, [monetization]);

  useEffect(() => {
    localStorage.setItem('pascalhub_users_list', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('streamhub_payment_requests', JSON.stringify(paymentRequests));
  }, [paymentRequests]);

  useEffect(() => {
    localStorage.setItem('streamhub_video_groups', JSON.stringify(videoGroups));
  }, [videoGroups]);

  useEffect(() => {
    localStorage.setItem('streamhub_site_config', JSON.stringify(siteConfig));
    if (typeof document !== 'undefined') {
      document.title = `${siteConfig.siteName || 'Stream HUB'} — ${siteConfig.siteSlogan || 'Videos For Everytime'}`;
    }
  }, [siteConfig]);

  // Keyboard shortcut for discreet hidden admin login: Ctrl+Shift+A or Cmd+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openAuthModal('admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === ADMIN_CREDENTIALS.email;

  const isVideo18PlusBlurred = (video: Video): boolean => {
    const isMature = Boolean(video.is18Plus || video.groupId === 'group-7');
    if (!isMature) return false;
    if (!currentUser) return true;
    if (isAdmin) return false;
    const userTier = subscriptionTiers.find((t) => t.id === currentUser.subscriptionTier);
    if (!userTier?.allows18Plus) return true;
    if (currentUser.age < 18 || !currentUser.isVerified18Plus) return true;
    return false;
  };

  const openAuthModal = (tab: 'signin' | 'signup' | 'admin' = 'signin') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  // Ad timer loop when an ad is active
  useEffect(() => {
    if (!activeAd || adCountdown <= 0) return;
    const timer = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        if (prev - 1 <= (activeAd.durationSeconds - activeAd.skipDelaySeconds)) {
          setCanSkipAd(true);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeAd, adCountdown]);

  const dismissCurrentAd = () => {
    setActiveAd(null);
    setAdCountdown(0);
    setCanSkipAd(false);
  };

  const recordAdClick = (adId: string) => {
    setAdCampaigns((prev) =>
      prev.map((ad) =>
        ad.id === adId
          ? { ...ad, clicks: ad.clicks + 1, revenueEarned: ad.revenueEarned + (ad.estimatedCpm / 1000) * 1.5 }
          : ad
      )
    );
    setMonetization((prev) => ({
      ...prev,
      totalAdRevenue: prev.totalAdRevenue + 0.45,
    }));
  };

  // Gatekeeper: Users must create an account / sign in before watching!
  const playVideoWithGate = (video: Video): boolean => {
    // 1. Account Check: Must have account to watch
    if (!currentUser) {
      setPending18PlusVideo(video);
      setAuthModalTab('signup');
      setAuthModalOpen(true);
      showToast('Please create a free account or sign in to start watching.');
      return false;
    }

    // 2. Account Banned/Suspended Check
    if (currentUser.status === 'banned') {
      showToast('Your account has been suspended by platform administration.');
      return false;
    }

    // 3. 18+ Subscription & Age Check (Blurred for logged-out & non-VIP subscriptions)
    if (video.is18Plus || video.groupId === 'group-7') {
      const userTier = subscriptionTiers.find((t) => t.id === currentUser.subscriptionTier);
      if (!isAdmin && !userTier?.allows18Plus) {
        showToast('18+ Mature videos are blurred for your current plan. Upgrade to VIP All-Access to unlock.');
        setPricingModalOpen(true);
        return false;
      }
      if (!isAdmin && currentUser.age < 18) {
        showToast('This video is restricted to viewers 18 years and older.');
        return false;
      }
      if (!isAdmin && !currentUser.isVerified18Plus) {
        setPending18PlusVideo(video);
        setAgeGateModalOpen(true);
        return false;
      }
    }

    // 4. Tier Access Check
    if (video.requiredTier === 'vip' && currentUser.subscriptionTier !== 'vip' && !isAdmin) {
      showToast('This exclusive premiere requires a VIP All-Access subscription.');
      setPricingModalOpen(true);
      return false;
    }
    if (video.requiredTier === 'pro' && currentUser.subscriptionTier === 'free' && !isAdmin) {
      showToast('This title is restricted to Pro and VIP subscribers.');
      setPricingModalOpen(true);
      return false;
    }

    // 5. Ad Injection for Free Tier users (Pro and VIP enjoy 100% ad-free)
    const isAdFree = currentUser.subscriptionTier === 'pro' || currentUser.subscriptionTier === 'vip' || isAdmin;
    if (!isAdFree && video.adSettings?.prerollEnabled && adCampaigns.some((a) => a.active)) {
      // Find matching eligible active ad
      const eligibleAds = adCampaigns.filter(
        (ad) => ad.active && (ad.targetGroupIds.includes('all') || ad.targetGroupIds.includes(video.groupId))
      );
      if (eligibleAds.length > 0) {
        const pickedAd = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
        setActiveAd(pickedAd);
        setAdCountdown(pickedAd.durationSeconds);
        setCanSkipAd(false);

        // Record impression
        setAdCampaigns((prev) =>
          prev.map((ad) =>
            ad.id === pickedAd.id
              ? {
                  ...ad,
                  impressions: ad.impressions + 1,
                  revenueEarned: ad.revenueEarned + pickedAd.estimatedCpm / 1000,
                }
              : ad
          )
        );
        setMonetization((prev) => ({
          ...prev,
          totalAdRevenue: prev.totalAdRevenue + pickedAd.estimatedCpm / 1000,
        }));
      }
    }

    // Set active video & record view
    setActiveVideo(video);
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, views: v.views + 1 } : v))
    );

    // Update user watch history
    if (userControls.enableWatchHistory) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const filtered = prev.watchHistory.filter((item) => item.videoId !== video.id);
        const updated = {
          ...prev,
          watchHistory: [
            { videoId: video.id, watchedAt: new Date().toISOString().split('T')[0], progressPercent: 10 },
            ...filtered,
          ],
        };
        return updated;
      });
    }

    return true;
  };

  // Download Gatekeeper: Enabled across all subscription tiers (Free, Pro, VIP) + Admin
  const downloadVideoWithGate = (video: Video): boolean => {
    if (!currentUser) {
      setPending18PlusVideo(video);
      setAuthModalTab('signup');
      setAuthModalOpen(true);
      showToast('Please create a free account or sign in to download videos.');
      return false;
    }

    if (currentUser.status === 'banned') {
      showToast('Your account has been suspended by platform administration.');
      return false;
    }

    if (video.is18Plus || video.groupId === 'group-7') {
      const userTierCheck = subscriptionTiers.find((t) => t.id === currentUser.subscriptionTier);
      if (!isAdmin && !userTierCheck?.allows18Plus) {
        showToast('18+ Mature videos require a VIP All-Access subscription to unlock or download.');
        setPricingModalOpen(true);
        return false;
      }
      if (!isAdmin && currentUser.age < 18) {
        showToast('This video is restricted to viewers 18 years and older.');
        return false;
      }
      if (!isAdmin && !currentUser.isVerified18Plus) {
        setPending18PlusVideo(video);
        setAgeGateModalOpen(true);
        return false;
      }
    }

    if (video.requiredTier === 'vip' && currentUser.subscriptionTier !== 'vip' && !isAdmin) {
      showToast('This exclusive premiere requires a VIP All-Access subscription.');
      setPricingModalOpen(true);
      return false;
    }
    if (video.requiredTier === 'pro' && currentUser.subscriptionTier === 'free' && !isAdmin) {
      showToast('This title is restricted to Pro and VIP subscribers.');
      setPricingModalOpen(true);
      return false;
    }

    const userTier = subscriptionTiers.find((t) => t.id === currentUser.subscriptionTier);
    if (userTier && userTier.allowsDownloads === false && !isAdmin) {
      showToast('Downloads are currently disabled for this subscription tier.');
      setPricingModalOpen(true);
      return false;
    }

    const rawUrl = (video.videoUrl || '/videos/demo-stream.mp4').trim();
    if (/youtube\.com|youtu\.be|vimeo\.com/i.test(rawUrl)) {
      showToast('External YouTube/Vimeo streams cannot be downloaded as MP4 files.');
      return false;
    }

    const downloadHref = `/api/download-video?url=${encodeURIComponent(rawUrl)}&title=${encodeURIComponent(video.title)}`;
    const link = document.createElement('a');
    link.href = downloadHref;
    link.download = `${video.title.replace(/[^a-zA-Z0-9_-]+/g, '_')}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloading "${video.title}" (${userTier?.maxQuality || 'HD'})...`);
    return true;
  };

  const confirm18PlusConsent = (confirmed: boolean) => {
    setAgeGateModalOpen(false);
    if (confirmed && currentUser) {
      const updatedUser = { ...currentUser, isVerified18Plus: true };
      setCurrentUser(updatedUser);
      setUsersList((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
      showToast('18+ Mature content unlocked for this session.');
      if (pending18PlusVideo) {
        playVideoWithGate(pending18PlusVideo);
        setPending18PlusVideo(null);
      }
    } else {
      setPending18PlusVideo(null);
      showToast('Access to restricted content cancelled.');
    }
  };

  // Auth: Regular User Login
  const loginUser = (email: string, pass: string) => {
    // Check if admin credentials entered here
    if (email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() && pass === ADMIN_CREDENTIALS.password) {
      return loginAdmin(email, pass);
    }

    const found = usersList.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      return { success: false, error: 'No account found with this email. Please create an account.' };
    }
    if (found.status === 'banned') {
      return { success: false, error: 'This account has been banned by administrators.' };
    }

    setCurrentUser(found);
    setAuthModalOpen(false);
    showToast(`Welcome back, ${found.name}!`);
    return { success: true };
  };

  // Auth: User Registration (Account required before watching)
  const signupUser = (data: {
    name: string;
    email: string;
    pass: string;
    birthDate: string;
    tier?: SubscriptionTierId;
    countryCode?: string;
  }) => {
    if (usersList.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    // Compute age from birthDate
    let computedAge = 20;
    if (data.birthDate) {
      const birthYear = new Date(data.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      computedAge = Math.max(12, currentYear - birthYear);
    }

    const countryOption = data.countryCode
      ? COUNTRY_CURRENCIES.find((c) => c.countryCode === data.countryCode)
      : undefined;

    const requestedPaidTier = data.tier && data.tier !== 'free' ? data.tier : null;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      role: 'subscriber',
      status: 'active',
      age: computedAge,
      birthDate: data.birthDate,
      createdAt: new Date().toISOString().split('T')[0],
      subscriptionTier: 'free',
      watchHistory: [],
      savedWatchlist: [],
      isVerified18Plus: computedAge >= 18,
      countryCode: countryOption?.countryCode || data.countryCode || 'RW',
      countryName: countryOption?.countryName || 'Rwanda',
      preferredCurrency: countryOption?.currency || 'RWF',
    };

    setUsersList((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setAuthModalOpen(false);

    if (requestedPaidTier) {
      showToast(
        `Account created! Complete payment in ${newUser.preferredCurrency} to activate ${requestedPaidTier.toUpperCase()}.`
      );
      setPricingModalOpen(true);
    } else {
      showToast(`Account successfully created! Welcome to Stream HUB, ${newUser.name}.`);
      if (pending18PlusVideo) {
        playVideoWithGate(pending18PlusVideo);
        setPending18PlusVideo(null);
      }
    }
    return { success: true };
  };

  // Auth: Hidden Admin Login with credentials email=pascaltechhub@gmail.com and password=Admin@2026
  const loginAdmin = (email: string, pass: string) => {
    if (email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() && pass === ADMIN_CREDENTIALS.password) {
      let adminUser = usersList.find((u) => u.email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase());
      if (!adminUser) {
        adminUser = {
          id: 'usr-admin-01',
          name: ADMIN_CREDENTIALS.name,
          email: ADMIN_CREDENTIALS.email,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          role: 'admin',
          status: 'active',
          age: 32,
          birthDate: '1994-05-14',
          createdAt: '2026-01-01',
          subscriptionTier: 'vip',
          watchHistory: [],
          savedWatchlist: [],
          isVerified18Plus: true,
        };
        setUsersList((prev) => [adminUser!, ...prev]);
      }
      setCurrentUser(adminUser);
      setAuthModalOpen(false);
      setCurrentView('admin-dashboard');
      showToast('Admin Command Center verified & unlocked.');
      return { success: true };
    }
    return { success: false, error: 'Invalid administrator credentials. Access denied.' };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('stream');
    setActiveVideo(null);
    showToast('You have signed out.');
  };

  const upgradeSubscription = (tierId: SubscriptionTierId) => {
    if (!currentUser) {
      openAuthModal('signup');
      return;
    }
    const updated = { ...currentUser, subscriptionTier: tierId };
    setCurrentUser(updated);
    setUsersList((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    
    // Add subscription revenue
    const tier = subscriptionTiers.find((t) => t.id === tierId);
    if (tier && tier.priceMonthly > 0) {
      setMonetization((prev) => ({
        ...prev,
        totalSubscriptionRevenue: prev.totalSubscriptionRevenue + tier.priceMonthly,
      }));
    }
    setPricingModalOpen(false);
    showToast(`Upgraded to ${tier?.name || tierId.toUpperCase()}! Enjoy ad-free premium streaming.`);
  };

  const submitSubscriptionPaymentRequest = (data: {
    tierId: SubscriptionTierId;
    billingCycle: 'monthly' | 'yearly';
    paymentMethod?: 'momo' | 'usdt_trc20';
    senderPhone: string;
    senderName: string;
    screenshotUrl: string;
    transactionId?: string;
    countryName?: string;
    localCurrency?: string;
    localAmount?: number;
    rwfAmount?: number;
    usdtAmount?: number;
    note?: string;
  }): { success: boolean; error?: string } => {
    if (!currentUser) {
      openAuthModal('signup');
      return { success: false, error: 'Please sign in first.' };
    }
    const paymentMethod = data.paymentMethod || 'momo';
    const senderPhone = data.senderPhone.trim();
    const senderName = data.senderName.trim();
    const screenshotUrl = data.screenshotUrl.trim();

    if (!senderPhone || !senderName || !screenshotUrl) {
      return {
        success: false,
        error:
          paymentMethod === 'usdt_trc20'
            ? 'Please enter your sender wallet address/contact, full names, and upload a transfer screenshot.'
            : 'Please enter the sender phone number, sender full names, and upload a payment screenshot.',
      };
    }

    const tier = subscriptionTiers.find((t) => t.id === data.tierId);
    const amount = tier
      ? data.billingCycle === 'monthly'
        ? tier.priceMonthly
        : tier.priceYearly
      : 0;

    const recipient =
      paymentMethod === 'usdt_trc20'
        ? monetization.usdtTrc20Address || 'TAVQFaWipQzMamBjhAKiU83d67gTYKc1wK'
        : monetization.subscriptionPaymentPhone || '+250781301598';

    const newRequest: SubscriptionPaymentRequest = {
      id: `pay-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      requestedTier: data.tierId,
      billingCycle: data.billingCycle,
      paymentMethod,
      amount,
      usdtAmount: data.usdtAmount ?? amount,
      recipientNumber: recipient,
      senderPhone,
      senderName,
      screenshotUrl,
      transactionId: data.transactionId?.trim() || undefined,
      countryName: data.countryName,
      localCurrency: data.localCurrency,
      localAmount: data.localAmount,
      rwfAmount: data.rwfAmount,
      note: data.note?.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setPaymentRequests((prev) => [newRequest, ...prev]);
    setPricingModalOpen(false);
    showToast(
      paymentMethod === 'usdt_trc20'
        ? `USDT (TRC-20) payment proof submitted! Awaiting admin approval under Payment Review.`
        : `Payment proof submitted to ${newRequest.recipientNumber}! Awaiting admin approval under Payment Review.`
    );
    return { success: true };
  };

  const approvePaymentRequest = (requestId: string) => {
    const req = paymentRequests.find((r) => r.id === requestId);
    if (!req || req.status === 'approved') return;

    const today = new Date().toISOString().split('T')[0];
    setPaymentRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approved', reviewedAt: today } : r))
    );

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === req.userId ? { ...u, subscriptionTier: req.requestedTier } : u
      )
    );

    if (currentUser?.id === req.userId) {
      setCurrentUser((prev) =>
        prev ? { ...prev, subscriptionTier: req.requestedTier } : null
      );
    }

    if (req.amount > 0) {
      setMonetization((prev) => ({
        ...prev,
        totalSubscriptionRevenue: prev.totalSubscriptionRevenue + req.amount,
      }));
    }

    showToast(
      `Payment approved! ${req.userName} is now on ${req.requestedTier.toUpperCase()} tier.`
    );
  };

  const rejectPaymentRequest = (requestId: string) => {
    const req = paymentRequests.find((r) => r.id === requestId);
    if (!req || req.status === 'rejected') return;

    const today = new Date().toISOString().split('T')[0];
    setPaymentRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected', reviewedAt: today } : r))
    );
    showToast(`Payment request from ${req.userName} has been rejected.`);
  };

  // Video Actions
  const postVideo = (videoData: Omit<Video, 'id' | 'views' | 'likes' | 'createdAt'>) => {
    const newVid: Video = {
      ...videoData,
      id: `vid-${Date.now()}`,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setVideos((prev) => [newVid, ...prev]);
    showToast(`Video "${newVid.title}" published successfully to group!`);
  };

  const updateVideo = (id: string, updates: Partial<Video>) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    showToast('Video settings saved.');
  };

  const deleteVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    if (activeVideo?.id === id) setActiveVideo(null);
    showToast('Video removed from platform.');
  };

  const toggleWatchlist = (videoId: string) => {
    if (!currentUser) {
      openAuthModal('signin');
      return;
    }
    const hasSaved = currentUser.savedWatchlist.includes(videoId);
    const updatedWatchlist = hasSaved
      ? currentUser.savedWatchlist.filter((id) => id !== videoId)
      : [...currentUser.savedWatchlist, videoId];

    const updatedUser = { ...currentUser, savedWatchlist: updatedWatchlist };
    setCurrentUser(updatedUser);
    setUsersList((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    showToast(hasSaved ? 'Removed from Watchlist' : 'Saved to your Watchlist');
  };

  const toggleLikeVideo = (videoId: string) => {
    if (!currentUser) {
      openAuthModal('signin');
      return;
    }
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, likes: v.likes + 1 } : v))
    );
    showToast('Video added to your liked collection');
  };

  // Ad Actions: Prompt-based generator and management
  const generateAdFromPrompt = async (
    prompt: string,
    targetGroup?: string
  ): Promise<{ success: boolean; ad?: Partial<AdCampaign>; error?: string }> => {
    try {
      const res = await fetch('/api/generate-ad-from-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, targetGroup }),
      });
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      return { success: true, ad: data.ad };
    } catch {
      // Deterministic client-side AI prompt generator engine if backend unreachable
      const lower = prompt.toLowerCase();
      let theme: 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan' | 'violet' = 'indigo';
      let brand = 'Quantum Sponsor';
      let cta = 'Learn More';
      let cpm = 17.50;

      if (lower.includes('vpn') || lower.includes('security') || lower.includes('privacy')) {
        theme = 'cyan';
        brand = 'Aegis Sentinel VPN';
        cta = 'Shield Your IP';
        cpm = 23.50;
      } else if (lower.includes('energy') || lower.includes('sport') || lower.includes('fitness')) {
        theme = 'amber';
        brand = 'NitroPulse Sport Fuel';
        cta = 'Grab 20% Discount';
        cpm = 18.00;
      } else if (lower.includes('game') || lower.includes('esport')) {
        theme = 'rose';
        brand = 'Vortex Arena Rig';
        cta = 'Play Alpha Now';
        cpm = 21.00;
      } else if (lower.includes('tech') || lower.includes('ai') || lower.includes('software')) {
        theme = 'violet';
        brand = 'NexusFlow AI Engine';
        cta = 'Deploy Free';
        cpm = 26.00;
      }

      const generatedAd: Partial<AdCampaign> = {
        prompt,
        title: prompt.slice(0, 32),
        brandName: brand,
        headline: prompt.slice(0, 48),
        tagline: `Promoted ad campaign generated from prompt: "${prompt}".`,
        ctaText: cta,
        ctaUrl: 'https://streamhub.video/promo',
        format: lower.includes('banner') ? 'sponsor_banner' : lower.includes('midroll') ? 'midroll_overlay' : 'preroll',
        themeColor: theme,
        durationSeconds: 8,
        skipDelaySeconds: 5,
        visualVibe: 'Cinematic ambient gradient with high-conversion typography',
        estimatedCpm: cpm,
        targetGroupIds: targetGroup && targetGroup !== 'all' ? [targetGroup] : ['all'],
      };
      return { success: true, ad: generatedAd };
    }
  };

  const addAdCampaign = (
    campaignData: Omit<AdCampaign, 'id' | 'impressions' | 'clicks' | 'revenueEarned' | 'createdAt'>
  ) => {
    const newAd: AdCampaign = {
      ...campaignData,
      id: `ad-${Date.now()}`,
      impressions: 0,
      clicks: 0,
      revenueEarned: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAdCampaigns((prev) => [newAd, ...prev]);
    showToast(`Ad campaign "${newAd.title}" launched across targeted video streams!`);
  };

  const updateAdCampaign = (adId: string, updates: Partial<AdCampaign>) => {
    setAdCampaigns((prev) =>
      prev.map((ad) => (ad.id === adId ? { ...ad, ...updates } : ad))
    );
    showToast('Ad campaign details updated.');
  };

  const toggleAdActive = (adId: string) => {
    setAdCampaigns((prev) =>
      prev.map((ad) => (ad.id === adId ? { ...ad, active: !ad.active } : ad))
    );
    showToast('Ad campaign status updated.');
  };

  const deleteAdCampaign = (adId: string) => {
    setAdCampaigns((prev) => prev.filter((ad) => ad.id !== adId));
    showToast('Ad campaign deleted.');
  };

  // User management & Controls
  const updateUserRole = (userId: string, role: UserRole) => {
    setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role } : null));
    }
    showToast(`User role updated to ${role.toUpperCase()}`);
  };

  const updateUserStatus = (userId: string, status: UserStatus) => {
    setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, status } : null));
    }
    showToast(`User status set to ${status}`);
  };

  const updateUserSubscription = (userId: string, tierId: SubscriptionTierId) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, subscriptionTier: tierId } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, subscriptionTier: tierId } : null));
    }
    showToast(`User subscription updated to ${tierId.toUpperCase()}`);
  };

  const updateUserControls = (controls: Partial<UserDashboardControls>) => {
    setUserControls((prev) => ({ ...prev, ...controls }));
    showToast('User dashboard feature permissions saved.');
  };

  const updateMonetization = (settings: Partial<MonetizationSettings>) => {
    setMonetization((prev) => ({ ...prev, ...settings }));
    showToast('Monetization settings & payout rules saved.');
  };

  const updateSubscriptionTier = (tierId: SubscriptionTierId, updates: Partial<SubscriptionTier>) => {
    setSubscriptionTiers((prev) =>
      prev.map((tier) => (tier.id === tierId ? { ...tier, ...updates } : tier))
    );
    showToast('Subscription tier parameters updated.');
  };

  const updateSiteConfig = (updates: Partial<SiteConfig>) => {
    setSiteConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetSiteConfig = () => {
    setSiteConfig(INITIAL_SITE_CONFIG);
    setVideoGroups(INITIAL_GROUPS);
    localStorage.setItem('streamhub_site_config', JSON.stringify(INITIAL_SITE_CONFIG));
    localStorage.setItem('streamhub_video_groups', JSON.stringify(INITIAL_GROUPS));
    showToast('Website texts, images, and channels restored to defaults.');
  };

  const applySitePrompt = async (
    prompt: string,
    attachedImageUrl?: string
  ): Promise<{ success: boolean; summary?: string; source?: string; error?: string }> => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt && !attachedImageUrl) {
      return { success: false, error: 'Please enter a prompt or attach an image.' };
    }

    try {
      const response = await fetch('/api/apply-site-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt || 'Update hero cover image with attached upload',
          currentSiteConfig: siteConfig,
          currentTiers: subscriptionTiers,
          currentGroups: videoGroups,
          attachedImageUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.result) {
        return { success: false, error: data.error || 'Failed to apply website prompt.' };
      }

      const { summary, siteConfigPatch, tierUpdates, newChannels, renameChannels } = data.result;

      // Save snapshot for single-click undo
      setLastSiteSnapshot({
        siteConfig,
        subscriptionTiers,
        videoGroups,
      });

      // Compute next state synchronously so localStorage updates before iframe reload
      let nextSiteConfig = siteConfig;
      if (siteConfigPatch && typeof siteConfigPatch === 'object') {
        nextSiteConfig = { ...siteConfig, ...siteConfigPatch };
      }
      if (attachedImageUrl && !siteConfigPatch?.siteLogoUrl && !siteConfigPatch?.heroBannerImageUrl) {
        nextSiteConfig = { ...nextSiteConfig, heroBannerImageUrl: attachedImageUrl };
      }

      let nextTiers = subscriptionTiers;
      if (Array.isArray(tierUpdates) && tierUpdates.length > 0) {
        nextTiers = subscriptionTiers.map((tier) => {
          const patch = tierUpdates.find((u: any) => u?.id === tier.id);
          return patch ? { ...tier, ...patch } : tier;
        });
      }

      let nextGroups = [...videoGroups];
      if (Array.isArray(renameChannels) && renameChannels.length > 0) {
        nextGroups = nextGroups.map((g) => {
          const patch = renameChannels.find((u: any) => u?.id === g.id);
          return patch ? { ...g, ...patch } : g;
        });
      }
      if (Array.isArray(newChannels) && newChannels.length > 0) {
        newChannels.forEach((ch: any, idx: number) => {
          if (!ch?.name?.trim()) return;
          const alreadyExists = nextGroups.some(
            (g) => g.name.toLowerCase() === ch.name.trim().toLowerCase()
          );
          if (alreadyExists) return;
          const newId = `group-${Date.now()}-${idx}`;
          const slug = ch.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          nextGroups.push({
            id: newId,
            index: nextGroups.length + 1,
            name: ch.name.trim(),
            slug: slug || newId,
            description: ch.description?.trim() || `Curated ${ch.name.trim()} streams.`,
            is18Plus: Boolean(ch.is18Plus),
            accentColor: ch.accentColor || '#f43f5e',
            badgeText: ch.is18Plus ? '18+ RESTRICTED' : undefined,
            videoCount: 0,
          });
        });
      }

      // Persist synchronously to localStorage before updating React state & refreshing preview iframe
      localStorage.setItem('streamhub_site_config', JSON.stringify(nextSiteConfig));
      localStorage.setItem('pascalhub_tiers', JSON.stringify(nextTiers));
      localStorage.setItem('streamhub_video_groups', JSON.stringify(nextGroups));

      setSiteConfig(nextSiteConfig);
      setSubscriptionTiers(nextTiers);
      setVideoGroups(nextGroups);

      const historyEntry = {
        id: `prompt-${Date.now()}`,
        prompt: cleanPrompt || 'Updated image via upload',
        summary: summary || 'Applied prompt updates to live website.',
        source: data.source || 'gemini',
        createdAt: new Date().toISOString(),
      };
      setSitePromptHistory((prev) => {
        const updated = [historyEntry, ...prev].slice(0, 20);
        try {
          localStorage.setItem('streamhub_prompt_history', JSON.stringify(updated));
        } catch {
          // ignore storage quota
        }
        return updated;
      });

      showToast(historyEntry.summary);
      return { success: true, summary: historyEntry.summary, source: data.source };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error applying prompt.' };
    }
  };

  const undoLastSitePrompt = () => {
    if (!lastSiteSnapshot) return;
    localStorage.setItem('streamhub_site_config', JSON.stringify(lastSiteSnapshot.siteConfig));
    localStorage.setItem('pascalhub_tiers', JSON.stringify(lastSiteSnapshot.subscriptionTiers));
    localStorage.setItem('streamhub_video_groups', JSON.stringify(lastSiteSnapshot.videoGroups));
    setSiteConfig(lastSiteSnapshot.siteConfig);
    setSubscriptionTiers(lastSiteSnapshot.subscriptionTiers);
    setVideoGroups(lastSiteSnapshot.videoGroups);
    setLastSiteSnapshot(null);
    showToast('Reverted last AI Studio prompt change.');
  };

  const updateVideoGroup = (groupId: string, updates: Partial<VideoGroup>) => {
    setVideoGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
    if (typeof updates.is18Plus === 'boolean') {
      setVideos((prev) =>
        prev.map((v) => (v.groupId === groupId ? { ...v, is18Plus: updates.is18Plus! } : v))
      );
    }
    showToast('Channel updated.');
  };

  const addVideoGroup = (group: {
    name: string;
    description: string;
    is18Plus: boolean;
    accentColor: string;
    badgeText?: string;
  }) => {
    const newId = `group-${Date.now()}`;
    const slug = group.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const newGroup: VideoGroup = {
      id: newId,
      index: videoGroups.length + 1,
      name: group.name.trim(),
      slug: slug || newId,
      description: group.description.trim() || 'Custom curated channel.',
      is18Plus: group.is18Plus,
      accentColor: group.accentColor || '#f43f5e',
      badgeText: group.badgeText?.trim() || (group.is18Plus ? '18+ RESTRICTED' : undefined),
      videoCount: 0,
    };
    setVideoGroups((prev) => [...prev, newGroup]);
    showToast(`Channel "${newGroup.name}" added!`);
  };

  const deleteVideoGroup = (groupId: string) => {
    if (videoGroups.length <= 1) {
      showToast('At least one channel must remain on the platform.');
      return;
    }
    setVideoGroups((prev) =>
      prev
        .filter((g) => g.id !== groupId)
        .map((g, idx) => ({ ...g, index: idx + 1 }))
    );
    if (selectedGroupId === groupId) setSelectedGroupId('all');
    showToast('Channel removed.');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAdmin,
        videos,
        videoGroups,
        adCampaigns,
        subscriptionTiers,
        monetization,
        userControls,
        usersList,
        analytics,
        siteConfig,
        currentView,
        setCurrentView,
        adminActiveTab,
        setAdminActiveTab,
        selectedGroupId,
        setSelectedGroupId,
        searchQuery,
        setSearchQuery,
        activeVideo,
        setActiveVideo,
        playVideoWithGate,
        downloadVideoWithGate,
        activeAd,
        adCountdown,
        canSkipAd,
        dismissCurrentAd,
        recordAdClick,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        ageGateModalOpen,
        setAgeGateModalOpen,
        pending18PlusVideo,
        confirm18PlusConsent,
        pricingModalOpen,
        setPricingModalOpen,
        communityPopupOpen,
        setCommunityPopupOpen,
        isVideo18PlusBlurred,
        loginUser,
        signupUser,
        loginAdmin,
        logout,
        upgradeSubscription,
        postVideo,
        updateVideo,
        deleteVideo,
        toggleWatchlist,
        toggleLikeVideo,
        generateAdFromPrompt,
        addAdCampaign,
        updateAdCampaign,
        toggleAdActive,
        deleteAdCampaign,
        updateUserRole,
        updateUserStatus,
        updateUserSubscription,
        updateUserControls,
        updateMonetization,
        updateSubscriptionTier,
        updateSiteConfig,
        resetSiteConfig,
        applySitePrompt,
        undoLastSitePrompt,
        canUndoSitePrompt: Boolean(lastSiteSnapshot),
        sitePromptHistory,
        updateVideoGroup,
        addVideoGroup,
        deleteVideoGroup,
        paymentRequests,
        submitSubscriptionPaymentRequest,
        approvePaymentRequest,
        rejectPaymentRequest,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
