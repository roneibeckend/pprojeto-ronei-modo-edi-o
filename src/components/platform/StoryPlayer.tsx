import React, { useState, useRef, useEffect } from "react";
import { X, Maximize2, Minimize2, Volume2, VolumeX, Play, Pause } from "lucide-react";

interface StoryPlayerProps {
  url: string;
  onClose: () => void;
  title?: string;
}

export function StoryPlayer({ url, onClose, title }: StoryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted) {
      video.muted = false;
      video.removeAttribute('muted');
      setIsMuted(false);
      
      if (video.paused) {
        try {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
          }
        } catch (err: any) {
          console.warn("Story play failed on unmute", err.name);
        }
      }
      return;
    }

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.warn("Story play failed", err.name);
        setIsPlaying(false);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      if (!videoRef.current.muted) {
        videoRef.current.removeAttribute('muted');
      } else {
        videoRef.current.setAttribute('muted', '');
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-[110] flex gap-1 p-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <div 
            className="h-full bg-fire transition-all duration-100 ease-linear" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header Info */}
      <div className="absolute top-4 left-0 right-0 z-[110] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-fire/20 p-2 flex items-center justify-center">
            <Maximize2 className="h-5 w-5 text-fire" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white line-clamp-1">{title || "Vídeo da Receita"}</h4>
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Passo a Passo</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Video Player */}
      <div className="relative aspect-[9/16] h-full max-h-[90vh] w-full max-w-full overflow-hidden rounded-2xl shadow-2xl shadow-fire/10 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={url}
          className="h-full w-full object-contain"
          autoPlay
          muted={false}
          playsInline
          onEnded={onClose}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        />
        
        {/* Play/Pause Overlay Indicator (shows temporarily) */}
        {isMuted && isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-2 rounded-full bg-black/60 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition active:scale-95 border border-white/10"
          >
            <VolumeX className="w-4 h-4" />
            Toque para ativar o som
          </button>
        )}
        
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white/10 backdrop-blur-md pointer-events-none">
              <Play className="h-10 w-10 text-white fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Controls Footer */}
      <div className="absolute bottom-10 flex gap-4">
        <button 
          onClick={togglePlay}
          className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button 
          onClick={toggleMute}
          className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
