import { useState, useEffect } from 'react';
import { Download, X, BellRing } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show custom install banner
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if push notifications are supported and not yet subscribed
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          if (!subscription && Notification.permission !== 'denied') {
            setShowPushBanner(true);
          }
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    setShowInstallBanner(false);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      }
      setDeferredPrompt(null);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribePush = async () => {
    try {
      setShowPushBanner(false);
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // Fetch public key from backend
        const { data } = await api.get('/push/vapidPublicKey');
        const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        await api.post('/push/subscribe', subscription);
        toast.success('Subscribed to notifications!');
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to subscribe to notifications');
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-0 left-0 md:left-auto md:right-6 px-4 z-50 flex flex-col gap-3 max-w-sm ml-auto">
      {showInstallBanner && (
        <div className="glass-card p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4 bg-[#13141f]">
          <div className="bg-[#ff6b00]/20 p-2 rounded-lg text-[#ff6b00]">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-white text-sm font-bold">Add to Home Screen</h4>
            <p className="text-slate-400 text-xs">Install StudentTracker for a better experience</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleInstall} className="text-xs font-bold bg-[#ff6b00] text-white px-3 py-1.5 rounded-lg">Install</button>
            <button onClick={() => setShowInstallBanner(false)} className="text-slate-400 hover:text-white p-1"><X className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      {showPushBanner && (
        <div className="glass-card p-4 rounded-xl border border-white/10 shadow-2xl flex items-center gap-4 bg-[#13141f]">
          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-white text-sm font-bold">Enable Notifications</h4>
            <p className="text-slate-400 text-xs">Get interview reminders directly to your device</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSubscribePush} className="text-xs font-bold bg-blue-500 text-white px-3 py-1.5 rounded-lg">Enable</button>
            <button onClick={() => setShowPushBanner(false)} className="text-slate-400 hover:text-white p-1"><X className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallPWA;
