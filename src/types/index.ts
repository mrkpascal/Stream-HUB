export type UserRole = 'admin' | 'moderator' | 'subscriber' | 'vip';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type SubscriptionTierId = 'free' | 'pro' | 'vip';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  status: UserStatus;
  age: number;
  birthDate?: string;
  createdAt: string;
  subscriptionTier: SubscriptionTierId;
  watchHistory: { videoId: string; watchedAt: string; progressPercent: number }[];
  savedWatchlist: string[];
  isVerified18Plus?: boolean;
}

export interface VideoGroup {
  id: string;
  index: number;
  name: string;
  slug: string;
  description: string;
  is18Plus: boolean;
  accentColor: string;
  badgeText?: string;
  videoCount: number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  groupId: string; // group-1 to group-7
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  durationSeconds: number;
  views: number;
  likes: number;
  createdAt: string;
  requiredTier: SubscriptionTierId;
  is18Plus: boolean;
  tags: string[];
  creatorName: string;
  featured?: boolean;
  adSettings: {
    prerollEnabled: boolean;
    midrollEnabled: boolean;
  };
}

export type AdFormat = 'preroll' | 'midroll_overlay' | 'sponsor_banner';
export type AdThemeColor = 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan' | 'violet';

export interface AdCampaign {
  id: string;
  prompt: string; // The prompt entered by admin
  title: string;
  brandName: string;
  headline: string;
  tagline: string;
  ctaText: string;
  ctaUrl: string;
  format: AdFormat;
  themeColor: AdThemeColor;
  durationSeconds: number;
  skipDelaySeconds: number;
  visualVibe: string;
  estimatedCpm: number;
  sampleVideoUrl?: string;
  impressions: number;
  clicks: number;
  revenueEarned: number;
  active: boolean;
  targetGroupIds: string[]; // 'all' or specific group ids
  createdAt: string;
}

export interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  badge: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  recommended?: boolean;
  active: boolean;
  maxQuality: '720p' | '1080p Full HD' | '4K Ultra HD';
  adFree: boolean;
  allows18Plus: boolean;
}

export interface UserDashboardControls {
  allowUserPlaylists: boolean;
  allowUserComments: boolean;
  enableWatchHistory: boolean;
  allowUserUploadRequests: boolean;
  enableCommunityDiscussions: boolean;
  strictAgeEnforcement: boolean;
  allowPipMode: boolean;
}

export interface MonetizationSettings {
  adRevenueSharePercent: number; // e.g. 70
  creatorPoolPercent: number; // e.g. 20
  platformFeePercent: number; // e.g. 10
  minimumPayout: number; // e.g. $50
  currency: string;
  paymentGatewaySandbox: boolean;
  totalAdRevenue: number;
  totalSubscriptionRevenue: number;
  autoApprovePayouts: boolean;
  adsenseEnabled: boolean;
  adsenseClientId: string;
  adsenseDisplaySlotId: string;
  adsenseSidebarSlotId: string;
}

export interface AnalyticsMetric {
  date: string;
  views: number;
  adImpressions: number;
  watchTimeHours: number;
  adRevenue: number;
  subRevenue: number;
}
