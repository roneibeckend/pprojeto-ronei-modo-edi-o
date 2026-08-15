import React, { useEffect, useRef, useState } from 'react';
import { Play, Loader2, Maximize, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
      if (!isMobileDevice) {
        setShowControls(true);
        startControlsTimer();
      }
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
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&vq=hd1080&controls=1&disablekb=0&fs=1&playsinline=1&mute=1`;
      }
    }

    // Google Drive
    if (isGoogleDrive) {
      if (url.includes('/preview')) return url;
      const match = url.match(/\/file\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview?autoplay=1&mute=1`;
      }
    }
    
    return url;
  };

  // Keep latest onProgress without re-running the media effect
  const onProgressRef = useRef(onProgress);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);

  // Diagnostics + progress tracking. Runs only when the actual media changes.
  useEffect(() => {
    if (isYouTube || isGoogleDrive) {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const log = (event: string) => {
      console.log(
        `[VideoPlayer:${event}] readyState=${video.readyState} networkState=${video.networkState} ` +
        `t=${video.currentTime.toFixed(2)} dur=${Number.isFinite(video.duration) ? video.duration.toFixed(2) : 'NaN'} ` +
        `buffered=${video.buffered.length ? `${video.buffered.start(0).toFixed(2)}-${video.buffered.end(video.buffered.length - 1).toFixed(2)}` : 'none'}`
      );
    };

    const diagnosticEvents = [
      'loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'canplay',
      'canplaythrough', 'play', 'playing', 'pause', 'waiting', 'stalled',
      'suspend', 'seeking', 'seeked', 'ended', 'error', 'abort', 'emptied',
    ];
    const listeners = diagnosticEvents.map((name) => {
      const fn = () => log(name);
      video.addEventListener(name, fn);
      return [name, fn] as const;
    });

    // Safety net: never leave the spinner up forever. Never call load() here,
    // as that restarts the download and creates the mobile loading loop.
    const loadingTimeout = setTimeout(() => setIsLoading(false), 20000);

    const handleTimeUpdate = () => {
      localStorage.setItem(`video_progress_${videoId}`, video.currentTime.toString());
      onProgressRef.current?.(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      clearTimeout(loadingTimeout);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      listeners.forEach(([name, fn]) => video.removeEventListener(name, fn));
    };
  }, [src, videoId, isYouTube, isGoogleDrive]);



  // Intro videos: try a muted autoplay once the media is ready.
  // If the browser blocks it (mobile policies), fall back to tap-to-play.
  const autoplayTriedRef = useRef(false);
  useEffect(() => {
    autoplayTriedRef.current = false;
    if (src && !isYouTube && !isGoogleDrive) {
      // Small delay to allow browser to settle
      const timer = setTimeout(tryAutoplay, 300);
      return () => clearTimeout(timer);
    }
  }, [src]);

  const tryAutoplay = async () => {
    const video = videoRef.current;
    if (!video || !isIntro) return;
    
    autoplayTriedRef.current = true;
    
    // Critical: Mobile autoplay MUST be muted.
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true'); // Support for some Android browsers
    setIsMuted(true);
    
    console.log(`[VideoPlayer:tryAutoplay] Attempting muted play for intro video: ${videoId}`);
    
    try {
      // Force loading if needed
      if (video.readyState < 1) {
        video.load();
      }

      // Explicitly set muted again before playing to satisfy mobile policies
      video.muted = true;
      video.setAttribute('muted', '');
      
      const p = video.play();
      if (p !== undefined) {
        await p;
        console.log(`[VideoPlayer:tryAutoplay] Playback started successfully for: ${videoId}`);
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.warn(`[VideoPlayer:tryAutoplay] Playback rejected for: ${videoId}`, err.name);
      // Fallback: If even muted autoplay fails, we just wait for a user gesture
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const togglePlay = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // Critical for mobile: call play() synchronously inside the user gesture.
      // Reset state for a fresh attempt
      video.removeAttribute('muted');
      video.muted = false;
      video.volume = 1;
      setIsMuted(false);
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`[VideoPlayer:togglePlay] Success`);
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((err) => {
            console.warn('[VideoPlayer:togglePlay] Play failed, retrying muted:', err.name);
            // Fallback: Try playing muted if unmuted is rejected (browser policy)
            video.muted = true;
            setIsMuted(true);
            video.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
              })
              .catch((err2) => {
                console.error('[VideoPlayer:togglePlay] Muted retry also failed:', err2.name);
                setIsPlaying(false);
              });
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
    handleInteraction();
  };

  const unmute = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    setIsMuted(false);
    if (video.paused) {
      video.play().catch(err => {
        console.warn("Unmute play failed", err);
      });
    }
    handleInteraction();
  };


  if (isYouTube || isGoogleDrive) {
    const embedUrl = getEmbedUrl(src);
    const finalUrl = hideAllUI 
      ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&enablejsapi=1`
      : `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`;

    return (
      <div className={cn("relative aspect-[9/16] max-h-[85vh] w-full mx-auto bg-black rounded-xl overflow-hidden glass", className)}>
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
          <iframe
            src={finalUrl}
            className="absolute inset-0 w-full h-full object-contain border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title || "Video Player"}
          />
        </div>

        {/* User Interaction Layer - Block native controls and allow toggle */}
        <div 
          className="absolute inset-0 z-50 bg-transparent cursor-pointer" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Since we can't easily control generic iframes, we just let it be,
            // but for future-proofing we could add message passing here.
          }} 
        />
      </div>
    );
  }


  // On phones/tablets we hand over to the native controls: they are touch-friendly,
  // support fullscreen/scrubbing and never fight the browser's gesture requirements.
  const useNativeControls = isMobileDevice;

  return (
    <div 
      className={cn("relative group aspect-[9/16] max-h-[85vh] mx-auto bg-black rounded-xl overflow-hidden glass", "cursor-pointer", className)}
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
    >
      


      <video
        key={src}
        ref={videoRef}
        src={src}
        poster={poster}
        className={cn(
          "w-full h-full", 
          (useNativeControls || isIntro)
            ? "object-contain bg-black" 
            : "object-cover"
        )}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        controls={useNativeControls}
        preload="auto"
        controlsList="nodownload noremoteplayback"
        muted={isIntro || isMobileDevice}
        autoPlay={isIntro || isMobileDevice}
        loop={isIntro}
        onLoadStart={() => {
          setIsLoading(true);
        }}
        onLoadedMetadata={() => {
          // Metadata is enough to try initial play for intro
          if (isIntro) {
            tryAutoplay();
          }
        }}
        onCanPlay={() => {
          // CanPlay means enough buffer to start
          if (isIntro) {
            tryAutoplay();
          } else {
            // For normal videos, we wait for user interaction to call togglePlay,
            // but we can remove the loader now.
            setIsLoading(false);
          }
        }}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => {
          const video = videoRef.current;
          // Only show the spinner for a genuine buffer underrun.
          if (video && video.readyState < video.HAVE_ENOUGH_DATA) setIsLoading(true);
        }}
        onStalled={() => {
          console.warn('[VideoPlayer:onStalled] Video stalled');
          const video = videoRef.current;
          if (video && video.paused && isPlaying) {
             video.play().catch(() => {});
          }
        }}
        onSuspend={() => {
          console.log('[VideoPlayer:onSuspend] Video suspend - playback might be throttled by browser');
        }}
        onError={(e) => {
          setIsLoading(false);
          setIsPlaying(true); // Don't block the UI if it's just a temporary error
          const video = videoRef.current;
          if (video?.error) {
            console.error('Video error code:', video.error.code, 'message:', video.error.message);
            
            // Critical error fallback: show the poster or a message
            if (video.error.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
               toast.error("Erro ao carregar o vídeo. Tente recarregar a página.");
            }
          }
        }}
        onClick={(e) => {
          // If native controls are on, clicking the video might interfere.
          // We only intercept if it's our custom overlay or if native controls are off.
          if (!useNativeControls) {
            e.stopPropagation();
            togglePlay(e);
          }
        }}
      />



      {/* Loading Overlay */}
      {isLoading && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-fire" />
            <span className="text-white/70 text-xs font-medium animate-pulse">Carregando...</span>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {videoRef.current?.error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-fire mb-4" />
          <h3 className="text-white font-bold mb-2">Ops! O vídeo não carregou</h3>
          <p className="text-white/60 text-sm mb-6">Tente recarregar a página ou verifique sua conexão.</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-fire px-6 py-2 text-sm"
          >
            Recarregar
          </button>
        </div>
      )}

      {/* UI Overlay: only visible on desktop OR when the video is not yet playing on mobile.
          We hide it entirely on mobile while playing to avoid blocking native controls. */}
      {(!useNativeControls || !isPlaying) && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/10 transition-all duration-300 z-30",
            (isPlaying && isIntro) ? "opacity-0 invisible pointer-events-none" :
            useNativeControls
              ? (isPlaying ? "opacity-0 invisible pointer-events-none" : "opacity-100 visible")
              : ((!isPlaying || showControls) ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none")
          )}
          onClick={useNativeControls ? (isPlaying ? undefined : togglePlay) : (e) => {
            e.stopPropagation();
            e.preventDefault();
            togglePlay(e);
          }}
        >
          {!isLoading ? (
            <div className={cn(
              "w-20 h-20 rounded-full bg-fire shadow-fire flex items-center justify-center transform transition active:scale-95 hover:scale-110",
              useNativeControls && isPlaying && "hidden" // Extra safety for mobile persistent buttons
            )}>
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
            <div className={cn(
              "w-20 h-20 rounded-full bg-fire/20 flex items-center justify-center",
              useNativeControls && isPlaying && "hidden"
            )}>
              <Loader2 className="w-10 h-10 animate-spin text-fire" />
            </div>
          )}
        </div>
      )}

      {/* Muted playback started automatically: offer a touch-friendly way to enable sound */}
      {isMuted && isPlaying && (
        <button
          onClick={unmute}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-fire px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-fire/20 transition active:scale-95 animate-in fade-in zoom-in duration-500"
        >
          <VolumeX className="w-4 h-4" />
          Toque para ativar o som
        </button>
      )}

      {/* Desktop-only extra controls */}
      {!useNativeControls && showControls && (
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
