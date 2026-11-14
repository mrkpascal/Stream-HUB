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
  INITIAL_ANALYTICS,
} from '../data/initialData';

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
  
  // Navigation & View State
  currentView: 'stream' | 'admin-dashboard' | 'user-dashboard' | 'pricing';
  setCurrentView: (view: 'stream' | 'admin-dashboard' | 'user-dashboard' | 'pricing') => void;
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Active Playback & Ads
  activeVideo: Video | null;
  setActiveVideo: (video: Video | null) => void;
  playVideoWithGate: (video: Video) => boolean;
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

  // Authentication Actions
  loginUser: (email: string, pass: string) => { success: boolean; error?: string };
  signupUser: (data: { name: string; email: string; pass: string; birthDate: string; tier?: SubscriptionTierId }) => { success: boolean; error?: string };
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
  toggleAdActive: (adId: string) => void;
  deleteAdCampaign: (adId: string) => void;

  // Admin Controls & Settings
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  updateUserControls: (controls: Partial<UserDashboardControls>) => void;
  updateMonetization: (settings: Partial<MonetizationSettings>) => void;
  updateSubscriptionTier: (tierId: SubscriptionTierId, updates: Partial<SubscriptionTier>) => void;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or use initial defaults
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pascalhub_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [videos, setVideos] = useState<Video[]>(() => {
    const saved = localStorage.getItem('pascalhub_videos');
    if (!saved) return INITIAL_VIDEOS;
    const parsed: Video[] = JSON.parse(saved);
    return parsed.map((vid) => {
      if (vid.videoUrl?.includes('commondatastorage.googleapis.com/gtv-videos-bucket/sample/')) {
        const replacement = INITIAL_VIDEOS.find((v) => v.id === vid.id)?.videoUrl || '/videos/demo-stream.mp4';
        return { ...vid, videoUrl: replacement };
      }
      return vid;
    });
  });

  const [videoGroups, setVideoGroups] = useState<VideoGroup[]>(INITIAL_GROUPS);

  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>(() => {
    const saved = localStorage.getItem('pascalhub_ads');
    return saved ? JSON.parse(saved) : INITIAL_ADS;
  });

  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>(() => {
    const saved = localStorage.getItem('pascalhub_tiers');
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTION_TIERS;
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

  const [analytics, setAnalytics] = useState<AnalyticsMetric[]>(INITIAL_ANALYTICS);

  // View state
  const [currentView, setCurrentView] = useState<'stream' | 'admin-dashboard' | 'user-dashboard' | 'pricing'>('stream');
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

    // 3. 18+ Age Check
    if (video.is18Plus || video.groupId === 'group-7') {
      // Check user age
      if (currentUser.age < 18) {
        showToast('This video is restricted to viewers 18 years and older.');
        return false;
      }
      if (!currentUser.isVerified18Plus) {
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
      subscriptionTier: data.tier || 'free',
      watchHistory: [],
      savedWatchlist: [],
      isVerified18Plus: computedAge >= 18,
    };

    setUsersList((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setAuthModalOpen(false);
    showToast(`Account successfully created! Welcome to PascalHub, ${newUser.name}.`);

    if (pending18PlusVideo) {
      playVideoWithGate(pending18PlusVideo);
      setPending18PlusVideo(null);
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
        ctaUrl: 'https://pascalhub.stream/promo',
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
        currentView,
        setCurrentView,
        selectedGroupId,
        setSelectedGroupId,
        searchQuery,
        setSearchQuery,
        activeVideo,
        setActiveVideo,
        playVideoWithGate,
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
        toggleAdActive,
        deleteAdCampaign,
        updateUserRole,
        updateUserStatus,
        updateUserControls,
        updateMonetization,
        updateSubscriptionTier,
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
