import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { LanguageCode } from '../../types';
import {
  getQueuedActions,
  syncPendingActions,
} from '../../services/offlineSyncService';

interface OfflineIndicatorProps {
  currentLanguage?: LanguageCode;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ currentLanguage = 'hi' }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncedBanner, setSyncedBanner] = useState<boolean>(false);

  const checkQueue = () => {
    setQueuedCount(getQueuedActions().length);
  };

  useEffect(() => {
    checkQueue();
    const handleQueueChange = () => checkQueue();

    const handleOnline = async () => {
      setIsOnline(true);
      const pending = getQueuedActions().length;
      if (pending > 0) {
        setSyncing(true);
        const res = await syncPendingActions();
        setSyncing(false);
        checkQueue();
        if (res.syncedCount > 0) {
          setSyncedBanner(true);
          setTimeout(() => setSyncedBanner(false), 3500);
        }
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('kisansaathi_queue_changed', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('kisansaathi_queue_changed', handleQueueChange);
    };
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    const res = await syncPendingActions();
    setSyncing(false);
    checkQueue();
    if (res.syncedCount > 0) {
      setSyncedBanner(true);
      setTimeout(() => setSyncedBanner(false), 3500);
    }
  };

  const isHi = currentLanguage === 'hi';

  if (isOnline && !syncedBanner && queuedCount === 0) return null;

  return (
    <div className="fixed top-2 inset-x-4 z-50 flex items-center justify-center pointer-events-none">
      {!isOnline ? (
        <div className="flex items-center gap-2.5 rounded-2xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xl pointer-events-auto border border-amber-400/50 backdrop-blur-md">
          <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
          <span>
            {isHi
              ? `ऑफ़लाइन मोड — स्थानीय ड्राफ्ट व कैश्ड डेटा लोड`
              : `Offline Mode — Local draft caching active`}
            {queuedCount > 0 && (
              <strong className="ml-1.5 underline">
                ({queuedCount} {isHi ? 'कार्य कतार में' : 'queued'})
              </strong>
            )}
          </span>
        </div>
      ) : syncedBanner ? (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xl pointer-events-auto border border-emerald-400/50 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {isHi
              ? 'इंटरनेट वापस आया — सभी ऑफ़लाइन ड्राफ्ट व कार्य सफलतापूर्वक सिंक हो गए!'
              : 'Connection Restored — All queued actions and drafts synchronized!'}
          </span>
        </div>
      ) : queuedCount > 0 ? (
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#245C3A] px-4 py-2 text-xs font-semibold text-white shadow-xl pointer-events-auto border border-[#5F8F45]/50">
          <Wifi className="w-4 h-4 text-[#D6A63A] shrink-0" />
          <span>
            {queuedCount} {isHi ? 'ऑफ़लाइन कार्य सिंक हेतु तैयार हैं' : 'offline items ready to sync'}
          </span>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="ml-2 px-2.5 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            <span>{isHi ? 'सिंक करें' : 'Sync Now'}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};
