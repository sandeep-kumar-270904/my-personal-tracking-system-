import React, { useState, useEffect, useRef } from 'react';
import { Camera, AlertCircle, Eye, Monitor } from 'lucide-react';

export default function HumanPresenceTrainer() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [eyeContactLost, setEyeContactLost] = useState(false);

  // Mock tracking for eye contact
  const trackingInterval = useRef(null);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsTraining(true);
      
      // Mock tracking logic
      trackingInterval.current = setInterval(() => {
        // Randomly simulate looking away 10% of the time
        if (Math.random() > 0.9) {
          setEyeContactLost(true);
          setTimeout(() => setEyeContactLost(false), 2000);
        }
      }, 3000);

    } catch (e) {
      console.error(e);
      alert('Camera access is required for Human Presence training.');
    }
  };

  const stopVideo = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsTraining(false);
    if (trackingInterval.current) clearInterval(trackingInterval.current);
    setEyeContactLost(false);
  };

  useEffect(() => {
    return () => stopVideo();
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Camera className="w-6 h-6 mr-2 text-cyan-400" />
        Human Presence (Video)
      </h2>
      <p className="text-gray-400 mb-6 text-sm">Train your on-camera composure. We track eye-contact with the lens (not the screen) and lighting setup.</p>

      {!isTraining ? (
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center">
          <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Camera Permissions Required</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">We use your local camera feed to analyze eye contact and lighting. Video is never uploaded to our servers.</p>
          <button onClick={startVideo} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-lg transition-colors">
            Enable Camera & Start
          </button>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video border-2 border-gray-800">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transform -scale-x-100 ${eyeContactLost ? 'opacity-50' : ''}`} 
          />
          
          {/* Overlay UI */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-2"></span>
              REC_LOCAL_ONLY
            </div>
            <button onClick={stopVideo} className="bg-gray-900/80 hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold">
              End Session
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-center">
            {eyeContactLost ? (
              <div className="bg-rose-900/90 border border-rose-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg animate-bounce">
                <AlertCircle className="w-5 h-5 mr-2 text-rose-300" />
                <span className="font-bold text-sm">Look at the camera lens!</span>
              </div>
            ) : (
              <div className="bg-emerald-900/80 border border-emerald-500/50 text-white px-4 py-2 rounded-lg flex items-center">
                <Eye className="w-4 h-4 mr-2 text-emerald-400" />
                <span className="font-bold text-xs">Eye contact locked. Good.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
