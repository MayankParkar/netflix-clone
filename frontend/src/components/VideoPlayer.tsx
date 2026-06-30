import { useEffect, useRef } from 'react';
import type { Movie } from '../types/movie';
import { getStreamUrl } from '../lib/api';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
}

export function VideoPlayer({ movie, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close on Escape key — standard UX pattern for modal/fullscreen overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Auto-play when the player mounts
  useEffect(() => {
    videoRef.current?.play().catch(() => {
      // Autoplay can be blocked by the browser if there's no prior user
      // interaction — this is a common browser policy, not a bug
      console.log('Autoplay blocked — user must press play manually');
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:text-neutral-300
          bg-black/50 rounded-full p-2"
        aria-label="Close player"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* 
        The native <video> element does ALL the HTTP Range Request work for us.
        When the browser renders this tag, it automatically:
          1. Requests metadata first (small range request)
          2. Requests video chunks as playback progresses
          3. Sends new range requests when the user seeks
        This is the browser's built-in media engine talking directly to
        our Express streamController from Step 4.
      */}
      <video
        ref={videoRef}
        controls
        className="w-full h-full max-h-screen"
        src={getStreamUrl(movie.id)}
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}
