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

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
  const isGoogleDrive = src.includes('drive.google.com');
  
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // YouTube
    if (isYouTube) {
      if (url.includes('youtube.com/embed/')) return url;
      
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&vq=hd1080`;
      }
    }

    // Google Drive
    if (isGoogleDrive) {
      if (url.includes('/preview')) return url;
      const match = url.match(/\/file\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    
    return url;
  };

  useEffect(() => {
    if (isYouTube || isGoogleDrive) {
      setIsLoading(false);
      return;
    }

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
  }, [videoId, onProgress, isYouTube, isGoogleDrive]);

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

  if (isYouTube || isGoogleDrive) {
    return (
      <div className={cn("relative aspect-[9/16] max-h-[85vh] w-full mx-auto bg-black rounded-xl overflow-hidden glass", className)}>
        <iframe
          src={getEmbedUrl(src)}
          className="absolute inset-0 w-full h-full object-cover border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div 
      className={cn("relative group aspect-[9/16] max-h-[85vh] mx-auto bg-black rounded-xl overflow-hidden glass", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !videoRef.current?.paused && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        playsInline
        controls={false} // Custom controls
        preload="auto" // Changed from metadata to auto for better initial quality/loading
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      >
        <source src={src} type="video/mp4" />
        {/* Support for original quality by ensuring no browser-side compression is hinted */}
      </video>

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
