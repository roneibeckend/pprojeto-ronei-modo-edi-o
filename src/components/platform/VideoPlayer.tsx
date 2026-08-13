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
  isIntro?: boolean;
}

export function VideoPlayer({ 
  src, 
  poster, 
  title, 
  videoId,
  onProgress,
  className,
  isIntro = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  
  // Detection for mobile to hide UI on intro videos
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth < 1024;
      setIsMobileDevice(isMobileUA || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleInitialControls = () => {
      setShowControls(true);
      startControlsTimer();
    };
    handleInitialControls();

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const startControlsTimer = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleInteraction = () => {
    setShowControls(true);
    startControlsTimer();
  };


  const hideAllUI = isIntro && isMobileDevice;


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
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&vq=hd1080&controls=1&disablekb=0&fs=1&playsinline=1`;
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

  const togglePlay = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        // Force reload if stalled or in a bad state
        if (video.readyState === 0) {
          video.load();
        }
        
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error("Erro ao reproduzir vídeo:", err);
          // If interaction failed, try unmuting if it was muted by intro logic
          if (video.muted && !isMuted) {
             video.muted = false;
             video.play().catch(e => console.error("Second attempt failed:", e));
          }
          setIsPlaying(false);
        });
      } else {
        video.pause();
        setIsPlaying(false);
      }
      handleInteraction();
    }
  };


  if (isYouTube || isGoogleDrive) {
    const embedUrl = getEmbedUrl(src);
    const finalUrl = hideAllUI 
      ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0`
      : `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`;

    return (
      <div className={cn("relative aspect-[9/16] max-h-[85vh] w-full mx-auto bg-black rounded-xl overflow-hidden glass", className)}>
        <iframe
          src={finalUrl}
          className="absolute inset-0 w-[100.5%] h-[100.5%] -left-[0.25%] -top-[0.25%] object-cover border-0 scale-[1.12]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {hideAllUI && <div className="absolute inset-0 z-50 bg-transparent" onClick={togglePlay} />}
      </div>
    );
  }


  return (
    <div 
      className={cn("relative group aspect-[9/16] max-h-[85vh] mx-auto bg-black rounded-xl overflow-hidden glass cursor-pointer", className)}
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >

      <video
        key={src}
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover scale-[1.12]"
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        controls={false}
        preload="auto"
        muted={isIntro} // Autoplay policy: intro videos must start muted on some mobile browsers
        autoPlay={isIntro} // Attempt autoplay for intro
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => {
          setIsLoading(false);
          // Auto-start if it's an intro and was supposed to be playing
          if (isIntro && videoRef.current) {
            videoRef.current.play().catch(() => {
              // Silently fail if blocked by browser policy, user will hit the center button
              console.log("Autoplay blocked, waiting for interaction");
            });
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={() => togglePlay()}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 animate-spin text-fire" />
        </div>
      )}

      {/* Play/Pause Center Button Overlay */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/10 transition-all duration-300 z-30",
          (!isPlaying || showControls) ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        {!isLoading ? (
          <div className="w-20 h-20 rounded-full bg-fire shadow-fire flex items-center justify-center transform transition active:scale-95 hover:scale-110">
            {isPlaying ? (
              <div className="flex gap-1.5">
                <div className="w-2 h-8 bg-white rounded-full" />
                <div className="w-2 h-8 bg-white rounded-full" />
              </div>
            ) : (
              <Play className="w-8 h-8 text-white ml-1 fill-current" />
            )}
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-fire/20 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-fire" />
          </div>
        )}
      </div>


      {/* Controls Overlay (Volume/Fullscreen) */}
      {!hideAllUI && showControls && (
        <div className="absolute top-4 right-4 flex flex-col items-center gap-3 z-40">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if(videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
                handleInteraction();
              }}
              className="text-white/70 hover:text-white p-2 rounded-full bg-black/40 backdrop-blur-sm transition-all active:scale-90"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                videoRef.current?.requestFullscreen();
                handleInteraction();
              }}
              className="text-white/70 hover:text-white p-2 rounded-full bg-black/40 backdrop-blur-sm transition-all active:scale-90"
            >
              <Maximize className="w-5 h-5" />
            </button>
        </div>
      )}


    </div>
  );
}
