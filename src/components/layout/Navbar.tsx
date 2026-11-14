import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Play,
  Film,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Sliders,
  Crown,
  Search,
  Lock,
  MessageCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    currentView,
    setCurrentView,
    openAuthModal,
    logout,
    searchQuery,
    setSearchQuery,
    videoGroups,
    selectedGroupId,
    setSelectedGroupId,
    setPricingModalOpen,
    setCommunityPopupOpen,
    siteConfig,
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (currentView !== 'stream') setCurrentView('stream');
  };

  const handleCategoryChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    if (currentView !== 'stream') setCurrentView('stream');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      {siteConfig.announcementBarEnabled && siteConfig.announcementBarText?.trim() && (
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 px-4 py-1.5 text-center text-[11px] font-semibold text-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{siteConfig.announcementBarText}</span>
          </div>
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text element wordmark + Desktop Search */}
        <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0">
          <button
            onClick={() => setCurrentView('stream')}
            className="group flex shrink-0 items-center gap-2.5 text-left focus-visible:outline-none cursor-pointer"
          >
            {siteConfig.siteLogoUrl ? (
              <img
                src={siteConfig.siteLogoUrl}
                alt={siteConfig.siteName}
                className="h-9 w-9 rounded-lg object-cover border border-neutral-700 shadow-lg transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white shadow-lg shadow-rose-900/20 transition-transform group-hover:scale-105">
                <Play className="h-4 w-4 fill-white" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-white transition-colors group-hover:text-rose-400">
                {siteConfig.siteName}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                {siteConfig.siteSlogan}
              </span>
            </div>
          </button>

          {/* Real-Time Title & Category Search Bar (Desktop) */}
          <div className="relative hidden md:flex items-center flex-1 max-w-md rounded-full border border-neutral-800 bg-neutral-900/80 focus-within:border-rose-500 focus-within:bg-neutral-900 transition-colors">
            <Search className="ml-3 h-3.5 w-3.5 shrink-0 text-neutral-500" />
            <input
              type="text"
              aria-label="Search videos by title or category"
              placeholder="Search title or category (e.g. Movies, Gaming)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-transparent py-1.5 pl-2.5 pr-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 text-[10px] text-neutral-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
            <select
              aria-label="Filter by category"
              value={selectedGroupId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="mr-1 rounded-full border-l border-neutral-800 bg-neutral-900 py-1 pl-2 pr-2 text-[11px] font-medium text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {videoGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <button
            onClick={() => setCurrentView('stream')}
            className={`whitespace-nowrap transition-colors ${
              currentView === 'stream'
                ? 'font-semibold text-rose-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Video Stream
          </button>

          <button
            onClick={() => setPricingModalOpen(true)}
            className="flex items-center gap-1.5 whitespace-nowrap text-neutral-400 transition-colors hover:text-amber-400 cursor-pointer"
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span>VIP Tiers</span>
          </button>

          <button
            onClick={() => setCommunityPopupOpen(true)}
            className="flex items-center gap-1.5 whitespace-nowrap text-emerald-400 transition-colors hover:text-emerald-300 cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Updates &amp; Chat</span>
          </button>

          {currentUser && (
            <button
              onClick={() => setCurrentView('user-dashboard')}
              className={`whitespace-nowrap transition-colors ${
                currentView === 'user-dashboard'
                  ? 'font-semibold text-rose-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              My Dashboard
            </button>
          )}

          {/* Elevated Admin quick button ONLY visible if already authenticated as Admin */}
          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin-dashboard')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                currentView === 'admin-dashboard'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-rose-500" />
              <span>Admin Center</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Actions & User State */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 rounded-full border border-neutral-800 bg-neutral-900/80 p-1 pr-3 text-xs text-neutral-200 transition-all hover:border-neutral-700 hover:bg-neutral-800 focus:outline-none"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full object-cover border border-neutral-700"
                />
                <span className="hidden font-medium max-w-[120px] truncate sm:inline">
                  {currentUser.name}
                </span>
                <span
                  className={`hidden rounded px-1.5 py-0.5 text-[10px] font-bold uppercase sm:inline ${
                    currentUser.subscriptionTier === 'vip'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : currentUser.subscriptionTier === 'pro'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {currentUser.subscriptionTier}
                </span>
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-900 p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="border-b border-neutral-800 px-3 py-2.5">
                    <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{currentUser.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-400">
                      <span>Age: {currentUser.age}</span>
                      <span>·</span>
                      <span className={currentUser.isVerified18Plus ? 'text-emerald-400' : 'text-amber-400'}>
                        {currentUser.isVerified18Plus ? '18+ Verified' : 'Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setCurrentView('user-dashboard');
                        setUserDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-neutral-400" />
                      <span>My Dashboard & Saved</span>
                    </button>

                    <button
                      onClick={() => {
                        setPricingModalOpen(true);
                        setUserDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    >
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                      <span>Subscription & Ad-Free</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setCurrentView('admin-dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 font-medium"
                      >
                        <Sliders className="h-3.5 w-3.5 text-rose-400" />
                        <span>Admin Command Center</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-neutral-800 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:text-white"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-900/30 transition-all hover:from-rose-500 hover:to-rose-600 focus:outline-none"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Real-Time Search & Category Filter Row */}
      <div className="border-t border-neutral-800/60 px-4 py-2 md:hidden">
        <div className="flex items-center rounded-full border border-neutral-800 bg-neutral-900/90 focus-within:border-rose-500 transition-colors">
          <Search className="ml-3 h-3.5 w-3.5 shrink-0 text-neutral-500" />
          <input
            type="text"
            aria-label="Search videos by title or category"
            placeholder="Search title or category..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-transparent py-1.5 pl-2.5 pr-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-2 text-[10px] text-neutral-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          )}
          <select
            aria-label="Filter by category"
            value={selectedGroupId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="mr-1 rounded-full border-l border-neutral-800 bg-neutral-900 py-1 pl-2 pr-2 text-[11px] font-medium text-neutral-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All</option>
            {videoGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
