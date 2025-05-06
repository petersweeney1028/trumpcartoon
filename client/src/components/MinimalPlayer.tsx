import React, { useState, useRef, useEffect } from 'react';
import type { ClipInfo } from '@shared/schema';

interface MinimalPlayerProps {
  clipInfo: ClipInfo;
  script: {
    trump1: string;
    zelensky: string;
    trump2: string;
    vance: string;
  };
  onPlayPauseToggle?: (isPlaying: boolean) => void;
}

type CharacterSegment = 'trump1' | 'zelensky' | 'trump2' | 'vance';

/**
 * MinimalPlayer - The absolute simplest implementation possible
 * Uses only video element with direct attributes and minimal JavaScript
 */
const MinimalPlayer: React.FC<MinimalPlayerProps> = ({
  clipInfo,
  script,
  onPlayPauseToggle
}) => {
  // Simple state
  const [currentSegment, setCurrentSegment] = useState<CharacterSegment>('trump1');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Segments in sequence
  const segments: CharacterSegment[] = ['trump1', 'zelensky', 'trump2', 'vance'];
  
  // Current sources
  const videoSrc = 
    currentSegment === 'trump1' ? `/static${clipInfo.trump1Video}` :
    currentSegment === 'zelensky' ? `/static${clipInfo.zelenskyVideo}` :
    currentSegment === 'trump2' ? `/static${clipInfo.trump2Video}` :
    `/static${clipInfo.vanceVideo}`;
  
  const audioSrc = 
    currentSegment === 'trump1' ? `/static${clipInfo.trump1Audio}` :
    currentSegment === 'zelensky' ? `/static${clipInfo.zelenskyAudio}` :
    currentSegment === 'trump2' ? `/static${clipInfo.trump2Audio}` :
    `/static${clipInfo.vanceAudio}`;
  
  // Effect to play when video source changes
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    const playMedia = () => {
      video.play()
        .then(() => {
          audio.play()
            .then(() => {
              setIsPlaying(true);
              if (onPlayPauseToggle) onPlayPauseToggle(true);
            })
            .catch(err => {
              console.error('Failed to play audio:', err);
            });
        })
        .catch(err => {
          console.error('Failed to play video:', err);
        });
    };
    
    // Play when canplay fires
    const handleCanPlay = () => {
      if (video.readyState >= 3 && audio.readyState >= 3) {
        playMedia();
      }
    };
    
    // Set up logic for when current segment ends
    const handleEnded = () => {
      const currentIndex = segments.indexOf(currentSegment);
      
      if (currentIndex < segments.length - 1) {
        // Move to next segment
        setCurrentSegment(segments[currentIndex + 1]);
      } else {
        // End of all segments
        setIsPlaying(false);
        if (onPlayPauseToggle) onPlayPauseToggle(false);
      }
    };
    
    // Add listeners
    video.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      
      // Clean up by pausing media when unmounted or changing segments
      video.pause();
      audio.pause();
    };
  }, [currentSegment, onPlayPauseToggle, segments]);
  
  // Handle manual play/pause
  const togglePlayPause = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (!video || !audio) return;
    
    if (isPlaying) {
      video.pause();
      audio.pause();
      setIsPlaying(false);
      if (onPlayPauseToggle) onPlayPauseToggle(false);
    } else {
      video.play()
        .then(() => audio.play())
        .then(() => {
          setIsPlaying(true);
          if (onPlayPauseToggle) onPlayPauseToggle(true);
        })
        .catch(err => {
          console.error('Error playing media:', err);
        });
    }
  };
  
  return (
    <div className="bg-dark rounded-lg overflow-hidden shadow-lg relative">
      <div className="relative pt-[56.25%]">
        {/* Video element */}
        <video 
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          preload="auto"
          muted={true} // Mute since audio comes from audio element
          onClick={togglePlayPause}
        />
        
        {/* Hidden audio element */}
        <audio 
          ref={audioRef}
          src={audioSrc}
          preload="auto"
        />
        
        {/* Play button */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10"
            onClick={togglePlayPause}
          >
            <button
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg"
              aria-label="Play"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-12 h-12 text-dark"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20">
          <p className="text-white font-medium text-lg text-center">
            {script[currentSegment]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MinimalPlayer;