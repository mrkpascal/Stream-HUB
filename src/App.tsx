/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { StreamView } from './components/stream/StreamView';
import { VideoPlayer } from './components/player/VideoPlayer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserDashboard } from './components/user/UserDashboard';
import { AuthModal } from './components/modals/AuthModal';
import { AgeGateModal } from './components/modals/AgeGateModal';
import { PricingModal } from './components/modals/PricingModal';
import { CommunityPopupModal } from './components/modals/CommunityPopupModal';
import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    activeVideo,
    setActiveVideo,
    dismissCurrentAd,
    isAdmin,
    toastMessage,
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans selection:bg-rose-600 selection:text-white">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-neutral-700 bg-neutral-900/95 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar />

      {/* Main View Router */}
      <main className="flex-1">
        {/* If an active video is chosen, render the dedicated player viewport */}
        {activeVideo ? (
          <div className="animate-in fade-in duration-150">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
              <button
                onClick={() => {
                  setActiveVideo(null);
                  dismissCurrentAd();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Stream Catalog</span>
              </button>
            </div>
            <VideoPlayer video={activeVideo} onClose={() => setActiveVideo(null)} />
          </div>
        ) : (
          <>
            {currentView === 'stream' && <StreamView />}
            
            {currentView === 'admin-dashboard' && (
              isAdmin ? (
                <AdminDashboard />
              ) : (
                <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
                  <ShieldAlert className="h-10 w-10 text-red-500 mx-auto" />
                  <h2 className="font-heading text-xl font-bold text-white">
                    Administrator Authentication Required
                  </h2>
                  <p className="text-xs text-neutral-400">
                    This command suite is strictly restricted to master administrative credentials.
                  </p>
                  <button
                    onClick={() => setCurrentView('stream')}
                    className="rounded-lg bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
                  >
                    Return to Video Stream
                  </button>
                </div>
              )
            )}

            {currentView === 'user-dashboard' && <UserDashboard />}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals */}
      <AuthModal />
      <AgeGateModal />
      <PricingModal />
      <CommunityPopupModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
