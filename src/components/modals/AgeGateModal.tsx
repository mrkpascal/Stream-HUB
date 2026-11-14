import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, Check, X, Lock } from 'lucide-react';

export const AgeGateModal: React.FC = () => {
  const {
    ageGateModalOpen,
    pending18PlusVideo,
    confirm18PlusConsent,
    currentUser,
  } = useApp();

  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  if (!ageGateModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/30 bg-neutral-900 shadow-2xl">
        
        {/* Warning Accent Banner */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-red-200" />
            <h3 className="font-heading font-bold text-base tracking-tight">
              Age Verification Required (18+)
            </h3>
          </div>
          <button
            onClick={() => confirm18PlusConsent(false)}
            className="rounded p-1 text-white/80 hover:bg-black/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-200 leading-relaxed">
            <p className="font-semibold text-red-300 mb-1">
              Channel 7: 18+ Mature & Late Night Content
            </p>
            You are attempting to access restricted material:
            {pending18PlusVideo && (
              <span className="block font-medium text-white mt-1 italic">
                "{pending18PlusVideo.title}"
              </span>
            )}
            This content contains unfiltered adult comedy, uncensored midnight cinema, intense horror, or mature themes strictly intended for viewers 18 years of age or older.
          </div>

          <div className="space-y-2 text-xs text-neutral-300">
            <p>
              Your account status: <span className="font-semibold text-white">{currentUser?.name}</span> (Age: {currentUser?.age})
            </p>
            {currentUser && currentUser.age < 18 ? (
              <p className="text-red-400 font-medium">
                Our records indicate you are currently under 18 years old. Access to this category is legally prohibited.
              </p>
            ) : (
              <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-red-600 focus:ring-red-500"
                />
                <span className="text-neutral-300 text-xs leading-normal">
                  I solemnly affirm that I am at least 18 years old and consent to viewing uncensored mature media in this category.
                </span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-neutral-800">
            <button
              onClick={() => confirm18PlusConsent(false)}
              className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 py-2.5 text-xs font-medium text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors"
            >
              Exit to All Ages
            </button>
            <button
              disabled={!hasAcknowledged || (currentUser ? currentUser.age < 18 : false)}
              onClick={() => confirm18PlusConsent(true)}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-900/40 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Confirm Age & Stream
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
