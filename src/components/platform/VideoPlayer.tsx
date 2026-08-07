import React, { useEffect, useRef, useState } from 'react';
import { Play, Loader2, Maximize, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  videoId: string; // Used for saving progress
  onProgress?: (progress: number) => void;
  className?: string;
}

export function VideoPlayer({ 
  src, 
  poster, 
  title, 
  videoId,
  onProgress,
  className 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Load saved position
    const savedTime = localStorage.getItem(`video_progress_${videoId}`);
    if (savedTime) {
      video.currentTime = parseFloat(savedTime);
    }

    const handleTimeUpdate = () => {
      localStorage.setItem(`video_progress_${videoId}`, video.currentTime.toString());
      if (onProgress) onProgress(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoId, onProgress]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div 
      className={cn("relative group aspect-video bg-black rounded-xl overflow-hidden glass", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !videoRef.current?.paused && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        controls={false} // Custom controls
        preload="metadata"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 animate-spin text-fire" />
        </div>
      )}

      {/* Play Overlay */}
      {!isPlaying && !isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors cursor-pointer z-10"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-fire shadow-fire flex items-center justify-center transform transition group-hover:scale-110">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Subtle Bottom Bar (Simplified) */}
      <div className={cn(
        "absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 z-20",
        showControls || !isPlaying ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <button onClick={togglePlay} className="text-white hover:text-fire transition">
               {isPlaying ? "Pausar" : "Reproduzir"}
             </button>
             {title && <span className="text-xs font-bold uppercase tracking-widest text-white/70 truncate max-w-[200px]">{title}</span>}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if(videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="text-white/70 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => videoRef.current?.requestFullscreen()}
              className="text-white/70 hover:text-white"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
