import React, { useEffect, useRef, useState } from 'react';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  videoId: string; // Used for saving progress
  onProgress?: (progress: number) => void;
  className?: string;
  aspect?: 'video' | 'portrait';
  /** Kept for API compatibility. Intro videos never autoplay: the user always taps play. */
  isIntro?: boolean;
}

const isYouTubeUrl = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');
const isDriveUrl = (url: string) => url.includes('drive.google.com');

function getYouTubeId(url: string) {
  if (url.includes('youtube.com/embed/')) return url.split('/embed/')[1]?.split(/[?&/]/)[0] ?? '';
  if (url.includes('youtube.com/watch?v=')) return url.split('v=')[1]?.split('&')[0] ?? '';
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split(/[?&/]/)[0] ?? '';
  return '';
}

function getDriveId(url: string) {
  const match = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  return match?.[1] ?? '';
}

/** Proxy route: streams the Drive file so the native player can render a clean UI with audio. */
function getDriveStream(url: string) {
  const id = getDriveId(url);
  return id ? `/api/public/drive-video?id=${encodeURIComponent(id)}` : url;
}

export function VideoPlayer({
  src,
  poster,
  title,
  videoId,
  onProgress,
  className,
  aspect = 'video',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isYouTube = isYouTubeUrl(src);
  const isDrive = isDriveUrl(src);
  // Only YouTube keeps an iframe. Google Drive files are streamed through our
  // proxy so the browser's own (single, clean) control bar is used and audio works.
  const isEmbed = isYouTube;
  const playableSrc = isDrive ? getDriveStream(src) : src;
  const driveId = isDrive ? getDriveId(src) : '';
  const cleanPoster = poster || (driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200` : undefined);
  const frameClass = aspect === 'portrait' ? 'aspect-[9/16]' : 'aspect-video';


  // Reset when the media changes
  useEffect(() => {
    setStarted(false);
    setIsLoading(false);
    setHasError(false);
  }, [src]);

  // Progress persistence (native <video> only)
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    if (isEmbed) return;
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      try {
        localStorage.setItem(`video_progress_${videoId}`, String(video.currentTime));
      } catch {
        /* storage may be unavailable */
      }
      onProgressRef.current?.(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [src, videoId, isEmbed]);

  // ---- Embedded providers (YouTube / Google Drive): render only after the user taps play
  if (isEmbed) {
    const ytId = isYouTubeUrl(src) ? getYouTubeId(src) : '';
    const embedUrl = ytId
      ? `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1`
      : `${getDriveEmbed(src)}?autoplay=1`;
    const thumb = poster || (ytId ? `https://i.ytimg.com/vi/${ytId}/hq720.jpg` : undefined);

    return (
      <div className={cn('relative w-full mx-auto bg-black rounded-xl overflow-hidden shadow-2xl', frameClass, className)}>
        {started ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            title={title || 'Vídeo'}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStarted(true)}
            aria-label="Reproduzir vídeo"
            className="absolute inset-0 h-full w-full rounded-none p-0 hover:bg-transparent"
          >
            {thumb && (
              <img src={thumb} alt={title || 'Capa do vídeo'} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            )}
            <span className="absolute inset-0 bg-black/30" />
            <span className="relative w-20 h-20 rounded-full bg-fire shadow-fire flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
              <Play className="w-8 h-8 text-white ml-1 fill-current" />
            </span>
          </Button>
        )}
      </div>
    );
  }

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    setHasError(false);
    setIsLoading(true);
    setStarted(true);
    try {
      if (video.currentTime === 0) {
        try {
          const saved = Number(localStorage.getItem(`video_progress_${videoId}`));
          if (Number.isFinite(saved) && saved > 0 && saved < video.duration) video.currentTime = saved;
        } catch {
          /* storage may be unavailable */
        }
      }
      await video.play();
    } catch {
      // Autoplay policies: fall back to native controls; the user can press play again.
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('relative mx-auto bg-black rounded-xl overflow-hidden shadow-2xl', frameClass, className)}>
      <video
        key={src}
        ref={videoRef}
        src={playableSrc}
        poster={cleanPoster}
        title={title}
        className="h-full w-full object-cover bg-black"
        playsInline
        webkit-playsinline="true"
        preload="none"
        controls={started}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture

        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      {/* Clean cover with a single play button until playback starts */}
      {!started && !hasError && (
        <Button
          type="button"
          variant="ghost"
          onClick={handlePlay}
          aria-label="Reproduzir vídeo"
          className="absolute inset-0 h-full w-full rounded-none bg-black/20 p-0 hover:bg-black/20"
        >
          <span className="w-20 h-20 rounded-full bg-fire shadow-fire flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
            <Play className="w-8 h-8 text-white ml-1 fill-current" />
          </span>
        </Button>
      )}




      {isLoading && started && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 pointer-events-none">
          <Loader2 className="w-10 h-10 animate-spin text-fire" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-fire mb-3" />
          <h3 className="text-white font-bold mb-1">O vídeo não carregou</h3>
          <p className="text-white/60 text-sm mb-5">Verifique sua conexão e tente novamente.</p>
          <Button
            type="button"
            onClick={() => {
              setHasError(false);
              setStarted(false);
              videoRef.current?.load();
            }}
            className="btn-fire px-6 py-2 text-sm"
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}
